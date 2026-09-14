import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db.js";
import { getSessionFromRequest } from "../../../lib/auth.js";
import { canManageFloor, canManageKitchen } from "../../../lib/permissions.js";
import { resolveOutletForSession } from "../../../lib/scope.js";
import { emitOutletEvent } from "../../../lib/realtimeBus.js";

export const dynamic = "force-dynamic";

function shapeOrder(order) {
  return {
    ...order,
    timestamp: new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    items: order.items.map((item) => ({ ...item, id: item.id })),
  };
}

export async function GET(request) {
  const session = getSessionFromRequest(request);
  const url = new URL(request.url);
  const outlet = await resolveOutletForSession(session, url.searchParams.get('hotelId'));
  if (!outlet) return NextResponse.json({ error: 'Hotel access required.' }, { status: 403 });

  const page = Number(url.searchParams.get('page') || '1');
  const limit = Number(url.searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;
  const statusParam = url.searchParams.get('status');
  const statusList = statusParam ? statusParam.split(',') : ['billed', 'done'];

  const orders = await prisma.order.findMany({
    where: { outletId: outlet.id, status: { in: statusList } },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });
  return NextResponse.json({ outlet, orders: orders.map(shapeOrder), page, limit });
}

export async function POST(request) {
  const session = getSessionFromRequest(request);
  if (!canManageFloor(session?.role)) return NextResponse.json({ error: "Only waiter or POS machine can create orders." }, { status: 403 });

  const body = await request.json();
  const outlet = await resolveOutletForSession(session, body.hotelId);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ error: "At least one item is required." }, { status: 400 });

  const menuIds = items.map((item) => item.menuItemId || item.id);
  const menuItems = await prisma.menuItem.findMany({ where: { outletId: outlet.id, id: { in: menuIds }, available: true } });
  const menuById = new Map(menuItems.map((item) => [item.id, item]));
  const orderItems = items.map((item) => {
    const menuItem = menuById.get(item.menuItemId || item.id);
    const quantity = Number(item.quantity);
    if (!menuItem || !Number.isInteger(quantity) || quantity < 1) return null;
    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      category: menuItem.category,
      price: menuItem.price,
      quantity,
      status: "preparing",
    };
  }).filter(Boolean);

  if (orderItems.length !== items.length) return NextResponse.json({ error: "Order contains invalid menu items." }, { status: 400 });

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const clientOrderKey = String(body.clientOrderKey || "").trim();
  const customOrderId = String(body.orderId || "").trim();

  // Idempotency check: Return existing order if clientOrderKey or customOrderId already committed
  let existingOrder = null;
  if (clientOrderKey) {
    existingOrder = await prisma.order.findFirst({
      where: { outletId: outlet.id, notes: { contains: clientOrderKey } },
      include: { items: true },
    });
  }
  if (!existingOrder && customOrderId) {
    existingOrder = await prisma.order.findUnique({
      where: { id: customOrderId },
      include: { items: true },
    });
  }

// If no existing order found via clientOrderKey or customOrderId, check for active order on the same table to prevent duplicate KOT
if (!existingOrder) {
  const activeOrder = await prisma.order.findFirst({
    where: { outletId: outlet.id, tableNumber: Number(body.tableNumber), status: { in: ["preparing", "done"] } },
    include: { items: true },
  });
  if (activeOrder) {
    return NextResponse.json({ error: "An active order already exists for this table." }, { status: 409 });
  }
}

  if (existingOrder) {
    const existingItemIds = new Set(existingOrder.items.map((it) => it.id));
    const itemsToInsert = items.map((item) => {
      const menuItem = menuById.get(item.menuItemId || item.id);
      const quantity = Number(item.quantity);
      const itemId = String(item.id || "").trim();
      if (!menuItem || !Number.isInteger(quantity) || quantity < 1 || (itemId && existingItemIds.has(itemId))) {
        return null;
      }
      return {
        id: itemId || undefined,
        menuItemId: menuItem.id,
        name: menuItem.name,
        category: menuItem.category,
        price: menuItem.price,
        quantity,
        status: "preparing",
      };
    }).filter(Boolean);

    if (itemsToInsert.length > 0) {
      const addedAmount = itemsToInsert.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const updated = await prisma.$transaction(async (tx) => {
        await tx.orderItem.createMany({
          data: itemsToInsert.map((it) => ({
            id: it.id,
            orderId: existingOrder.id,
            menuItemId: it.menuItemId,
            name: it.name,
            category: it.category,
            price: it.price,
            quantity: it.quantity,
            status: it.status,
          })),
        });
        return tx.order.update({
          where: { id: existingOrder.id },
          data: { totalAmount: existingOrder.totalAmount + addedAmount, status: "preparing" },
          include: { items: true },
        });
      });
      emitOutletEvent(outlet.id, "orders:update", { orderId: updated.id });
      return NextResponse.json({ order: shapeOrder(updated) }, { status: 200 });
    }

    return NextResponse.json({ order: shapeOrder(existingOrder) }, { status: 200 });
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        id: customOrderId || undefined,
        outletId: outlet.id,
        tableNumber: Number(body.tableNumber),
        waiterName: session.name || "Waiter",
        notes: clientOrderKey ? `[KEY:${clientOrderKey}] ${String(body.notes || "").trim()}` : String(body.notes || "").trim(),
        totalAmount,
        items: {
          create: orderItems.map((it, idx) => ({
            id: String(items[idx]?.id || "").trim() || undefined,
            menuItemId: it.menuItemId,
            name: it.name,
            category: it.category,
            price: it.price,
            quantity: it.quantity,
            status: it.status,
          })),
        },
      },
      include: { items: true },
    });
    await tx.table.updateMany({ where: { outletId: outlet.id, number: Number(body.tableNumber) }, data: { status: "Occupied", currentOrderId: created.id } });
    return created;
  });

  emitOutletEvent(outlet.id, "orders:create", { orderId: order.id });
  return NextResponse.json({ order: shapeOrder(order) }, { status: 201 });
}

export async function PATCH(request) {
  const session = getSessionFromRequest(request);
  const body = await request.json();
  const order = body.orderId ? await prisma.order.findUnique({ where: { id: body.orderId }, include: { outlet: true, items: true } }) : null;
  const outlet = order ? await resolveOutletForSession(session, order.outlet.hotelId) : null;
  if (!order || !outlet) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (body.action === "item-status") {
    if (!canManageKitchen(session?.role)) return NextResponse.json({ error: "Kitchen access required." }, { status: 403 });
    const item = await prisma.orderItem.update({ where: { id: body.itemId }, data: { status: body.status === "done" ? "done" : "preparing" } });
    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
    const status = items.every((row) => row.id === item.id ? item.status === "done" : row.status === "done") ? "done" : "preparing";
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status, completedAt: status === "done" ? new Date() : null }, include: { items: true } });
    emitOutletEvent(outlet.id, "orders:update", { orderId: order.id });
    return NextResponse.json({ order: shapeOrder(updated) });
  }

  if (body.action === "mark-done") {
    if (!canManageKitchen(session?.role)) return NextResponse.json({ error: "Kitchen access required." }, { status: 403 });
    const updated = await prisma.$transaction(async (tx) => {
      await tx.orderItem.updateMany({ where: { orderId: order.id }, data: { status: "done" } });
      return tx.order.update({ where: { id: order.id }, data: { status: "done", completedAt: new Date() }, include: { items: true } });
    });
    emitOutletEvent(outlet.id, "orders:update", { orderId: order.id });
    return NextResponse.json({ order: shapeOrder(updated) });
  }

  if (body.action === "bill") {
    if (!canManageFloor(session?.role)) return NextResponse.json({ error: "Floor access required." }, { status: 403 });
    const lastBill = await prisma.order.findFirst({ where: { outletId: outlet.id, billNumber: { not: null } }, orderBy: { billNumber: "desc" } });
    const billNumber = (lastBill?.billNumber || 0) + 1;
    const updated = await prisma.$transaction(async (tx) => {
      const billed = await tx.order.update({ where: { id: order.id }, data: { status: "billed", billNumber, billedAt: new Date() }, include: { items: true } });
      await tx.table.updateMany({ where: { outletId: outlet.id, number: order.tableNumber }, data: { status: "Available", currentOrderId: null } });
      return billed;
    });
    emitOutletEvent(outlet.id, "orders:billed", { orderId: order.id, billNumber });
    return NextResponse.json({ order: shapeOrder(updated) });
  }

  return NextResponse.json({ error: "Unsupported order action." }, { status: 400 });
}

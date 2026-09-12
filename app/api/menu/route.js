import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db.js";
import { getSessionFromRequest } from "../../../lib/auth.js";
import { canEditOutletMenu, resolveOutletForSession } from "../../../lib/scope.js";

export const dynamic = "force-dynamic";

function normalizeItem(body) {
  return {
    name: String(body.name || "").trim(),
    category: String(body.category || "General").trim(),
    price: Number(body.price),
    description: String(body.description || "").trim(),
    kitchenNote: String(body.kitchenNote || "").trim(),
    billNote: String(body.billNote || "").trim(),
    prepTime: String(body.prepTime || "10 mins").trim(),
    available: body.available !== false,
    trackStock: Boolean(body.trackStock),
    stockQuantity: Number.isFinite(Number(body.stockQuantity)) ? Number(body.stockQuantity) : 0,
    lowStockThreshold: Number.isFinite(Number(body.lowStockThreshold)) ? Number(body.lowStockThreshold) : 10,
  };
}

export async function GET(request) {
  const session = getSessionFromRequest(request);
  const hotelId = new URL(request.url).searchParams.get("hotelId");
  const outlet = await resolveOutletForSession(session, hotelId);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });

  const items = await prisma.menuItem.findMany({
    where: { outletId: outlet.id },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ outlet, items });
}

export async function POST(request) {
  const session = getSessionFromRequest(request);
  if (!canEditOutletMenu(session?.role)) return NextResponse.json({ error: "Only hotel owners can edit menu." }, { status: 403 });

  const body = await request.json();
  const outlet = await resolveOutletForSession(session, body.hotelId);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });

  const data = normalizeItem(body);
  if (!data.name || !Number.isFinite(data.price) || data.price < 0) {
    return NextResponse.json({ error: "Dish name and valid price are required." }, { status: 400 });
  }

  const item = await prisma.menuItem.create({ data: { ...data, outletId: outlet.id } });
  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request) {
  const session = getSessionFromRequest(request);
  if (!canEditOutletMenu(session?.role)) return NextResponse.json({ error: "Only hotel owners can edit menu." }, { status: 403 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "Menu item is required." }, { status: 400 });

  const existing = await prisma.menuItem.findUnique({ where: { id: body.id }, include: { outlet: true } });
  const outlet = existing ? await resolveOutletForSession(session, existing.outlet.hotelId) : null;
  if (!existing || !outlet) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });

  const data = normalizeItem({ ...existing, ...body });
  if (!data.name || !Number.isFinite(data.price) || data.price < 0) {
    return NextResponse.json({ error: "Dish name and valid price are required." }, { status: 400 });
  }

  const item = await prisma.menuItem.update({ where: { id: body.id }, data });
  return NextResponse.json({ item });
}

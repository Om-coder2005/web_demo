import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";
import { resolveOutletForSession } from "../../../../lib/scope.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = getSessionFromRequest(request);
  const url = new URL(request.url);
  const hotelId = url.searchParams.get("hotelId");
  const outlet = await resolveOutletForSession(session, hotelId);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [revenueRow, activeOrders, staffCounts, tableCount, topItems, totalOrders] = await Promise.all([
    prisma.order.aggregate({ where: { outletId: outlet.id, status: { in: ["billed", "done"] }, createdAt: { gte: dayStart } }, _sum: { totalAmount: true } }),
    prisma.order.count({ where: { outletId: outlet.id, status: "preparing" } }),
    prisma.user.findMany({ where: { outletId: outlet.id, isActive: true }, select: { role: true } }),
    prisma.table.count({ where: { outletId: outlet.id } }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: {
        order: {
          outletId: outlet.id,
          createdAt: { gte: dayStart }
        }
      },
      _count: { name: true },
      orderBy: { _count: { name: "desc" } },
      take: 5
    }),
    prisma.order.count({ where: { outletId: outlet.id, createdAt: { gte: dayStart } } }),
  ]);

  const staffByRole = staffCounts.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  const revenue = revenueRow._sum.totalAmount || 0;
  const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;

  return NextResponse.json({
    outlet: { id: outlet.id, name: outlet.name, hotelId: outlet.hotelId },
    today: {
      revenue,
      orders: totalOrders,
      activeKOTs: activeOrders,
      avgOrderValue: Math.round(avgOrder * 100) / 100,
      tables: tableCount,
      staff: {
        waiter: staffByRole.waiter || 0,
        kitchen: staffByRole.kitchen || 0,
        machine: staffByRole.machine || 0,
      },
      topItems: topItems.map((t) => ({ name: t.name, count: t._count.name })),
    },
  });
}
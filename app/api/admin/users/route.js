import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";
const roles = new Set(["admin", "franchise_owner", "hotel_owner", "waiter", "kitchen"]);

function requireAdmin(request) {
  const session = getSessionFromRequest(request);
  return session?.role === "admin" ? session : null;
}

export async function GET(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, outletId: true, outlet: { select: { id: true, hotelId: true, name: true } } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ users });
}

export async function PATCH(request) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const { userId, role, isActive, outletId } = await request.json();
  const hasOutletUpdate = outletId !== undefined;
  if (!userId || (!roles.has(role) && typeof isActive !== "boolean" && !hasOutletUpdate)) return NextResponse.json({ error: "A valid account update is required." }, { status: 400 });
  if (userId === admin.userId && (role !== undefined || isActive === false)) return NextResponse.json({ error: "You cannot reduce or disable your own administrator access." }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (existing.role === "machine") return NextResponse.json({ error: "Machine accounts are managed through POS credentials." }, { status: 400 });
  if (hasOutletUpdate && outletId) {
    const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
    if (!outlet) return NextResponse.json({ error: "Hotel not found." }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...(role ? { role } : {}), ...(typeof isActive === "boolean" ? { isActive } : {}), ...(hasOutletUpdate ? { outletId: outletId || null } : {}) },
    select: { id: true, name: true, email: true, role: true, isActive: true, outletId: true, outlet: { select: { id: true, hotelId: true, name: true } } },
  });
  return NextResponse.json({ user });
}

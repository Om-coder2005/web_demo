import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

function requireAdmin(request) {
  const session = getSessionFromRequest(request);
  return session?.role === "admin" ? session : null;
}

export async function GET(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const outlets = await prisma.outlet.findMany({
    select: {
      id: true,
      hotelId: true,
      name: true,
      slug: true,
      address: true,
      status: true,
      franchiseOwnerId: true,
      franchiseOwner: { select: { id: true, name: true, email: true } },
      machineCredential: { select: { machineEmail: true, isOnline: true, lastHeartbeat: true, passwordLastRotatedAt: true } },
      users: { select: { id: true, name: true, email: true, role: true, isActive: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ outlets });
}

export async function PATCH(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const { outletId, hotelId, franchiseOwnerId } = await request.json();
  if (!outletId && !hotelId) return NextResponse.json({ error: "Outlet is required." }, { status: 400 });

  const outlet = await prisma.outlet.update({
    where: outletId ? { id: outletId } : { hotelId },
    data: { franchiseOwnerId: franchiseOwnerId || null },
    select: {
      id: true,
      hotelId: true,
      name: true,
      franchiseOwnerId: true,
      franchiseOwner: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ outlet });
}

export async function POST(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const { hotelId, name, slug, address, phone, franchiseOwnerId } = await request.json();
  const cleanHotelId = String(hotelId || "").trim().toUpperCase();
  const cleanName = String(name || "").trim();
  const cleanSlug = String(slug || cleanHotelId.toLowerCase()).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");

  if (!cleanHotelId || !cleanName) {
    return NextResponse.json({ error: "Hotel ID and hotel name are required." }, { status: 400 });
  }

  const outlet = await prisma.outlet.create({
    data: {
      hotelId: cleanHotelId,
      name: cleanName,
      slug: cleanSlug,
      address: String(address || "").trim(),
      phone: String(phone || "").trim(),
      franchiseOwnerId: franchiseOwnerId || null,
    },
    select: { id: true, hotelId: true, name: true, slug: true, address: true, status: true, franchiseOwnerId: true },
  });

  return NextResponse.json({ outlet }, { status: 201 });
}

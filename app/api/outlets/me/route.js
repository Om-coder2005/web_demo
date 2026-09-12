import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Login required." }, { status: 401 });

  if (session.role === "admin") {
    const outlets = await prisma.outlet.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ outlets, currentOutlet: null });
  }

  if (session.role === "franchise_owner") {
    const outlets = await prisma.outlet.findMany({
      where: { franchiseOwnerId: session.userId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ outlets, currentOutlet: outlets[0] || null });
  }

  if (!session.outletId) return NextResponse.json({ error: "No hotel is assigned to this account." }, { status: 403 });

  const outlet = await prisma.outlet.findUnique({ where: { id: session.outletId } });
  if (!outlet) return NextResponse.json({ error: "Assigned hotel was not found." }, { status: 404 });

  return NextResponse.json({ outlets: [outlet], currentOutlet: outlet });
}

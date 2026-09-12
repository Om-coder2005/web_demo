import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db.js";
import { getSessionFromRequest } from "../../../lib/auth.js";
import { resolveOutletForSession } from "../../../lib/scope.js";
import { emitOutletEvent } from "../../../lib/realtimeBus.js";

export const dynamic = "force-dynamic";

function canEditTables(role) {
  return role === "hotel_owner";
}

export async function GET(request) {
  const session = getSessionFromRequest(request);
  const hotelId = new URL(request.url).searchParams.get("hotelId");
  const outlet = await resolveOutletForSession(session, hotelId);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });

  const tables = await prisma.table.findMany({ where: { outletId: outlet.id }, orderBy: [{ section: "asc" }, { number: "asc" }] });
  return NextResponse.json({ outlet, tables });
}

export async function POST(request) {
  const session = getSessionFromRequest(request);
  if (!canEditTables(session?.role)) return NextResponse.json({ error: "Only hotel owners can update table grid." }, { status: 403 });

  const body = await request.json();
  const outlet = await resolveOutletForSession(session, body.hotelId);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });

  const count = Number(body.count);
  if (!Number.isInteger(count) || count < 1 || count > 200) {
    return NextResponse.json({ error: "Table count must be between 1 and 200." }, { status: 400 });
  }

  const capacity = Number.isInteger(Number(body.capacity)) ? Number(body.capacity) : 4;
  await prisma.$transaction([
    prisma.table.deleteMany({ where: { outletId: outlet.id } }),
    prisma.table.createMany({
      data: Array.from({ length: count }, (_, index) => ({
        outletId: outlet.id,
        number: index + 1,
        label: `T${index + 1}`,
        section: String(body.section || "Main").trim() || "Main",
        capacity,
      })),
    }),
  ]);
  emitOutletEvent(outlet.id, "tables:reset", { count });
  return NextResponse.json({ success: true, count });
}

export async function PATCH(request) {
  const session = getSessionFromRequest(request);
  if (!canEditTables(session?.role)) return NextResponse.json({ error: "Only hotel owners can update table grid." }, { status: 403 });

  const body = await request.json();
  const existing = body.id ? await prisma.table.findUnique({ where: { id: body.id }, include: { outlet: true } }) : null;
  const outlet = existing ? await resolveOutletForSession(session, existing.outlet.hotelId) : null;
  if (!existing || !outlet) return NextResponse.json({ error: "Table not found." }, { status: 404 });

  const table = await prisma.table.update({
    where: { id: existing.id },
    data: {
      label: String(body.label || existing.label || "").trim(),
      section: String(body.section || existing.section || "Main").trim(),
      capacity: Number.isInteger(Number(body.capacity)) ? Number(body.capacity) : existing.capacity,
    },
  });
  emitOutletEvent(outlet.id, "tables:update", { tableId: table.id });
  return NextResponse.json({ table });
}

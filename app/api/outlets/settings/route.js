import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";
import { resolveOutletForSession } from "../../../../lib/scope.js";
import { emitOutletEvent } from "../../../../lib/realtimeBus.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = getSessionFromRequest(request);
  const hotelId = new URL(request.url).searchParams.get("hotelId");
  const outlet = await resolveOutletForSession(session, hotelId);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });
  return NextResponse.json({ outlet });
}

export async function PATCH(request) {
  const session = getSessionFromRequest(request);
  if (session?.role !== "hotel_owner") return NextResponse.json({ error: "Only hotel owners can update hotel settings." }, { status: 403 });

  const body = await request.json();
  const outlet = await resolveOutletForSession(session, body.hotelId);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });

  const updated = await prisma.outlet.update({
    where: { id: outlet.id },
    data: {
      billNote: String(body.billNote || "").trim(),
      kotNote: String(body.kotNote || "").trim(),
    },
  });
  emitOutletEvent(outlet.id, "outlet:settings", {});
  return NextResponse.json({ outlet: updated });
}

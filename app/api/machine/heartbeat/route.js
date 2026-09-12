import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

/** A terminal proves its identity with its signed, HttpOnly machine session. */
export async function POST(request) {
  const session = getSessionFromRequest(request);

  if (!session || session.role !== "machine" || !session.outletId) {
    return NextResponse.json({ error: "Machine authentication required." }, { status: 401 });
  }

  const credential = await prisma.machineCredential.findUnique({
    where: { outletId: session.outletId },
    select: { id: true },
  });

  if (!credential) {
    return NextResponse.json({ error: "Machine is not configured." }, { status: 404 });
  }

  await prisma.machineCredential.update({
    where: { id: credential.id },
    data: { isOnline: true, lastHeartbeat: new Date() },
  });

  return NextResponse.json({ ok: true, serverTime: new Date().toISOString() });
}

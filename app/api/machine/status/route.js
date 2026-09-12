import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";
const HEARTBEAT_TTL_MS = 90_000;

export async function GET(request) {
  const session = getSessionFromRequest(request);
  if (!session || !session.outletId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const credential = await prisma.machineCredential.findUnique({
    where: { outletId: session.outletId },
    select: { isOnline: true, lastHeartbeat: true },
  });
  const fresh = Boolean(credential?.isOnline && credential.lastHeartbeat && Date.now() - credential.lastHeartbeat.getTime() <= HEARTBEAT_TTL_MS);

  return NextResponse.json({
    configured: Boolean(credential),
    online: fresh,
    lastHeartbeat: credential?.lastHeartbeat || null,
  });
}

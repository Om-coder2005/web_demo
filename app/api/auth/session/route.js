import { NextResponse } from "next/server";
import { getSessionFromRequest } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: session });
}

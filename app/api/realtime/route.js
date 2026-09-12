import { getSessionFromRequest } from "../../../lib/auth.js";
import { resolveOutletForSession } from "../../../lib/scope.js";
import { onOutletEvent } from "../../../lib/realtimeBus.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const session = getSessionFromRequest(request);
  const hotelId = new URL(request.url).searchParams.get("hotelId");
  const outlet = await resolveOutletForSession(session, hotelId);
  if (!outlet) return new Response("Hotel access required.", { status: 403 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      send({ type: "connected", payload: { outletId: outlet.id, hotelId: outlet.hotelId }, at: new Date().toISOString() });
      const unsubscribe = onOutletEvent(outlet.id, send);
      const keepAlive = setInterval(() => send({ type: "heartbeat", payload: {}, at: new Date().toISOString() }), 25000);
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

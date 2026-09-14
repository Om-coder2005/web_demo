import { EventEmitter } from "events";

const globalBus = globalThis.__khandoliRealtimeBus || new EventEmitter();
globalBus.setMaxListeners(200);
globalThis.__khandoliRealtimeBus = globalBus;

export function emitOutletEvent(outletId, type, payload = {}) {
  if (!outletId) return;
  // If Socket.io emitter is available (server-side), use it
  if (typeof window === 'undefined' && global.__khandoliEmitOutletEvent) {
    return global.__khandoliEmitOutletEvent(outletId, type, payload);
  }
  // Otherwise, use the EventEmitter (for client-side or fallback)
  globalBus.emit(`outlet:${outletId}`, { type, payload, at: new Date().toISOString() });
}

export function onOutletEvent(outletId, listener) {
  const channel = `outlet:${outletId}`;
  globalBus.on(channel, listener);
  return () => globalBus.off(channel, listener);
}

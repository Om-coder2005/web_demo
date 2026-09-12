"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CloudOff } from "lucide-react";

export function useMachineConnectivity(user) {
  const [state, setState] = useState({ online: typeof navigator === "undefined" ? true : navigator.onLine, configured: false, loading: true });

  useEffect(() => {
    if (!user || user.role === "machine") return;
    let active = true;
    const refresh = async () => {
      if (!navigator.onLine) return active && setState({ online: false, configured: false, loading: false });
      try {
        const response = await fetch("/api/machine/status", { cache: "no-store" });
        if (!response.ok) throw new Error("status unavailable");
        const data = await response.json();
        if (active) setState({ online: data.online, configured: data.configured, loading: false });
      } catch {
        if (active) setState({ online: false, configured: false, loading: false });
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("online", refresh); window.removeEventListener("offline", refresh); };
  }, [user?.role, user?.hotelId]);
  return state;
}

/** Keeps the server-side machine presence fresh while a terminal is connected. */
export function useMachineHeartbeat(user) {
  useEffect(() => {
    if (user?.role !== "machine") return;
    const beat = async () => {
      if (!navigator.onLine) return;
      try {
        await fetch("/api/machine/heartbeat", { method: "POST", credentials: "same-origin", cache: "no-store" });
      } catch {
        // The terminal continues its local offline workflow; the server TTL marks it offline.
      }
    };
    beat();
    const timer = window.setInterval(beat, 30_000);
    return () => window.clearInterval(timer);
  }, [user?.role, user?.hotelId]);
}

export function MachineOfflineAlert({ status }) {
  if (status.loading || status.online) return null;
  const text = status.configured
    ? "POS machine is offline. Waiter and kitchen controls are restricted until its secure connection is restored and data syncs."
    : "No POS machine is connected for this outlet. Waiter and kitchen controls are restricted.";
  return <div role="alert" style={{ marginBottom: "1rem", display: "flex", gap: "0.6rem", alignItems: "flex-start", padding: "0.8rem 1rem", border: "1px solid #dc2626", borderRadius: "10px", color: "#991b1b", background: "#fef2f2", fontSize: "0.82rem", fontWeight: 700 }}><CloudOff style={{ width: 18, flexShrink: 0 }} /><span>{text}</span></div>;
}

export function ReadOnlyAlert() {
  return <div role="status" style={{ marginBottom: "1rem", display: "flex", gap: "0.6rem", alignItems: "flex-start", padding: "0.8rem 1rem", border: "1px solid #b45309", borderRadius: "10px", color: "#92400e", background: "#fffbeb", fontSize: "0.82rem", fontWeight: 700 }}><AlertTriangle style={{ width: 18, flexShrink: 0 }} /><span>Management view only: kitchen tickets and table orders cannot be changed from this account.</span></div>;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setCurrentUser } from "../../lib/storage.js";

export default function AdminLoginPage() {
  const router = useRouter(); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(""); try { const response = await fetch("/api/auth/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "admin", password }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setCurrentUser({ ...data.user, hotelId: null, hotelName: null }); router.replace("/admin"); router.refresh(); } catch (e) { setError(e.message || "Sign-in failed."); } finally { setBusy(false); } };
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem", background: "#fff8d8" }}><form onSubmit={submit} className="glass-panel" style={{ width: "100%", maxWidth: 420, padding: "2rem", background: "#fff" }}><Link href="/login" style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 800 }}>← Staff sign in</Link><h1 style={{ fontSize: "1.5rem", fontWeight: 900, margin: "1rem 0 0.5rem" }}>Administrator sign in</h1><p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>Administrator access is protected separately from staff OTP login.</p>{error && <p role="alert" style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p>}<label style={{ display: "grid", gap: 6, fontSize: "0.8rem", fontWeight: 800 }}>Administrator ID<input value="admin" readOnly style={{ padding: "0.7rem", border: "1px solid #94a3b8", borderRadius: 8, background: "#f8fafc" }}/></label><label style={{ display: "grid", gap: 6, fontSize: "0.8rem", fontWeight: 800, marginTop: "0.8rem" }}>Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: "0.7rem", border: "1px solid #94a3b8", borderRadius: 8 }}/></label><button disabled={busy} className="khandoli-btn-yellow" style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}>{busy ? "Signing in…" : "Open account control"}</button></form></main>;
}

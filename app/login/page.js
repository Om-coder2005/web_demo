"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, KeyRound, MonitorCog, ShieldCheck } from "lucide-react";
import { setCurrentUser } from "../../lib/storage.js";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputStyle = { width: "100%", padding: "0.75rem 0.85rem", border: "1px solid #0f172a", borderRadius: 8, fontSize: "0.9rem", background: "#fff" };

  const finish = (data) => { setCurrentUser({ ...data.user, hotelId: data.user.outletId, hotelName: data.user.outletName }); router.replace(data.redirect); router.refresh(); };
  const post = async (url, body) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await r.json(); if (!r.ok) throw new Error(data.error || "Sign-in failed."); return data; };
  const sendOtp = async (e) => { e.preventDefault(); setBusy(true); setError(""); try { await post("/api/auth/send-otp", { email }); setOtpSent(true); setNotice("A six-digit verification code was sent to your approved email."); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const verifyOtp = async (e) => { e.preventDefault(); setBusy(true); setError(""); try { finish(await post("/api/auth/verify-otp", { email, otp })); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const loginMachine = async (e) => { e.preventDefault(); setBusy(true); setError(""); try { finish(await post("/api/auth/machine-login", { email, password })); } catch (e) { setError(e.message); } finally { setBusy(false); } };

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem", background: "linear-gradient(135deg,#fff 0%,#fff8d8 100%)" }}><section className="glass-panel" style={{ width: "100%", maxWidth: 490, padding: "clamp(1.4rem,4vw,2.4rem)", background: "#fff" }}>
    <Link href="/" style={{ color: "#0f172a", textDecoration: "none", fontSize: "0.8rem", fontWeight: 800 }}>← KHANDOLI POS</Link>
    <div style={{ float: "right", display: "flex", gap: "0.75rem" }}><Link href="/signup" style={{ color: "#0f172a", fontSize: "0.8rem", fontWeight: 800 }}>Request access</Link><Link href="/admin-login" style={{ color: "#0f172a", fontSize: "0.8rem", fontWeight: 800 }}>Admin</Link></div>
    <div style={{ margin: "1.25rem 0" }}><div style={{ display: "inline-flex", padding: 10, borderRadius: 10, background: "#fcc500" }}><ShieldCheck /></div><h1 style={{ marginTop: "0.8rem", fontWeight: 900, fontSize: "1.65rem", color: "#0f172a" }}>Secure operations sign in</h1><p style={{ color: "#64748b", fontSize: "0.86rem", lineHeight: 1.5 }}>Use your approved staff email, or the credentials assigned to this POS machine. Roles are assigned by the server—not selected here.</p></div>
    <div style={{ display: "flex", gap: 8, padding: 4, background: "#f1f5f9", borderRadius: 10, marginBottom: "1rem" }}><button onClick={() => { setMode("staff"); setError(""); }} style={{ flex: 1, border: 0, borderRadius: 7, padding: "0.6rem", cursor: "pointer", fontWeight: 800, background: mode === "staff" ? "#fcc500" : "transparent" }}>Staff / owner</button><button onClick={() => { setMode("machine"); setError(""); }} style={{ flex: 1, border: 0, borderRadius: 7, padding: "0.6rem", cursor: "pointer", fontWeight: 800, background: mode === "machine" ? "#fcc500" : "transparent" }}>POS machine</button></div>
    {error && <p role="alert" style={{ padding: "0.7rem", background: "#fef2f2", color: "#b91c1c", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700 }}>{error}</p>}{notice && <p role="status" style={{ padding: "0.7rem", background: "#eff6ff", color: "#1d4ed8", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700 }}>{notice}</p>}
    {mode === "machine" ? <form onSubmit={loginMachine} style={{ display: "grid", gap: "0.85rem" }}><label><span style={{ fontSize: "0.75rem", fontWeight: 800 }}>Machine email</span><input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} /></label><label><span style={{ fontSize: "0.75rem", fontWeight: 800 }}>Machine password</span><input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} /></label><button disabled={busy} className="khandoli-btn-yellow" style={{ justifyContent: "center", padding: "0.8rem" }}><MonitorCog size={18}/>{busy ? "Signing in…" : "Start POS terminal"}</button></form> : !otpSent ? <form onSubmit={sendOtp} style={{ display: "grid", gap: "0.85rem" }}><label><span style={{ fontSize: "0.75rem", fontWeight: 800 }}>Approved work email</span><input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="name@company.com" /></label><button disabled={busy} className="khandoli-btn-yellow" style={{ justifyContent: "center", padding: "0.8rem" }}><KeyRound size={18}/>{busy ? "Sending…" : "Send verification code"}</button></form> : <form onSubmit={verifyOtp} style={{ display: "grid", gap: "0.85rem" }}><label><span style={{ fontSize: "0.75rem", fontWeight: 800 }}>Verification code</span><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} style={{ ...inputStyle, letterSpacing: "0.3em", fontWeight: 900 }} /></label><button disabled={busy} className="khandoli-btn-yellow" style={{ justifyContent: "center", padding: "0.8rem" }}><ArrowRight size={18}/>{busy ? "Verifying…" : "Verify and continue"}</button><button type="button" onClick={() => setOtpSent(false)} style={{ border: 0, background: "transparent", color: "#475569", cursor: "pointer" }}>Use another email</button></form>}
  </section></main>;
}

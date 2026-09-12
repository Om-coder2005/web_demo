import Link from "next/link";

export default function UnauthorizedPage() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem", background: "#fff" }}><section className="glass-panel" style={{ maxWidth: 520, padding: "2rem", textAlign: "center" }}><h1 style={{ fontWeight: 900, fontSize: "1.6rem", color: "#0f172a" }}>Access restricted</h1><p style={{ color: "#475569", margin: "0.8rem 0 1.2rem" }}>Your account does not have permission to open this POS area.</p><Link href="/login" className="khandoli-btn-yellow">Return to sign in</Link></section></main>;
}

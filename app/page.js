"use client";

import Link from "next/link";
import Hero3D from "../components/Hero3D.js";
import { 
  ChefHat, 
  UtensilsCrossed, 
  Building2, 
  TrendingUp, 
  ArrowRight,
  Flame,
  Store,
  CheckCircle2,
  MapPin
} from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#ffffff" }}>
      {/* ThreeJS Floating 3D Background */}
      <Hero3D />

      {/* Soft light tint overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.95) 80%)",
        zIndex: 1,
        pointerEvents: "none"
      }} />

      {/* Hero Header Nav */}
      <header style={{
        position: "relative",
        zIndex: 10,
        padding: "1.2rem 1.5rem",
        maxWidth: "1320px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "var(--brand-yellow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            boxShadow: "0 2px 10px rgba(252, 197, 0, 0.35)"
          }}>
            🍳
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
              <span style={{ fontWeight: 900, fontSize: "1.25rem", color: "#0f172a", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                KHANDOLI
              </span>
              <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#b45309", background: "rgba(252, 197, 0, 0.2)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                POS
              </span>
            </div>
            <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Nitin's Canteen · 11 Branches Across Maharashtra
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/login" className="khandoli-btn-yellow" style={{ fontSize: "0.82rem", padding: "0.55rem 1.15rem" }}>
            <span>Launch POS Portal</span>
            <ArrowRight style={{ width: "16px", height: "16px" }} />
          </Link>
        </div>
      </header>

      {/* Hero Body Content */}
      <main style={{
        position: "relative",
        zIndex: 10,
        maxWidth: "1200px",
        margin: "2.5rem auto 0",
        padding: "0 1.25rem",
        textAlign: "center"
      }}>
        {/* Top Badge: 70 Years One Taste */}
        <div className="font-mellos" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.45rem 1rem",
          borderRadius: "8px",
          background: "var(--brand-yellow)",
          color: "#000000",
          fontSize: "0.82rem",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "1.5rem",
          border: "2px solid #000000",
          boxShadow: "2px 2px 0px #000000"
        }}>
          <Flame style={{ width: "16px", height: "16px", color: "#000000" }} />
          <span>70 YEARS · ONE TASTE · 11 BRANCHES</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-sherly" style={{
          fontSize: "clamp(2.2rem, 6vw, 4.2rem)",
          fontWeight: 900,
          lineHeight: 1.1,
          color: "#000000",
          marginBottom: "1.25rem",
          textTransform: "uppercase",
          letterSpacing: "0.01em"
        }}>
          KHANDOLI NITIN'S CANTEEN <br />
          <span style={{ color: "#000000", background: "var(--brand-yellow)", padding: "0.1rem 0.5rem", borderRadius: "6px", border: "2px solid #000000" }}>
            POS & KITCHEN OPERATIONS
          </span>
        </h1>

        <p className="font-standard" style={{
          fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
          color: "#333333",
          maxWidth: "780px",
          margin: "0 auto 2.5rem",
          lineHeight: 1.6,
          fontWeight: 600
        }}>
          Kolhapur's iconic 70-year food heritage, powered by a dedicated high-speed Point-of-Sale system. Real-time waiter ordering, live KOT kitchen queue display, and multi-branch analytics across Maharashtra.
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "3.5rem" }}>
          <Link href="/login" className="khandoli-btn-yellow" style={{
            fontSize: "0.95rem",
            padding: "0.85rem 2rem",
            minWidth: "200px"
          }}>
            <span>Secure staff sign in</span>
            <ArrowRight style={{ width: "18px", height: "18px" }} />
          </Link>
          <Link href="/login" className="khandoli-btn-black" style={{
            fontSize: "0.95rem",
            padding: "0.85rem 2rem",
            minWidth: "180px"
          }}>
            <UtensilsCrossed style={{ width: "18px", height: "18px", color: "var(--brand-yellow)" }} />
            <span>Floor POS</span>
          </Link>
          <Link href="/login" className="khandoli-btn-outline" style={{
            fontSize: "0.95rem",
            padding: "0.85rem 2rem",
            minWidth: "180px"
          }}>
            <ChefHat style={{ width: "18px", height: "18px", color: "#000000" }} />
            <span>Kitchen Display</span>
          </Link>
        </div>

        {/* Feature Role Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: "1.25rem",
          textAlign: "left",
          paddingBottom: "5rem"
        }}>
          {/* Franchise Card */}
          <div className="glass-panel" style={{ padding: "1.5rem", background: "#ffffff", borderTop: "6px solid var(--brand-yellow)" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              background: "var(--brand-yellow)",
              border: "2px solid #000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem"
            }}>
              <Building2 style={{ width: "22px", height: "22px", color: "#000000" }} />
            </div>
            <div className="font-mellos" style={{ fontSize: "0.7rem", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
              Enterprise Overview
            </div>
            <h3 className="font-mellos" style={{ fontSize: "1.1rem", fontWeight: 900, color: "#000000", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              Franchise Analytics
            </h3>
            <p className="font-standard" style={{ fontSize: "0.82rem", color: "#333333", lineHeight: 1.5, fontWeight: 600 }}>
              Monitor all 11 Maharashtra branches (Islampur, Kolhapur HQ, Satara, Pune), overall daily revenue, and outlet-level drilldown.
            </p>
          </div>

          {/* Outlet Manager Card */}
          <div className="glass-panel" style={{ padding: "1.5rem", background: "#ffffff", borderTop: "6px solid #000000" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              background: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem"
            }}>
              <Store style={{ width: "22px", height: "22px", color: "var(--brand-yellow)" }} />
            </div>
            <div className="font-mellos" style={{ fontSize: "0.7rem", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
              Branch Operations
            </div>
            <h3 className="font-mellos" style={{ fontSize: "1.1rem", fontWeight: 900, color: "#000000", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              Outlet Manager
            </h3>
            <p className="font-standard" style={{ fontSize: "0.82rem", color: "#333333", lineHeight: 1.5, fontWeight: 600 }}>
              Manage branch staff (Chefs & Waiters), floor table arrangements, menu availability, and live billing metrics.
            </p>
          </div>

          {/* Waiter POS Card */}
          <div className="glass-panel" style={{ padding: "1.5rem", background: "#ffffff", borderTop: "6px solid var(--brand-yellow)" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              background: "var(--brand-yellow)",
              border: "2px solid #000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem"
            }}>
              <UtensilsCrossed style={{ width: "22px", height: "22px", color: "#000000" }} />
            </div>
            <div className="font-mellos" style={{ fontSize: "0.7rem", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
              Floor Service
            </div>
            <h3 className="font-mellos" style={{ fontSize: "1.1rem", fontWeight: 900, color: "#000000", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              Waiter POS & Tables
            </h3>
            <p className="font-standard" style={{ fontSize: "0.82rem", color: "#333333", lineHeight: 1.5, fontWeight: 600 }}>
              Rapid table ordering from the 102-item Khandoli menu sheet, notes for kitchen, instant billing, and immediate KOT dispatch.
            </p>
          </div>

          {/* Kitchen Display Card */}
          <div className="glass-panel" style={{ padding: "1.5rem", background: "#ffffff", borderTop: "6px solid #000000" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              background: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem"
            }}>
              <ChefHat style={{ width: "22px", height: "22px", color: "var(--brand-yellow)" }} />
            </div>
            <div className="font-mellos" style={{ fontSize: "0.7rem", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>
              Live KDS System
            </div>
            <h3 className="font-mellos" style={{ fontSize: "1.1rem", fontWeight: 900, color: "#000000", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              Kitchen KOT Display
            </h3>
            <p className="font-standard" style={{ fontSize: "0.82rem", color: "#333333", lineHeight: 1.5, fontWeight: 600 }}>
              Consolidated item prep counters (e.g. 5x Double Khandoli), item checklist, one-tap completion, and order history archive.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Banner */}
      <footer style={{
        position: "relative",
        zIndex: 10,
        borderTop: "3px solid var(--brand-yellow)",
        background: "#f8fafc",
        padding: "1.5rem 1.25rem",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "0.78rem"
      }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
          <MapPin style={{ width: "14px", height: "14px", color: "#b45309" }} />
          <span style={{ color: "#0f172a", fontWeight: 700 }}>Khandoli Nitin's Canteen</span>
          <span>· Shivaji Udyam Nagar, Kolhapur · Islampur · Satara · Pune</span>
        </div>
        <p>© 2026 Khandoli Nitin's Canteen. POS & Kitchen Operations Management.</p>
      </footer>
    </div>
  );
}

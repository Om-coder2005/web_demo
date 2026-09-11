"use client";

import Link from "next/link";
import Hero3D from "../components/Hero3D.js";
import { 
  Store, 
  ChefHat, 
  UtensilsCrossed, 
  Building2, 
  TrendingUp, 
  ShieldCheck,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#0b1329" }}>
      {/* ThreeJS Floating 3D Background */}
      <Hero3D />

      {/* Overlay gradient */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(11, 19, 41, 0.8)",
        zIndex: 1,
        pointerEvents: "none"
      }} />

      {/* Hero Header Nav */}
      <div style={{
        position: "relative",
        zIndex: 10,
        padding: "1.5rem 3rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "10px",
            background: "#4f46e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Store style={{ color: "white", width: "24px", height: "24px" }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "#fff", letterSpacing: "-0.5px" }}>
            NextBills <span style={{ color: "#4f46e5" }}>POS</span>
          </span>
        </div>

        <Link href="/login" className="glass-button" style={{ padding: "0.6rem 1.4rem" }}>
          <ShieldCheck style={{ width: "18px", height: "18px" }} /> Launch NextBills Portal
        </Link>
      </div>

      {/* Hero Body Content */}
      <div style={{
        position: "relative",
        zIndex: 10,
        maxWidth: "1200px",
        margin: "4rem auto 0",
        padding: "0 2rem",
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 1rem",
          borderRadius: "20px",
          background: "rgba(79, 70, 229, 0.2)",
          border: "1px solid rgba(79, 70, 229, 0.4)",
          color: "#818cf8",
          fontSize: "0.85rem",
          fontWeight: 600,
          marginBottom: "1.5rem"
        }}>
          <Sparkles style={{ width: "16px", height: "16px", color: "#ec4899" }} /> Next-Gen Multi-Role POS & Kitchen Display System
        </div>

        <h1 style={{
          fontSize: "3.5rem",
          fontWeight: 900,
          lineHeight: 1.15,
          color: "#fff",
          marginBottom: "1.25rem",
          letterSpacing: "-1px"
        }}>
          Revolutionize Outlet & <br />
          <span style={{ color: "#4f46e5" }}>
            Franchise Operations with NextBills
          </span>
        </h1>

        <p style={{
          fontSize: "1.15rem",
          color: "#94a3b8",
          maxWidth: "750px",
          margin: "0 auto 2.5rem",
          lineHeight: 1.6
        }}>
          Real-time synchronized order dispatches, consolidated Kitchen Display system with aggregated KOT item count summaries, multi-franchise analytics, and full Excel menu integration.
        </p>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "4rem" }}>
          <Link href="/login" className="glass-button" style={{
            fontSize: "1rem",
            padding: "0.85rem 2rem",
            borderRadius: "10px"
          }}>
            Explore Demo Roles <ArrowRight style={{ width: "18px", height: "18px" }} />
          </Link>
          <Link href="/tables" className="glass-button" style={{
            fontSize: "1rem",
            padding: "0.85rem 2rem",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.05)"
          }}>
            Waiter Table View
          </Link>
        </div>

        {/* Feature Role Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem",
          textAlign: "left",
          paddingBottom: "4rem"
        }}>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "rgba(79, 70, 229, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem"
            }}>
              <Building2 style={{ width: "24px", height: "24px", color: "#818cf8" }} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
              Franchise Owner
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Monitor multiple outlet branches (Outlet 1, Outlet 2, Outlet 3), revenue analytics, and drill down into individual outlet owner views.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "rgba(236, 72, 153, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem"
            }}>
              <TrendingUp style={{ width: "24px", height: "24px", color: "#ec4899" }} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
              Outlet Owner
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Track active kitchen staff, waiters, sales breakdown, table layouts, menu management, and real-time operational efficiency.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "rgba(52, 211, 153, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem"
            }}>
              <UtensilsCrossed style={{ width: "24px", height: "24px", color: "#34d399" }} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
              Waiter POS Layout
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Instant table view, seamless menu item additions from Excel sheet, live order modifications, and immediate KOT dispatching to kitchen.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(245, 158, 11, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem"
            }}>
              <ChefHat style={{ width: "24px", height: "24px", color: "#fbbf24" }} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
              Kitchen KOT Display
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Top aggregated item count summary for high UX efficiency, chronological KOT cards, item-level completion, and 2-sec transition to History tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar.js";
import Link from "next/link";
import {
  Building2,
  ShoppingBag,
  Users,
  ChefHat,
  UtensilsCrossed,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import BillsList from "../../components/BillsList.js";

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [meRes, analyticsRes] = await Promise.all([
          fetch("/api/outlets/me", { cache: "no-store", credentials: "include" }),
          fetch("/api/analytics/summary", { cache: "no-store", credentials: "include" }),
        ]);
        const meData = await meRes.json();
        if (!isMounted) return;
        setUser(meData || null);
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  if (!user) return null;
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fff" }}>
      <p style={{ color: "var(--text-muted)" }}>Loading live dashboard data...</p>
    </div>
  );

  if (!analytics) return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fff" }}>
      <p style={{ color: "var(--text-muted)" }}>No analytics data available.</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div className="mobile-bottom-space" style={{ padding: "1.25rem 1rem", flex: 1, maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "clamp(1.3rem, 4vw, 1.8rem)", fontWeight: 800, color: "#0f172a" }}>Welcome back, {user.name}</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>Live analytics from your PostgreSQL database.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Today's Revenue</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#b45309", margin: "0.3rem 0" }}>{formatMoney(analytics.today?.revenue)}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>From billed & completed orders</div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Live KOT Orders</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#b45309", margin: "0.3rem 0" }}>{analytics.today?.activeKOTs || 0} Preparing</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Active kitchen tickets</div>
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Today's Orders</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0.3rem 0" }}>{analytics.today?.orders || 0}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Avg order value {formatMoney(analytics.today?.avgOrderValue)}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>Top Selling Dishes Today</h2>
          {analytics.today?.topItems?.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "0.75rem" }}>
              {analytics.today.topItems.map((item, index) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "#f8fafc", borderRadius: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: index === 0 ? "#fbbf24" : "#f1f5f9", color: index === 0 ? "#78350f" : "#475569", display: "grid", placeItems: "center", fontWeight: 800 }}>{index + 1}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>{item.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.count} orders</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No orders recorded yet today.</p>
          )}
        </div>
        <BillsList />
      </div>
    </div>
  );
}
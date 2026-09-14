"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "../../components/Navbar.js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  ShoppingBag,
  Users,
  ChefHat,
  UtensilsCrossed,
  TrendingUp,
  ArrowRight,
  Store,
} from "lucide-react";
import BillsList from "../../components/BillsList.js";

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const hotelIdParam = searchParams.get("hotelId");

  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noOutletContext, setNoOutletContext] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setNoOutletContext(false);
      try {
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store", credentials: "include" });
        if (!sessionRes.ok) {
          if (isMounted) setLoading(false);
          return;
        }
        const sessionData = await sessionRes.json();
        const currentUser = sessionData.user;
        if (!isMounted) return;
        setUser(currentUser);

        if (!currentUser) {
          setLoading(false);
          return;
        }

        // If global admin with no explicit outlet context, skip fetching outlet analytics
        if (currentUser.role === "admin" && !hotelIdParam) {
          setNoOutletContext(true);
          setLoading(false);
          return;
        }

        const analyticsUrl = hotelIdParam
          ? `/api/analytics/summary?hotelId=${encodeURIComponent(hotelIdParam)}`
          : "/api/analytics/summary";

        const analyticsRes = await fetch(analyticsUrl, { cache: "no-store", credentials: "include" });
        if (!isMounted) return;

        if (analyticsRes.status === 403) {
          setNoOutletContext(true);
        } else if (analyticsRes.ok) {
          setAnalytics(await analyticsRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [hotelIdParam]);

  if (!user && loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fff" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading live dashboard data...</p>
      </div>
    );
  }

  if (!user) return null;

  if (noOutletContext || (user.role === "admin" && !hotelIdParam && !analytics)) {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div className="mobile-bottom-space" style={{ padding: "1.25rem 1rem", flex: 1, maxWidth: "1300px", margin: "0 auto", width: "100%", display: "grid", placeItems: "center" }}>
          <div className="glass-panel" style={{ padding: "2.5rem 2rem", maxWidth: "500px", width: "100%", textAlign: "center", background: "#ffffff" }}>
            <div style={{ display: "inline-flex", padding: 14, borderRadius: "50%", background: "#fef3c7", color: "#b45309", marginBottom: "1rem" }}>
              <Store size={32} />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>Select an outlet to continue</h1>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              This dashboard requires an outlet context. Select an outlet from the Admin panel to view outlet-specific analytics and operations.
            </p>
            <Link href="/admin" className="khandoli-btn-yellow" style={{ display: "inline-flex", justifyContent: "center", textDecoration: "none", padding: "0.75rem 1.5rem", fontWeight: 800 }}>
              Go to Admin Panel
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fff" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading live dashboard data...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
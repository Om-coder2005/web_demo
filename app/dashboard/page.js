"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar.js";
import { getCurrentUser, getHotels, setSelectedHotel, getStaff, getOrders } from "../../lib/storage.js";
import Link from "next/link";
import { 
  Building2, 
  ShoppingBag, 
  Users, 
  ChefHat, 
  UtensilsCrossed, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Star,
  Clock,
  Sparkles
} from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [staff, setStaff] = useState({ kitchen: [], waiters: [] });
  const [orders, setOrders] = useState([]);
  const [selectedFranchiseHotel, setSelectedFranchiseHotel] = useState(null);
  const [dbOutlet, setDbOutlet] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setHotels(getHotels());
    setStaff(getStaff());
    setOrders(getOrders());
    fetch("/api/outlets/me", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setDbOutlet(data?.currentOutlet || null))
      .catch(() => null);

    const handleUpdate = () => {
      setUser(getCurrentUser());
      setHotels(getHotels());
      setStaff(getStaff());
      setOrders(getOrders());
    };

    window.addEventListener("pos_user_change", handleUpdate);
    window.addEventListener("pos_data_update", handleUpdate);

    return () => {
      window.removeEventListener("pos_user_change", handleUpdate);
      window.removeEventListener("pos_data_update", handleUpdate);
    };
  }, []);

  if (!user) return null;

  const handleOpenHotelView = (hotel) => {
    setSelectedHotel(hotel);
    setSelectedFranchiseHotel(hotel);
  };

  const isFranchiseMode = user.role === "franchise_owner" && !selectedFranchiseHotel;
  const totalFranchiseRevenue = hotels.reduce((acc, h) => acc + (h.dailyRevenue || 0), 0);
  const totalActiveKOTs = orders.filter(o => o.status === "preparing").length;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div className="mobile-bottom-space" style={{ padding: "1.25rem 1rem", flex: 1, maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        {/* Banner / Header */}
        <div className="glass-panel" style={{
          padding: "1.5rem",
          marginBottom: "1.5rem",
          background: "linear-gradient(135deg, rgba(252, 197, 0, 0.15) 0%, #f8fafc 100%)",
          borderColor: "rgba(252, 197, 0, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <span className="badge badge-preparing" style={{ background: "rgba(252, 197, 0, 0.25)", color: "#b45309", borderColor: "rgba(252, 197, 0, 0.45)" }}>
                {isFranchiseMode ? "🏢 Khandoli Franchise Enterprise" : "📍 Branch Live Ops Dashboard"}
              </span>
              {selectedFranchiseHotel && (
                <button
                  onClick={() => setSelectedFranchiseHotel(null)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--border-color)",
                    color: "#0f172a",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  ← All Outlets
                </button>
              )}
            </div>

            <h1 style={{ fontSize: "clamp(1.3rem, 4vw, 1.8rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Welcome back, {user.name}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              {isFranchiseMode 
                ? "Consolidated performance & live monitoring across 11 Maharashtra branches." 
                : `Real-time kitchen load, billing & staff metrics for ${selectedFranchiseHotel ? selectedFranchiseHotel.name : "Kolhapur HQ (Shivaji Udyam Nagar)"}.`}
            </p>
            {!isFranchiseMode && (
              <p style={{ fontSize: "0.8rem", color: "#0f172a", marginTop: "0.35rem", fontWeight: 800 }}>
                Hotel ID: {dbOutlet?.hotelId || user.hotelId || user.outletId || "Not assigned"}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", width: "100%", maxWidth: "fit-content" }}>
            <Link href="/tables" className="khandoli-btn-outline" style={{ fontSize: "0.85rem", padding: "0.6rem 1rem", textDecoration: "none" }}>
              <UtensilsCrossed style={{ width: "16px", height: "16px" }} /> Table Grid
            </Link>
            <Link href="/kitchen" className="khandoli-btn-yellow" style={{ fontSize: "0.85rem", padding: "0.6rem 1.1rem", textDecoration: "none" }}>
              <ChefHat style={{ width: "16px", height: "16px" }} /> Live Kitchen ({totalActiveKOTs})
            </Link>
          </div>
        </div>

        {/* FRANCHISE OWNER FIRST VIEW: All Outlets Under Franchise */}
        {isFranchiseMode && (
          <>
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Building2 style={{ color: "#b45309", width: "20px", height: "20px" }} />
                  Khandoli Network Outlets ({hotels.length})
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Active Sync • Central DB</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "1rem" }}>
                {hotels.map(h => (
                  <div
                    key={h.id}
                    className="glass-panel"
                    style={{
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      background: "#ffffff",
                      transition: "transform 0.15s ease, border-color 0.15s ease"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", gap: "0.5rem" }}>
                        <div>
                          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                            {h.name}
                          </h3>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{h.address}</p>
                        </div>
                        <span className="badge badge-available">
                          {h.status}
                        </span>
                      </div>

                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                        background: "var(--bg-card-secondary)",
                        padding: "0.75rem",
                        borderRadius: "10px",
                        margin: "0.75rem 0",
                        border: "1px solid var(--border-color)"
                      }}>
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Today Revenue</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#b45309" }}>₹{(h.dailyRevenue || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Active Staff</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{h.staffCount}</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenHotelView(h)}
                      className="khandoli-btn-outline"
                      style={{ width: "100%", justifyContent: "center", fontSize: "0.85rem", marginTop: "0.5rem", padding: "0.55rem" }}
                    >
                      Enter Outlet Console <ArrowRight style={{ width: "15px", height: "15px" }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Franchise Global Analytics */}
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <TrendingUp style={{ color: "#b45309", width: "20px", height: "20px" }} />
                Consolidated Network Analytics
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "1rem" }}>
                <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Total Network Revenue</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#b45309", margin: "0.3rem 0" }}>
                    ₹{totalFranchiseRevenue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 600 }}>+18.4% vs last week</div>
                </div>

                <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Active Live KOTs</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#b45309", margin: "0.3rem 0" }}>
                    {totalActiveKOTs}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Real-time kitchen load</div>
                </div>

                <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Average Order Value</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0.3rem 0" }}>
                    ₹340.00
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#b45309" }}>High profitability</div>
                </div>

                <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Top Selling Dish</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0.3rem 0" }}>
                    Khima Ghotala
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>142 orders across branches</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* OUTLET OWNER VIEW */}
        {!isFranchiseMode && (
          <>
            {/* Top Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Today's Revenue</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#b45309", margin: "0.3rem 0" }}>
                  ₹48,200.00
                </div>
                <div style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 600 }}>+12.5% vs yesterday</div>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Active Kitchen Staff</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0.3rem 0" }}>
                  {staff.kitchen.length} Chefs
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>All kitchen stations active</div>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Floor Waiters</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0.3rem 0" }}>
                  {staff.waiters.length} Waiters
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>12 dine-in tables active</div>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem", background: "#ffffff" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>Live KOT Orders</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#b45309", margin: "0.3rem 0" }}>
                  {totalActiveKOTs} Preparing
                </div>
                <div style={{ fontSize: "0.75rem", color: "#b45309" }}>Avg prep time ~10 min</div>
              </div>
            </div>

            {/* Kitchen Staff Section */}
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ChefHat style={{ color: "#b45309", width: "20px", height: "20px" }} />
                Kitchen Station Staff
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                {staff.kitchen.map(k => (
                  <div key={k.id} className="glass-panel" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff" }}>
                    <div>
                      <h4 style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{k.name}</h4>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{k.role} • {k.shift} Shift</div>
                      <div style={{ fontSize: "0.75rem", color: "#b45309", marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <Star style={{ width: "12px", height: "12px", fill: "var(--primary-yellow)" }} /> Rating {k.rating}
                      </div>
                    </div>
                    <span className="badge badge-preparing">
                      {k.activeKOTs} Active KOTs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Waiters Staff Section */}
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users style={{ color: "#047857", width: "20px", height: "20px" }} />
                Floor Captains & Waiters
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                {staff.waiters.map(w => (
                  <div key={w.id} className="glass-panel" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff" }}>
                    <div>
                      <h4 style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>{w.name}</h4>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Assigned: {w.tablesAssigned.join(", ")}</div>
                      <div style={{ fontSize: "0.75rem", color: "#047857", marginTop: "0.3rem", fontWeight: 600 }}>
                        Sales Today: ₹{w.totalSales} ({w.todayOrders} Orders)
                      </div>
                    </div>
                    <span className="badge badge-available">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

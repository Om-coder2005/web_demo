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
  Clock
} from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [staff, setStaff] = useState({ kitchen: [], waiters: [] });
  const [orders, setOrders] = useState([]);
  const [selectedFranchiseHotel, setSelectedFranchiseHotel] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setHotels(getHotels());
    setStaff(getStaff());
    setOrders(getOrders());

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
  const totalFranchiseRevenue = hotels.reduce((acc, h) => acc + h.dailyRevenue, 0);
  const totalActiveKOTs = orders.filter(o => o.status === "preparing").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0b1329", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ padding: "1.5rem 2rem", flex: 1, maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        {/* Banner / Header */}
        <div className="glass-panel" style={{
          padding: "1.5rem 2rem",
          marginBottom: "2rem",
          background: "#151d38",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
              <span className="badge badge-preparing">
                {isFranchiseMode ? "Franchise Enterprise View" : "Outlet Owner Dashboard"}
              </span>
              {selectedFranchiseHotel && (
                <button
                  onClick={() => setSelectedFranchiseHotel(null)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "#818cf8",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    cursor: "pointer"
                  }}
                >
                  ← Back to Franchise Overview
                </button>
              )}
            </div>

            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff" }}>
              Welcome back, {user.name}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              {isFranchiseMode 
                ? "Overview of all active franchise outlets & consolidated performance metrics." 
                : `Live operational monitoring & staff management for ${selectedFranchiseHotel ? selectedFranchiseHotel.name : "Outlet 1 (Main Street)"}`}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/tables" className="glass-button" style={{ fontSize: "0.85rem" }}>
              <UtensilsCrossed style={{ width: "16px", height: "16px" }} /> Table Layout
            </Link>
            <Link href="/kitchen" className="glass-button glass-button-success" style={{ fontSize: "0.85rem" }}>
              <ChefHat style={{ width: "16px", height: "16px" }} /> Kitchen Monitor ({totalActiveKOTs})
            </Link>
          </div>
        </div>

        {/* FRANCHISE OWNER FIRST VIEW: All Outlets Under Franchise */}
        {isFranchiseMode && (
          <>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building2 style={{ color: "#4f46e5", width: "20px", height: "20px" }} />
                Franchise Outlets ({hotels.length})
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
                {hotels.map(h => (
                  <div
                    key={h.id}
                    className="glass-panel"
                    style={{
                      padding: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                        <div>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                            {h.name}
                          </h3>
                          <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{h.address}</p>
                        </div>
                        <span className="badge badge-available">{h.status}</span>
                      </div>

                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                        background: "rgba(11, 19, 41, 0.6)",
                        padding: "0.8rem",
                        borderRadius: "10px",
                        margin: "1rem 0"
                      }}>
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Today Revenue</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#34d399" }}>Rs {h.dailyRevenue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Active Staff</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#818cf8" }}>{h.staffCount}</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenHotelView(h)}
                      className="glass-button"
                      style={{ width: "100%", justifyContent: "center", fontSize: "0.85rem", marginTop: "0.5rem" }}
                    >
                      Open Outlet Owner View <ArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Franchise Global Analytics */}
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <TrendingUp style={{ color: "#ec4899", width: "20px", height: "20px" }} />
                Consolidated Franchise Analytics
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                <div className="glass-panel" style={{ padding: "1.25rem" }}>
                  <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>Total Franchise Revenue</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#34d399", margin: "0.4rem 0" }}>
                    Rs {totalFranchiseRevenue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#34d399" }}>+18.4% vs last week</div>
                </div>

                <div className="glass-panel" style={{ padding: "1.25rem" }}>
                  <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>Active Preparing KOTs</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fbbf24", margin: "0.4rem 0" }}>
                    {totalActiveKOTs}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Real-time kitchen load</div>
                </div>

                <div className="glass-panel" style={{ padding: "1.25rem" }}>
                  <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>Average Order Value</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#818cf8", margin: "0.4rem 0" }}>
                    Rs 340.00
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#818cf8" }}>High profitability</div>
                </div>

                <div className="glass-panel" style={{ padding: "1.25rem" }}>
                  <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>Top Selling Menu Item</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ec4899", margin: "0.4rem 0" }}>
                    Bread & Butter
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>142 orders today</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* OUTLET OWNER VIEW */}
        {!isFranchiseMode && (
          <>
            {/* Top Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              <div className="glass-panel" style={{ padding: "1.25rem" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>Today's Revenue</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#34d399", margin: "0.4rem 0" }}>
                  Rs 48,200.00
                </div>
                <div style={{ fontSize: "0.75rem", color: "#34d399" }}>+12.5% vs yesterday</div>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>Active Kitchen Staff</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#818cf8", margin: "0.4rem 0" }}>
                  {staff.kitchen.length} Chefs
                </div>
                <div style={{ fontSize: "0.75rem", color: "#818cf8" }}>All shifts operational</div>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>Active Waiters On Floor</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ec4899", margin: "0.4rem 0" }}>
                  {staff.waiters.length} Waiters
                </div>
                <div style={{ fontSize: "0.75rem", color: "#ec4899" }}>12 tables active</div>
              </div>

              <div className="glass-panel" style={{ padding: "1.25rem" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>Current KOT Orders</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fbbf24", margin: "0.4rem 0" }}>
                  {totalActiveKOTs} Preparing
                </div>
                <div style={{ fontSize: "0.75rem", color: "#fbbf24" }}>Avg prep time 10m</div>
              </div>
            </div>

            {/* Kitchen Staff Section */}
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ChefHat style={{ color: "#fbbf24", width: "20px", height: "20px" }} />
                Kitchen Staff Overview
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {staff.kitchen.map(k => (
                  <div key={k.id} className="glass-panel" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>{k.name}</h4>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{k.role} • {k.shift} Shift</div>
                      <div style={{ fontSize: "0.75rem", color: "#fbbf24", marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <Star style={{ width: "12px", height: "12px", fill: "#fbbf24" }} /> Rating {k.rating}
                      </div>
                    </div>
                    <span className="badge badge-preparing">{k.activeKOTs} Active KOTs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Waiters Staff Section */}
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users style={{ color: "#34d399", width: "20px", height: "20px" }} />
                Waiters & Floor Performance
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {staff.waiters.map(w => (
                  <div key={w.id} className="glass-panel" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>{w.name}</h4>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Assigned Tables: {w.tablesAssigned.join(", ")}</div>
                      <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "0.3rem", fontWeight: 600 }}>
                        Sales Today: Rs {w.totalSales} ({w.todayOrders} Orders)
                      </div>
                    </div>
                    <span className="badge badge-available">Active</span>
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

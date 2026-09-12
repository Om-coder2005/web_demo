"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCurrentUser, setSelectedHotel, getHotels } from "../../lib/storage.js";
import Navbar from "../../components/Navbar.js";
import { 
  Building2, 
  Store, 
  UtensilsCrossed, 
  ChefHat, 
  CheckCircle2,
  ArrowRight,
  Flame
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const hotels = getHotels();
  const [selectedRole, setSelectedRole] = useState("hotel_owner");
  const [activeHotel, setActiveHotel] = useState(hotels[0] || null);

  const roles = [
    {
      id: "franchise_owner",
      title: "Franchise Owner",
      desc: "Multi-branch analytics, global revenue monitoring & 11-branch franchise auditing.",
      icon: Building2,
      color: "var(--brand-yellow)",
      redirect: "/dashboard",
      userName: "Nitin Shinde (Franchise Owner)"
    },
    {
      id: "hotel_owner",
      title: "Outlet Manager",
      desc: "Full branch dashboard, active waiters, chefs, table arrangement & menu catalog control.",
      icon: Store,
      color: "#ffffff",
      redirect: "/dashboard",
      userName: "Abhijeet Shinde (Outlet Manager)"
    },
    {
      id: "waiter",
      title: "Floor Waiter",
      desc: "Live table layout, 102-item menu card billing, kitchen notes & direct KOT dispatch.",
      icon: UtensilsCrossed,
      color: "var(--brand-yellow)",
      redirect: "/tables",
      userName: "Sanjay Gupta (Floor Waiter)"
    },
    {
      id: "kitchen",
      title: "Kitchen Master",
      desc: "Real-time kitchen order queue, consolidated item prep counter & KOT completion.",
      icon: ChefHat,
      color: "#22c55e",
      redirect: "/kitchen",
      userName: "Chef Ramesh Kumar (Head Chef)"
    }
  ];

  const handleLogin = (roleObj) => {
    const userPayload = {
      role: roleObj.id,
      name: roleObj.userName,
      hotelId: activeHotel ? activeHotel.id : "hotel-1",
      hotelName: activeHotel ? activeHotel.name : "Islampur Branch"
    };

    setCurrentUser(userPayload);
    if (activeHotel) {
      setSelectedHotel(activeHotel);
    }

    router.push(roleObj.redirect);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }} className="mobile-bottom-space">
      <Navbar />

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(1rem, 3vw, 2.5rem) 1rem"
      }}>
        <div className="glass-panel animate-fade-in" style={{
          maxWidth: "880px",
          width: "100%",
          padding: "clamp(1.25rem, 3vw, 2.5rem)",
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.06)"
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(252, 197, 0, 0.2)",
              color: "#b45309",
              padding: "0.3rem 0.8rem",
              borderRadius: "6px",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "0.75rem"
            }}>
              <Flame style={{ width: "13px", height: "13px" }} />
              <span>70 YEARS · ONE TASTE</span>
            </div>

            <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 900, color: "#0f172a", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
              Staff & Management Portal
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "550px", margin: "0.5rem auto 0" }}>
              Select your role below to access specialized operations for Khandoli Nitin's Canteen.
            </p>
          </div>

          {/* Role Cards Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: "1rem",
            marginBottom: "1.75rem"
          }}>
            {roles.map(r => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  style={{
                    background: isSelected ? "rgba(252, 197, 0, 0.12)" : "var(--bg-card-secondary)",
                    border: isSelected ? "2px solid var(--brand-yellow)" : "1px solid var(--border-color)",
                    borderRadius: "14px",
                    padding: "1.2rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  {isSelected && (
                    <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
                      <CheckCircle2 style={{ color: "#b45309", width: "20px", height: "20px" }} />
                    </div>
                  )}

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.75rem" }}>
                      <div style={{
                        background: isSelected ? "var(--brand-yellow)" : "#ffffff",
                        color: "#0f172a",
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: "1px solid var(--border-color)",
                        transition: "all 0.2s ease"
                      }}>
                        <Icon style={{ width: "22px", height: "22px" }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
                          {r.title}
                        </h4>
                        <span style={{ fontSize: "0.72rem", color: isSelected ? "#b45309" : "var(--text-muted)", fontWeight: 700 }}>
                          View: {r.redirect}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                      {r.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Outlet Branch Selector */}
          <div style={{
            background: "var(--bg-card-secondary)",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            marginBottom: "1.75rem",
            border: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
                Active Outlet Branch:
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Selected branch location across Maharashtra
              </div>
            </div>

            <select
              value={activeHotel ? activeHotel.id : ""}
              onChange={(e) => {
                const found = hotels.find(h => h.id === e.target.value);
                if (found) setActiveHotel(found);
              }}
              style={{
                background: "#ffffff",
                border: "1px solid var(--border-color)",
                color: "#0f172a",
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer",
                minWidth: "220px",
                maxWidth: "100%"
              }}
            >
              {hotels.map(h => (
                <option key={h.id} value={h.id} style={{ background: "#ffffff", color: "#0f172a" }}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Log In Button */}
          <button
            onClick={() => {
              const matched = roles.find(r => r.id === selectedRole);
              if (matched) handleLogin(matched);
            }}
            className="khandoli-btn-yellow"
            style={{
              width: "100%",
              padding: "0.95rem",
              fontSize: "0.95rem",
              borderRadius: "12px"
            }}
          >
            <span>Log In as {roles.find(r => r.id === selectedRole)?.title}</span>
            <ArrowRight style={{ width: "18px", height: "18px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}


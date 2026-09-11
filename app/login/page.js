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
  ArrowRight
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
      desc: "Full access to all outlets, global revenue analytics & branch management",
      icon: Building2,
      color: "#4f46e5",
      redirect: "/dashboard",
      userName: "Vikram Malhotra (Franchise Owner)"
    },
    {
      id: "hotel_owner",
      title: "Outlet Owner",
      desc: "Dashboard, kitchen staff, waiters, analytics, table & menu controls",
      icon: Store,
      color: "#ec4899",
      redirect: "/dashboard",
      userName: "Rajesh Sharma (Outlet Owner)"
    },
    {
      id: "waiter",
      title: "Waiter",
      desc: "Direct table layout view, order management, menu billing & KOT dispatch",
      icon: UtensilsCrossed,
      color: "#34d399",
      redirect: "/tables",
      userName: "Sanjay Gupta (Waiter)"
    },
    {
      id: "kitchen",
      title: "Kitchen",
      desc: "Kitchen display window, item consolidated summary, live KOT completion",
      icon: ChefHat,
      color: "#fbbf24",
      redirect: "/kitchen",
      userName: "Chef Ramesh Kumar (Head Chef)"
    }
  ];

  const handleLogin = (roleObj) => {
    const userPayload = {
      role: roleObj.id,
      name: roleObj.userName,
      hotelId: activeHotel ? activeHotel.id : "hotel-1",
      hotelName: activeHotel ? activeHotel.name : "Outlet 1 (Main Street)"
    };

    setCurrentUser(userPayload);
    if (activeHotel) {
      setSelectedHotel(activeHotel);
    }

    router.push(roleObj.redirect);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b1329", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem"
      }}>
        <div className="glass-panel animate-fade-in" style={{
          maxWidth: "850px",
          width: "100%",
          padding: "2.5rem",
          background: "#151d38",
          border: "1px solid rgba(255, 255, 255, 0.15)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>
              NextBills Role Selector
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
              Select any role below to experience the specialized POS workflows for each user type.
            </p>
          </div>

          {/* Role Cards Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem"
          }}>
            {roles.map(r => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  style={{
                    background: isSelected ? "rgba(79, 70, 229, 0.2)" : "#0b1329",
                    border: isSelected ? "2px solid #4f46e5" : "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "14px",
                    padding: "1.25rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative"
                  }}
                >
                  {isSelected && (
                    <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
                      <CheckCircle2 style={{ color: "#4f46e5", width: "20px", height: "20px" }} />
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                    <div style={{
                      background: "rgba(255,255,255,0.05)",
                      padding: "0.6rem",
                      borderRadius: "10px"
                    }}>
                      <Icon style={{ color: r.color, width: "24px", height: "24px" }} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>
                        {r.title}
                      </h4>
                      <span style={{ fontSize: "0.75rem", color: r.color, fontWeight: 600 }}>
                        Redirects to: {r.redirect}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.825rem", color: "#94a3b8", lineHeight: 1.4 }}>
                    {r.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Outlet Context Selector */}
          <div style={{
            background: "#0b1329",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                Active Outlet Branch:
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                Choose which outlet branch to simulate for this session
              </div>
            </div>

            <select
              value={activeHotel ? activeHotel.id : ""}
              onChange={(e) => {
                const found = hotels.find(h => h.id === e.target.value);
                if (found) setActiveHotel(found);
              }}
              style={{
                background: "#151d38",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#fff",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              {hotels.map(h => (
                <option key={h.id} value={h.id} style={{ background: "#151d38", color: "#fff" }}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Login Action */}
          <button
            onClick={() => {
              const matched = roles.find(r => r.id === selectedRole);
              if (matched) handleLogin(matched);
            }}
            className="glass-button"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "0.9rem",
              fontSize: "1rem",
              borderRadius: "12px"
            }}
          >
            Log In as {roles.find(r => r.id === selectedRole)?.title} <ArrowRight style={{ width: "20px", height: "20px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

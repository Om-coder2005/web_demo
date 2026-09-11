"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser, setCurrentUser, getSelectedHotel, setSelectedHotel, getHotels } from "../lib/storage.js";
import { 
  Store, 
  UtensilsCrossed, 
  ChefHat, 
  LayoutDashboard, 
  LogOut, 
  BookOpen, 
  Building2,
  ChevronDown,
  UserCheck
} from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotelState] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setHotels(getHotels());
    setSelectedHotelState(getSelectedHotel());

    const handleUserChange = () => {
      setUser(getCurrentUser());
      setSelectedHotelState(getSelectedHotel());
    };

    window.addEventListener("pos_user_change", handleUserChange);
    window.addEventListener("pos_hotel_change", handleUserChange);

    return () => {
      window.removeEventListener("pos_user_change", handleUserChange);
      window.removeEventListener("pos_hotel_change", handleUserChange);
    };
  }, []);

  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    setSelectedHotelState(hotel);
    setDropdownOpen(false);
  };

  if (!user) return null;

  return (
    <nav className="glass-panel" style={{
      margin: "1rem 1.5rem",
      padding: "0.8rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: "1rem",
      zIndex: 50,
      background: "#151d38",
      borderColor: "rgba(255, 255, 255, 0.1)"
    }}>
      {/* Brand: NextBills */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "8px",
            background: "#4f46e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Store style={{ color: "white", width: "20px", height: "20px" }} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.5px", color: "#f8fafc" }}>
              NextBills <span style={{ color: "#4f46e5" }}>POS</span>
            </span>
            <span style={{ display: "block", fontSize: "0.7rem", color: "#94a3b8", fontWeight: 500, marginTop: "-2px" }}>
              Smart Billing & Kitchen Operations
            </span>
          </div>
        </Link>

        {/* Outlet Switcher Dropdown */}
        {(user.role === "franchise_owner" || user.role === "hotel_owner") && (
          <div style={{ position: "relative", marginLeft: "0.5rem" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.4rem 0.8rem",
                color: "#e2e8f0",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer"
              }}
            >
              <Building2 style={{ width: "16px", height: "16px", color: "#4f46e5" }} />
              <span style={{ fontWeight: 600 }}>{selectedHotel ? selectedHotel.name : "Select Outlet"}</span>
              <ChevronDown style={{ width: "14px", height: "14px", color: "#94a3b8" }} />
            </button>

            {dropdownOpen && (
              <div className="glass-panel" style={{
                position: "absolute",
                top: "110%",
                left: 0,
                width: "240px",
                background: "#1e2847",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "10px",
                padding: "0.5rem",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                zIndex: 100
              }}>
                <div style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
                  Select Outlet Branch
                </div>
                {hotels.map(h => (
                  <div
                    key={h.id}
                    onClick={() => handleHotelSelect(h)}
                    style={{
                      padding: "0.5rem 0.6rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      color: selectedHotel?.id === h.id ? "#818cf8" : "#cbd5e1",
                      background: selectedHotel?.id === h.id ? "rgba(79, 70, 229, 0.2)" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>{h.name}</span>
                    {selectedHotel?.id === h.id && <UserCheck style={{ width: "14px", height: "14px" }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {user.role === "franchise_owner" && (
          <Link href="/dashboard" className="glass-button" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>
            <Building2 style={{ width: "16px", height: "16px" }} /> Franchise View
          </Link>
        )}

        {(user.role === "hotel_owner" || user.role === "franchise_owner") && (
          <>
            <Link href="/dashboard" className="glass-button" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>
              <LayoutDashboard style={{ width: "16px", height: "16px" }} /> Dashboard
            </Link>
            <Link href="/tables" className="glass-button" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>
              <UtensilsCrossed style={{ width: "16px", height: "16px" }} /> Table Layout
            </Link>
            <Link href="/menu" className="glass-button" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>
              <BookOpen style={{ width: "16px", height: "16px" }} /> Menu
            </Link>
            <Link href="/kitchen" className="glass-button" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>
              <ChefHat style={{ width: "16px", height: "16px" }} /> Kitchen View
            </Link>
          </>
        )}

        {user.role === "waiter" && (
          <Link href="/tables" className="glass-button" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>
            <UtensilsCrossed style={{ width: "16px", height: "16px" }} /> Tables & Orders
          </Link>
        )}

        {user.role === "kitchen" && (
          <Link href="/kitchen" className="glass-button" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>
            <ChefHat style={{ width: "16px", height: "16px" }} /> Kitchen Live Orders
          </Link>
        )}
      </div>

      {/* User Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#f8fafc" }}>
            {user.name}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#818cf8", fontWeight: 600, textTransform: "capitalize" }}>
            {user.role.replace("_", " ")}
          </div>
        </div>

        <Link
          href="/login"
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            padding: "0.4rem 0.8rem",
            borderRadius: "8px",
            fontSize: "0.8rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            textDecoration: "none"
          }}
        >
          <LogOut style={{ width: "14px", height: "14px" }} /> Switch Role
        </Link>
      </div>
    </nav>
  );
}

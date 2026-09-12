"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUser, setSelectedHotel, getHotels, getSelectedHotel } from "../lib/storage.js";
import { 
  UtensilsCrossed, 
  ChefHat, 
  LayoutDashboard, 
  LogOut, 
  BookOpen, 
  Building2,
  ChevronDown,
  UserCheck,
  Menu as MenuIcon,
  X,
  Store
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotelState] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
  };

  if (!user) return null;

  const navLinks = [
    {
      href: "/tables",
      label: "Tables & Billing",
      icon: UtensilsCrossed,
      roles: ["waiter", "hotel_owner", "franchise_owner"]
    },
    {
      href: "/kitchen",
      label: "Kitchen Queue",
      icon: ChefHat,
      roles: ["kitchen", "hotel_owner", "franchise_owner"]
    },
    {
      href: "/menu",
      label: "Menu Catalog",
      icon: BookOpen,
      roles: ["hotel_owner", "franchise_owner"]
    },
    {
      href: "/dashboard",
      label: user.role === "franchise_owner" ? "Franchise Analytics" : "Dashboard",
      icon: LayoutDashboard,
      roles: ["hotel_owner", "franchise_owner"]
    }
  ];

  const allowedLinks = navLinks.filter(link => link.roles.includes(user.role));

  return (
    <>
      {/* Top Navbar */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0.6rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem"
      }}>
        {/* Brand: Khandoli Nitin's Canteen */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              background: "var(--brand-yellow)",
              border: "2px solid #000000",
              boxShadow: "2px 2px 0px #000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem"
            }}>
              🍳
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                <span className="font-sherly" style={{ fontWeight: 900, fontSize: "1.25rem", letterSpacing: "0.03em", color: "#000000", textTransform: "uppercase" }}>
                  KHANDOLI
                </span>
                <span className="font-mellos" style={{ fontSize: "0.65rem", fontWeight: 900, color: "#000000", background: "var(--brand-yellow)", padding: "0.1rem 0.4rem", border: "1px solid #000000", borderRadius: "4px" }}>
                  POS
                </span>
              </div>
              <span className="font-standard" style={{ display: "block", fontSize: "0.68rem", color: "#333333", fontWeight: 600, letterSpacing: "0.03em" }}>
                Nitin's Canteen · 11 Outlets
              </span>
            </div>
          </Link>

          {/* Outlet Switcher (Desktop) */}
          {(user.role === "franchise_owner" || user.role === "hotel_owner") && (
            <div className="desktop-only" style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="font-mellos"
                style={{
                  background: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: "8px",
                  padding: "0.4rem 0.8rem",
                  color: "#000000",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  cursor: "pointer",
                  fontWeight: 700,
                  boxShadow: "2px 2px 0px #000000"
                }}
              >
                <Store style={{ width: "15px", height: "15px", color: "#000000" }} />
                <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedHotel ? selectedHotel.name : "Select Outlet"}
                </span>
                <ChevronDown style={{ width: "13px", height: "13px", color: "#000000" }} />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "115%",
                  left: 0,
                  width: "250px",
                  background: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: "10px",
                  padding: "0.5rem",
                  boxShadow: "4px 4px 0px #000000",
                  zIndex: 100
                }}>
                  <div className="font-mellos" style={{ padding: "0.4rem 0.6rem", fontSize: "0.7rem", color: "#000000", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Select Khandoli Outlet
                  </div>
                  {hotels.map(h => (
                    <div
                      key={h.id}
                      onClick={() => handleHotelSelect(h)}
                      className="font-standard"
                      style={{
                        padding: "0.55rem 0.65rem",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#000000",
                        background: selectedHotel?.id === h.id ? "var(--brand-yellow)" : "transparent",
                        border: selectedHotel?.id === h.id ? "1px solid #000000" : "1px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.2rem"
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

        {/* Desktop Navigation Links */}
        <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {allowedLinks.map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="font-mellos"
                style={{
                  background: isActive ? "var(--brand-yellow)" : "#ffffff",
                  color: "#000000",
                  border: "2px solid #000000",
                  boxShadow: isActive ? "2px 2px 0px #000000" : "none",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  transition: "all 0.15s ease"
                }}
              >
                <Icon style={{ width: "15px", height: "15px" }} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Section: User Status & Mobile Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* User Role Badge (Desktop) */}
          <div className="desktop-only" style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#b45309", fontWeight: 700, textTransform: "uppercase" }}>
              {user.role.replace("_", " ")}
            </div>
          </div>

          {/* Switch Role Button */}
          <Link
            href="/login"
            className="desktop-only"
            style={{
              background: "var(--bg-card-secondary)",
              border: "1px solid var(--border-color)",
              color: "#0f172a",
              padding: "0.45rem 0.75rem",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              textDecoration: "none",
              transition: "all 0.2s ease"
            }}
          >
            <LogOut style={{ width: "13px", height: "13px", color: "#b45309" }} />
            <span>Switch</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Drawer"
            className="mobile-only"
            style={{
              background: mobileMenuOpen ? "var(--brand-yellow)" : "var(--bg-card-secondary)",
              color: mobileMenuOpen ? "#000000" : "#0f172a",
              border: "1px solid var(--border-color)",
              padding: "0.5rem",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {mobileMenuOpen ? <X style={{ width: "20px", height: "20px" }} /> : <MenuIcon style={{ width: "20px", height: "20px" }} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: "fixed",
          top: "60px",
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(16px)",
          zIndex: 49,
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          overflowY: "auto"
        }}>
          {/* Active User Card */}
          <div style={{
            background: "var(--bg-card-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                {user.name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>
                Role: {user.role.replace("_", " ")}
              </div>
            </div>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: "#ffffff",
                border: "1px solid var(--border-color)",
                color: "#0f172a",
                padding: "0.45rem 0.8rem",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <LogOut style={{ width: "14px", height: "14px" }} /> Switch
            </Link>
          </div>

          {/* Mobile Outlet Switcher */}
          {(user.role === "franchise_owner" || user.role === "hotel_owner") && (
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>
                Active Outlet Branch
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {hotels.map(h => (
                  <button
                    key={h.id}
                    onClick={() => handleHotelSelect(h)}
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      textAlign: "left",
                      color: selectedHotel?.id === h.id ? "#000000" : "#0f172a",
                      background: selectedHotel?.id === h.id ? "var(--brand-yellow)" : "var(--bg-card-secondary)",
                      border: "1px solid var(--border-color)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>{h.name}</span>
                    {selectedHotel?.id === h.id && <UserCheck style={{ width: "16px", height: "16px" }} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Links for Mobile Drawer */}
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>
              Quick Navigation
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {allowedLinks.map(link => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      background: isActive ? "var(--brand-yellow)" : "var(--bg-card-secondary)",
                      color: isActive ? "#000000" : "#0f172a",
                      border: "1px solid var(--border-color)",
                      padding: "0.85rem 1rem",
                      borderRadius: "10px",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem"
                    }}
                  >
                    <Icon style={{ width: "18px", height: "18px" }} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar */}
      <div className="mobile-only" style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "rgba(255, 255, 255, 0.97)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom, 0px)"
      }}>
        {allowedLinks.map(link => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                textDecoration: "none",
                color: isActive ? "#000000" : "var(--text-muted)",
                flex: 1,
                height: "100%",
                fontSize: "0.68rem",
                fontWeight: isActive ? 800 : 600,
                transition: "color 0.15s ease"
              }}
            >
              <div style={{
                padding: "4px 12px",
                borderRadius: "12px",
                background: isActive ? "var(--brand-yellow)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Icon style={{ width: "20px", height: "20px" }} />
              </div>
              <span>{link.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}


"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar.js";
import KOTItemSummary from "../../components/KOTItemSummary.js";
import OrderModal from "../../components/OrderModal.js";
import { getTables, setTables, getOrders, setOrders, getMenu, getCurrentUser } from "../../lib/storage.js";
import { Utensils, CheckCircle2, AlertCircle, Plus, Receipt } from "lucide-react";

export default function TablesPage() {
  const [user, setUser] = useState(null);
  const [tables, setTablesState] = useState([]);
  const [orders, setOrdersState] = useState([]);
  const [menu, setMenuState] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeModalOrder, setActiveModalOrder] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
    setTablesState(getTables());
    setOrdersState(getOrders());
    setMenuState(getMenu());

    const handleUpdate = () => {
      setTablesState(getTables());
      setOrdersState(getOrders());
      setMenuState(getMenu());
    };

    window.addEventListener("pos_data_update", handleUpdate);
    return () => window.removeEventListener("pos_data_update", handleUpdate);
  }, []);

  const handleTableClick = (table) => {
    setSelectedTable(table);
    const existingOrder = orders.find(o => o.tableNumber === table.number && o.status === "preparing");
    setActiveModalOrder(existingOrder || null);
  };

  const handleSaveOrder = ({ tableNumber, items, notes }) => {
    let updatedOrders = [...orders];
    let existingIndex = updatedOrders.findIndex(o => o.tableNumber === tableNumber && o.status === "preparing");

    if (existingIndex > -1) {
      updatedOrders[existingIndex] = {
        ...updatedOrders[existingIndex],
        items,
        notes
      };
    } else {
      const newOrder = {
        id: `kot-${Date.now().toString().slice(-4)}`,
        tableNumber,
        waiterName: user?.name || "Sanjay Gupta",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
        status: "preparing",
        items,
        notes
      };
      updatedOrders.unshift(newOrder);
    }

    // Update tables
    const updatedTables = tables.map(t => {
      if (t.number === tableNumber) {
        return {
          ...t,
          status: "Occupied",
          currentOrderId: updatedOrders.find(o => o.tableNumber === tableNumber && o.status === "preparing")?.id
        };
      }
      return t;
    });

    setOrders(updatedOrders);
    setOrdersState(updatedOrders);
    setTables(updatedTables);
    setTablesState(updatedTables);
    setSelectedTable(null);
  };

  const handleMarkBilled = (tableNumber) => {
    const updatedTables = tables.map(t => {
      if (t.number === tableNumber) {
        return { ...t, status: "Available", currentOrderId: null };
      }
      return t;
    });

    setTables(updatedTables);
    setTablesState(updatedTables);
    setSelectedTable(null);
  };

  const [statusFilter, setStatusFilter] = useState("All");

  if (!user) return null;

  const filteredTables = statusFilter === "All" 
    ? tables 
    : tables.filter(t => t.status.toLowerCase() === statusFilter.toLowerCase());

  const availableCount = tables.filter(t => t.status === "Available").length;
  const occupiedCount = tables.filter(t => t.status === "Occupied").length;
  const billedCount = tables.filter(t => t.status === "Billed").length;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }} className="mobile-bottom-space">
      <Navbar />

      <div style={{ padding: "clamp(1rem, 2.5vw, 2rem)", flex: 1, maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        {/* Consolidated KOT Top Item Banner */}
        <KOTItemSummary orders={orders} />

        {/* Section Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span className="badge badge-khandoli">Floor POS</span>
              <span style={{ fontSize: "0.78rem", color: "#b45309", fontWeight: 700 }}>
                {user.hotelName || "Islampur Branch"}
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 900, color: "#0f172a", textTransform: "uppercase" }}>
              Table Layout & Live Orders
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Tap any table to open current KOT order, add items, or mark as billed.
            </p>
          </div>

          {/* Table Status Filter Chips */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {[
              { label: "All", count: tables.length },
              { label: "Available", count: availableCount },
              { label: "Occupied", count: occupiedCount },
              { label: "Billed", count: billedCount }
            ].map(tab => {
              const isSelected = statusFilter === tab.label;
              return (
                <button
                  key={tab.label}
                  onClick={() => setStatusFilter(tab.label)}
                  style={{
                    background: isSelected ? "var(--brand-yellow)" : "#ffffff",
                    color: isSelected ? "#000000" : "var(--text-muted)",
                    border: isSelected ? "1px solid var(--brand-yellow)" : "1px solid var(--border-color)",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Grid (Responsive: 2 cols on mobile, 3-4 on tablet, 4-6 on desktop) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 170px), 1fr))",
          gap: "1rem"
        }}>
          {filteredTables.map(t => {
            const hasOrder = orders.find(o => o.tableNumber === t.number && o.status === "preparing");
            const itemCount = hasOrder ? hasOrder.items.reduce((acc, curr) => acc + curr.quantity, 0) : 0;
            const orderTotal = hasOrder ? hasOrder.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(2) : "0.00";

            const isOccupied = t.status === "Occupied";
            const isBilled = t.status === "Billed";

            return (
              <div
                key={t.id}
                onClick={() => handleTableClick(t)}
                className="glass-panel"
                style={{
                  padding: "1.15rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: isOccupied 
                    ? "2px solid var(--brand-yellow)" 
                    : isBilled 
                    ? "1px solid rgba(59, 130, 246, 0.5)" 
                    : "1px solid var(--border-color)",
                  background: isOccupied 
                    ? "rgba(252, 197, 0, 0.12)" 
                    : "#ffffff"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                {/* Card Header: Table Number & Status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: isOccupied ? "var(--brand-yellow)" : "var(--bg-card-secondary)",
                    color: isOccupied ? "#000000" : "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "1.15rem",
                    boxShadow: isOccupied ? "0 2px 8px rgba(252, 197, 0, 0.3)" : "none"
                  }}>
                    T{t.number}
                  </div>
                  <span className={`badge ${isOccupied ? "badge-occupied" : isBilled ? "badge-billed" : "badge-available"}`}>
                    {t.status}
                  </span>
                </div>

                {/* Card Body: Info */}
                <div style={{ marginBottom: "0.85rem", minHeight: "44px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    Seats: {t.capacity} Persons
                  </div>
                  {hasOrder ? (
                    <div style={{ marginTop: "0.35rem" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a" }}>
                        KOT #{hasOrder.id} • {itemCount} items
                      </div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#b45309", marginTop: "0.15rem" }}>
                        ₹{orderTotal}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                      Ready for guests
                    </div>
                  )}
                </div>

                {/* Card Footer: Quick Action Indicator */}
                <div style={{
                  background: isOccupied ? "rgba(252, 197, 0, 0.2)" : "var(--bg-card-secondary)",
                  color: isOccupied ? "#b45309" : "var(--text-muted)",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "8px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span>{hasOrder ? "Modify Order" : "New Order"}</span>
                  <Plus style={{ width: "13px", height: "13px" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POS Order Modal */}
      {selectedTable && (
        <OrderModal
          table={selectedTable}
          order={activeModalOrder}
          menu={menu}
          onClose={() => setSelectedTable(null)}
          onSaveOrder={handleSaveOrder}
          onMarkBilled={handleMarkBilled}
        />
      )}
    </div>
  );
}

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

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#0b1329", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ padding: "1.5rem 2rem", flex: 1, maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        {/* Consolidated KOT Top Item Banner */}
        <KOTItemSummary orders={orders} />

        {/* Section Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem"
        }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff" }}>
              Restaurant Table Layout & Live POS Orders
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              Click any table to open current order KOT and add items from menu
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <span className="badge badge-available">Available ({tables.filter(t => t.status === "Available").length})</span>
            <span className="badge badge-occupied">Occupied ({tables.filter(t => t.status === "Occupied").length})</span>
            <span className="badge badge-billed">Billed ({tables.filter(t => t.status === "Billed").length})</span>
          </div>
        </div>

        {/* Table Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1.25rem"
        }}>
          {tables.map(t => {
            const hasOrder = orders.find(o => o.tableNumber === t.number && o.status === "preparing");
            const itemCount = hasOrder ? hasOrder.items.reduce((acc, curr) => acc + curr.quantity, 0) : 0;
            const orderTotal = hasOrder ? hasOrder.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(2) : "0.00";

            return (
              <div
                key={t.id}
                onClick={() => handleTableClick(t)}
                className="glass-panel"
                style={{
                  padding: "1.5rem",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  border: t.status === "Occupied" 
                    ? "1px solid rgba(239, 68, 68, 0.4)" 
                    : t.status === "Billed" 
                    ? "1px solid rgba(59, 130, 246, 0.4)" 
                    : "1px solid rgba(16, 185, 129, 0.3)",
                  background: t.status === "Occupied" 
                    ? "rgba(239, 68, 68, 0.1)" 
                    : t.status === "Billed" 
                    ? "rgba(59, 130, 246, 0.1)" 
                    : "#151d38"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: t.status === "Occupied" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1.2rem",
                    color: t.status === "Occupied" ? "#f87171" : "#34d399"
                  }}>
                    T{t.number}
                  </div>
                  <span className={`badge ${t.status === "Occupied" ? "badge-occupied" : t.status === "Billed" ? "badge-billed" : "badge-available"}`}>
                    {t.status}
                  </span>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Capacity: {t.capacity} Seats</div>
                  {hasOrder ? (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                        KOT #{hasOrder.id} • {itemCount} Items
                      </div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#34d399", marginTop: "0.2rem" }}>
                        Rs {orderTotal}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.5rem" }}>
                      No active order
                    </div>
                  )}
                </div>

                <div style={{
                  background: "rgba(0,0,0,0.25)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <span>{hasOrder ? "Edit / Add Order" : "Take New Order"}</span>
                  <Plus style={{ width: "14px", height: "14px", color: "#818cf8" }} />
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

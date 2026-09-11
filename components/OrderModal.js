"use client";

import { useState } from "react";
import { X, Plus, Minus, Trash2, Send, Clock, ChefHat, Check, Search } from "lucide-react";

export default function OrderModal({ table, order, menu, onClose, onSaveOrder, onMarkBilled }) {
  const [currentItems, setCurrentItems] = useState(
    order ? JSON.parse(JSON.stringify(order.items)) : []
  );
  const [notes, setNotes] = useState(order ? order.notes || "" : "");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", ...Array.from(new Set(menu.map(m => m.category)))];

  const handleAddItem = (menuItem) => {
    setCurrentItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === menuItem.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: menuItem.id,
            name: menuItem.name,
            quantity: 1,
            price: menuItem.price,
            status: "preparing"
          }
        ];
      }
    });
  };

  const handleQuantityChange = (itemId, delta) => {
    setCurrentItems(prev => {
      return prev
        .map(item => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const calculateTotal = () => {
    return currentItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0).toFixed(2);
  };

  const handleDispatchKOT = () => {
    if (currentItems.length === 0) return;
    onSaveOrder({
      tableNumber: table.number,
      items: currentItems,
      notes: notes
    });
  };

  const filteredMenu = menu.filter(m => {
    const matchesCategory = activeCategory === "All" || m.category === activeCategory;
    const matchesSearch = searchQuery === "" || m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(11, 19, 41, 0.85)",
      backdropFilter: "blur(8px)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem"
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: "95%",
        maxWidth: "1050px",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#151d38",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
      }}>
        {/* Header */}
        <div style={{
          padding: "1.2rem 1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#1e2847"
        }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
              Table #{table.number} - Order & POS Billing
            </h2>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              Status: <span style={{ color: "#34d399", fontWeight: 700 }}>{table.status}</span> | Capacity: {table.capacity} Persons
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#fff",
              padding: "0.4rem",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", flex: 1, overflow: "hidden" }}>
          {/* Left Panel: Current Order Summary */}
          <div style={{
            padding: "1.25rem",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            background: "rgba(11, 19, 41, 0.4)",
            overflowY: "auto"
          }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ChefHat style={{ width: "18px", height: "18px", color: "#818cf8" }} />
              Current Order KOT Items ({currentItems.length})
            </h3>

            {currentItems.length === 0 ? (
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                textAlign: "center",
                gap: "0.5rem"
              }}>
                <Clock style={{ width: "32px", height: "32px", opacity: 0.5 }} />
                <p style={{ fontSize: "0.85rem" }}>No items added yet. Click items from the right menu panel to add.</p>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {currentItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: "#1e2847",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      padding: "0.6rem 0.8rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#f8fafc" }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        Rs {item.price.toFixed(2)} each
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "rgba(0,0,0,0.3)",
                        padding: "0.2rem 0.4rem",
                        borderRadius: "6px"
                      }}>
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", display: "flex" }}
                        >
                          <Minus style={{ width: "14px", height: "14px" }} />
                        </button>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, minWidth: "16px", textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          style={{ background: "none", border: "none", color: "#34d399", cursor: "pointer", display: "flex" }}
                        >
                          <Plus style={{ width: "14px", height: "14px" }} />
                        </button>
                      </div>

                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#34d399", minWidth: "65px", textAlign: "right" }}>
                        Rs {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* KOT Notes Input */}
            <div style={{ marginTop: "1rem" }}>
              <label style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>
                Kitchen Notes / Custom Instructions
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Less spicy, extra butter, allergy alert..."
                style={{
                  width: "100%",
                  background: "#0b1329",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "0.5rem 0.75rem",
                  color: "#f8fafc",
                  fontSize: "0.8rem",
                  outline: "none"
                }}
              />
            </div>

            {/* Total and Actions */}
            <div style={{
              marginTop: "1rem",
              paddingTop: "0.8rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 600 }}>Total Payable:</span>
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#34d399" }}>Rs {calculateTotal()}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button
                  onClick={handleDispatchKOT}
                  disabled={currentItems.length === 0}
                  className="glass-button"
                  style={{
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    opacity: currentItems.length === 0 ? 0.5 : 1
                  }}
                >
                  <Send style={{ width: "16px", height: "16px" }} /> Send to Kitchen
                </button>

                {table.status !== "Available" && (
                  <button
                    onClick={() => onMarkBilled(table.number)}
                    className="glass-button glass-button-success"
                    style={{ justifyContent: "center", fontSize: "0.85rem" }}
                  >
                    <Check style={{ width: "16px", height: "16px" }} /> Complete & Bill
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Menu Selection Grid */}
          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
            
            {/* Search Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#0b1329", padding: "0.4rem 0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Search style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search dish name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: "none", border: "none", color: "#fff", outline: "none", fontSize: "0.85rem", width: "100%" }}
              />
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    background: activeCategory === cat ? "#4f46e5" : "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "0.75rem",
              overflowY: "auto"
            }}>
              {filteredMenu.map(m => (
                <div
                  key={m.id}
                  onClick={() => handleAddItem(m)}
                  style={{
                    background: "#1e2847",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "110px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#4f46e5"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#f8fafc", marginBottom: "0.2rem" }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8", lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {m.description}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <span style={{ fontWeight: 800, color: "#34d399", fontSize: "0.9rem" }}>Rs {m.price}</span>
                    <span style={{ background: "rgba(79, 70, 229, 0.3)", color: "#a5b4fc", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700 }}>
                      + Add
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

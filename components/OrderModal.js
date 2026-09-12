"use client";

import { useState } from "react";
import { X, Plus, Minus, Trash2, Send, Clock, ChefHat, Check, Search, ShoppingBag, BookOpen } from "lucide-react";

export default function OrderModal({ table, order, menu, onClose, onSaveOrder, onMarkBilled }) {
  const [currentItems, setCurrentItems] = useState(
    order ? JSON.parse(JSON.stringify(order.items)) : []
  );
  const [notes, setNotes] = useState(order ? order.notes || "" : "");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileTab, setMobileTab] = useState("menu"); // "menu" | "cart"

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
            category: menuItem.category,
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

  const totalQuantity = currentItems.reduce((acc, curr) => acc + curr.quantity, 0);
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

  const isNonVegOrEgg = (item) => {
    const nonVegCategories = ['Khandoli', 'Eggs & More', 'Wraps', 'Khandoli Sandwiches', 'Mutton Kheema Pav'];
    const nonVegKeywords = ['egg', 'khandoli', 'bhurji', 'omelette', 'omlet', 'kheema', 'mutton'];
    if (nonVegCategories.includes(item.category)) return true;
    const lower = item.name.toLowerCase();
    return nonVegKeywords.some(kw => lower.includes(kw));
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
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(8px)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(0px, 2vw, 1.5rem)"
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: "100%",
        maxWidth: "1100px",
        height: "100%",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#ffffff",
        border: "1px solid var(--border-color)",
        borderRadius: "clamp(0px, 2vw, 16px)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.15)"
      }}>
        {/* Header */}
        <div style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-card-secondary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "var(--brand-yellow)",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "1.1rem"
            }}>
              T{table.number}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
                  Table #{table.number} POS Order
                </h2>
                <span className={`badge ${table.status === "Occupied" ? "badge-occupied" : "badge-available"}`}>
                  {table.status}
                </span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Capacity: {table.capacity} Persons · Khandoli Islampur Menu (102 Items)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Order Modal"
            style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              color: "#0f172a",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="mobile-only" style={{
          display: "flex",
          borderBottom: "1px solid var(--border-color)",
          background: "#ffffff"
        }}>
          <button
            onClick={() => setMobileTab("menu")}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: mobileTab === "menu" ? "var(--brand-yellow)" : "transparent",
              color: mobileTab === "menu" ? "#000000" : "#0f172a",
              border: "none",
              fontWeight: 800,
              fontSize: "0.82rem",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              cursor: "pointer"
            }}
          >
            <BookOpen style={{ width: "16px", height: "16px" }} />
            <span>Menu Catalog</span>
          </button>

          <button
            onClick={() => setMobileTab("cart")}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: mobileTab === "cart" ? "var(--brand-yellow)" : "transparent",
              color: mobileTab === "cart" ? "#000000" : "#0f172a",
              border: "none",
              fontWeight: 800,
              fontSize: "0.82rem",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              cursor: "pointer"
            }}
          >
            <ShoppingBag style={{ width: "16px", height: "16px" }} />
            <span>Order Cart ({totalQuantity})</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative"
        }}>
          {/* Left Panel: Current Order Cart */}
          <div style={{
            width: "400px",
            minWidth: "320px",
            borderRight: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-card-secondary)",
            overflowY: "auto",
            ...(typeof window !== "undefined" && window.innerWidth <= 768 && mobileTab !== "cart" ? { display: "none" } : {})
          }} className={mobileTab !== "cart" ? "desktop-only" : ""}>
            <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f172a" }}>
                <ChefHat style={{ width: "18px", height: "18px", color: "#b45309" }} />
                <span>KOT Ticket ({totalQuantity} items)</span>
              </h3>
              {currentItems.length > 0 && (
                <button
                  onClick={() => setCurrentItems([])}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.72rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                  <Trash2 style={{ width: "13px", height: "13px" }} /> Clear
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {currentItems.length === 0 ? (
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "2rem",
                gap: "0.75rem"
              }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(252, 197, 0, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock style={{ width: "24px", height: "24px", color: "#b45309" }} />
                </div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a" }}>No items added yet</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Select items from the menu to start order.</p>
                <button
                  onClick={() => setMobileTab("menu")}
                  className="mobile-only khandoli-btn-yellow"
                  style={{ fontSize: "0.78rem", padding: "0.45rem 1rem", marginTop: "0.5rem" }}
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {currentItems.map(item => {
                  const eggDish = isNonVegOrEgg(item);
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid var(--border-color)",
                        borderRadius: "10px",
                        padding: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.5rem"
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.2rem" }}>
                          <span style={{ fontSize: "0.75rem" }}>{eggDish ? "🔴" : "🟢"}</span>
                          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.name}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 700 }}>
                          ₹{item.price.toFixed(2)} each
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                        {/* Stepper */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          background: "var(--bg-card-secondary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                          overflow: "hidden"
                        }}>
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            aria-label="Decrease quantity"
                            style={{
                              width: "36px",
                              height: "36px",
                              background: "none",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <Minus style={{ width: "16px", height: "16px" }} />
                          </button>
                          <span style={{ fontSize: "0.9rem", fontWeight: 900, minWidth: "24px", textAlign: "center", color: "#0f172a" }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            aria-label="Increase quantity"
                            style={{
                              width: "36px",
                              height: "36px",
                              background: "none",
                              border: "none",
                              color: "#b45309",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <Plus style={{ width: "16px", height: "16px" }} />
                          </button>
                        </div>

                        <span style={{ fontSize: "0.9rem", fontWeight: 900, color: "#0f172a", minWidth: "55px", textAlign: "right" }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Kitchen Notes Input */}
            <div style={{ padding: "0.85rem", borderTop: "1px solid var(--border-color)" }}>
              <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem", fontWeight: 700, textTransform: "uppercase" }}>
                Kitchen Notes / Special Requests
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Extra butter, less spicy, no onion..."
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "0.55rem 0.75rem",
                  color: "#0f172a",
                  fontSize: "0.82rem",
                  outline: "none"
                }}
              />
            </div>

            {/* Total and Actions */}
            <div style={{
              padding: "1rem",
              borderTop: "1px solid var(--border-color)",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                  Total Amount:
                </span>
                <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#b45309" }}>
                  ₹{calculateTotal()}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: table.status !== "Available" ? "1fr 1fr" : "1fr", gap: "0.6rem" }}>
                <button
                  onClick={handleDispatchKOT}
                  disabled={currentItems.length === 0}
                  className="khandoli-btn-yellow"
                  style={{
                    opacity: currentItems.length === 0 ? 0.4 : 1,
                    fontSize: "0.85rem",
                    padding: "0.7rem 1rem"
                  }}
                >
                  <Send style={{ width: "16px", height: "16px" }} />
                  <span>Send to Kitchen</span>
                </button>

                {table.status !== "Available" && (
                  <button
                    onClick={() => onMarkBilled(table.number)}
                    className="khandoli-btn-black"
                    style={{
                      fontSize: "0.85rem",
                      padding: "0.7rem 1rem",
                      border: "1px solid #10b981",
                      color: "#ffffff",
                      background: "#10b981"
                    }}
                  >
                    <Check style={{ width: "16px", height: "16px" }} />
                    <span>Complete & Bill</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Menu Selection Grid */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "1rem",
            gap: "0.85rem",
            overflowY: "auto",
            background: "#ffffff",
            ...(typeof window !== "undefined" && window.innerWidth <= 768 && mobileTab !== "menu" ? { display: "none" } : {})
          }} className={mobileTab !== "menu" ? "desktop-only" : ""}>

            {/* Search Input */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--bg-card-secondary)",
              padding: "0.55rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid var(--border-color)"
            }}>
              <Search style={{ width: "16px", height: "16px", color: "#b45309" }} />
              <input
                type="text"
                placeholder="Search Khandoli dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: "none", border: "none", color: "#0f172a", outline: "none", fontSize: "0.85rem", width: "100%" }}
              />
            </div>

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.3rem" }}>
              {categories.map(cat => {
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      background: isSelected ? "var(--brand-yellow)" : "var(--bg-card-secondary)",
                      border: isSelected ? "1px solid var(--brand-yellow)" : "1px solid var(--border-color)",
                      color: isSelected ? "#000000" : "#0f172a",
                      padding: "0.35rem 0.85rem",
                      borderRadius: "20px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Menu Items Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 190px), 1fr))",
              gap: "0.75rem",
              overflowY: "auto",
              flex: 1
            }}>
              {filteredMenu.map(m => {
                const eggDish = isNonVegOrEgg(m);
                const countInCart = currentItems.find(it => it.id === m.id)?.quantity || 0;

                return (
                  <div
                    key={m.id}
                    onClick={() => handleAddItem(m)}
                    style={{
                      background: "var(--bg-card-secondary)",
                      border: countInCart > 0 ? "2px solid var(--brand-yellow)" : "1px solid var(--border-color)",
                      borderRadius: "12px",
                      padding: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: "115px",
                      position: "relative"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--brand-yellow)"}
                    onMouseLeave={(e) => {
                      if (countInCart === 0) e.currentTarget.style.borderColor = "var(--border-color)";
                    }}
                  >
                    {countInCart > 0 && (
                      <span style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        background: "var(--brand-yellow)",
                        color: "#000",
                        fontWeight: 900,
                        fontSize: "0.7rem",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                      }}>
                        {countInCart}
                      </span>
                    )}

                    <div>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.35rem", marginBottom: "0.25rem" }}>
                        <h4 style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a", lineHeight: 1.3 }}>
                          {m.name}
                        </h4>
                        <span style={{ fontSize: "0.75rem", flexShrink: 0 }}>
                          {eggDish ? "🔴" : "🟢"}
                        </span>
                      </div>
                      <p style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        lineClamp: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {m.description}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.6rem" }}>
                      <span style={{ fontWeight: 900, color: "#b45309", fontSize: "0.95rem" }}>
                        ₹{m.price}
                      </span>
                      <span style={{
                        background: countInCart > 0 ? "var(--brand-yellow)" : "#ffffff",
                        color: countInCart > 0 ? "#000000" : "#0f172a",
                        border: "1px solid var(--border-color)",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 800
                      }}>
                        {countInCart > 0 ? `+ Add (${countInCart})` : "+ Add"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Bottom Quick Action Bar for Menu Tab */}
            {totalQuantity > 0 && (
              <div className="mobile-only" style={{
                position: "sticky",
                bottom: 0,
                background: "var(--brand-yellow)",
                color: "#000000",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 15px rgba(252, 197, 0, 0.4)",
                cursor: "pointer",
                zIndex: 20
              }} onClick={() => setMobileTab("cart")}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: "0.95rem" }}>
                    {totalQuantity} items added · ₹{calculateTotal()}
                  </div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, opacity: 0.85 }}>
                    Tap to review cart & send to kitchen
                  </div>
                </div>
                <button style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  cursor: "pointer"
                }}>
                  View Cart →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


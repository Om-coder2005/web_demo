"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar.js";
import { getMenu, setMenu, getCurrentUser } from "../../lib/storage.js";
import { BookOpen, Plus, Search } from "lucide-react";
import { ReadOnlyAlert } from "../../components/MachineConnectivity.js";

export default function MenuPage() {
  const [menu, setMenuState] = useState([]);
  const [user, setUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const isReadOnly = ["hotel_owner", "franchise_owner"].includes(user?.role);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Bread & Toast",
    price: "",
    description: "Pure Veg • Freshly Prepared",
    prepTime: "10 mins"
  });

  useEffect(() => {
    setUser(getCurrentUser());
    setMenuState(getMenu());

    const handleUpdate = () => setMenuState(getMenu());
    window.addEventListener("pos_data_update", handleUpdate);
    return () => window.removeEventListener("pos_data_update", handleUpdate);
  }, []);

  const handleToggleAvailability = (itemId) => {
    if (isReadOnly) return;
    const updated = menu.map(m => m.id === itemId ? { ...m, available: !m.available } : m);
    setMenu(updated);
    setMenuState(updated);
  };

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    const itemToAdd = {
      id: `m${Date.now().toString().slice(-4)}`,
      name: newItem.name,
      category: newItem.category,
      price: parseFloat(newItem.price),
      description: newItem.description || "Pure Veg • Freshly Prepared",
      prepTime: newItem.prepTime || "10 mins",
      available: true
    };

    const updated = [...menu, itemToAdd];
    setMenu(updated);
    setMenuState(updated);

    setNewItem({ name: "", category: "Bread & Toast", price: "", description: "Pure Veg • Freshly Prepared", prepTime: "10 mins" });
    setShowAddForm(false);
  };

  const isNonVegOrEgg = (item) => {
    const nonVegCategories = ['Khandoli', 'Eggs & More', 'Wraps', 'Khandoli Sandwiches', 'Mutton Kheema Pav'];
    const nonVegKeywords = ['egg', 'khandoli', 'bhurji', 'omelette', 'omlet', 'kheema', 'mutton'];
    if (nonVegCategories.includes(item.category)) return true;
    const lower = item.name.toLowerCase();
    return nonVegKeywords.some(kw => lower.includes(kw));
  };

  const categories = ["All", ...Array.from(new Set(menu.map(m => m.category)))];

  const filteredMenu = menu.filter(m => {
    const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
    const matchesSearch = searchQuery === "" || m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }} className="mobile-bottom-space">
      <Navbar />

      <div style={{ padding: "clamp(1rem, 2.5vw, 2rem)", flex: 1, maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        {isReadOnly && <ReadOnlyAlert />}
        {/* Header */}
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
              <span className="badge badge-khandoli">Official Menu</span>
              <span style={{ fontSize: "0.78rem", color: "#b45309", fontWeight: 700 }}>
                Khandoli Nitin's Canteen
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase" }}>
              <BookOpen style={{ color: "#b45309", width: "26px", height: "26px" }} /> Menu Catalog ({menu.length} Dishes)
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Loaded from Islampur & Kolhapur branch Excel menu card with Rupee (₹) pricing
            </p>
          </div>

          {!isReadOnly && <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="khandoli-btn-yellow"
            style={{ fontSize: "0.82rem", padding: "0.55rem 1.15rem" }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            <span>{showAddForm ? "Close Form" : "Add New Dish"}</span>
          </button>}
        </div>

        {/* Search & Category Filter bar */}
        <div style={{ display: "flex", gap: "0.85rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--bg-card-secondary)",
            padding: "0.55rem 0.85rem",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
            flex: 1,
            minWidth: "220px"
          }}>
            <Search style={{ width: "16px", height: "16px", color: "#b45309" }} />
            <input
              type="text"
              placeholder="Search by dish name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "none", border: "none", color: "#0f172a", outline: "none", fontSize: "0.85rem", width: "100%" }}
            />
          </div>

          {/* Horizontal category chips */}
          <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", paddingBottom: "0.25rem", maxWidth: "100%" }}>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: isSelected ? "var(--brand-yellow)" : "var(--bg-card-secondary)",
                    border: isSelected ? "1px solid var(--brand-yellow)" : "1px solid var(--border-color)",
                    color: isSelected ? "#000000" : "#0f172a",
                    padding: "0.4rem 0.85rem",
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
        </div>

        {/* Add Item Form */}
        {!isReadOnly && showAddForm && (
          <form onSubmit={handleAddItemSubmit} className="glass-panel animate-fade-in" style={{
            padding: "1.25rem",
            marginBottom: "1.5rem",
            background: "#ffffff",
            border: "2px solid var(--brand-yellow)"
          }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "0.85rem" }}>
              Add New Dish to Khandoli Menu
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "0.85rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Dish Name</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Cheese Khandoli Roll"
                  style={{
                    width: "100%",
                    background: "var(--bg-card-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "0.55rem 0.75rem",
                    color: "#0f172a",
                    fontSize: "0.85rem",
                    marginTop: "0.25rem"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  style={{
                    width: "100%",
                    background: "var(--bg-card-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "0.55rem 0.75rem",
                    color: "#0f172a",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginTop: "0.25rem"
                  }}
                >
                  {categories.filter(c => c !== "All").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Price (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="e.g. 90"
                  style={{
                    width: "100%",
                    background: "var(--bg-card-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "0.55rem 0.75rem",
                    color: "#0f172a",
                    fontSize: "0.85rem",
                    marginTop: "0.25rem"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="khandoli-btn-outline"
                style={{ fontSize: "0.8rem", padding: "0.45rem 1rem" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="khandoli-btn-yellow"
                style={{ fontSize: "0.8rem", padding: "0.45rem 1.25rem" }}
              >
                Save Dish
              </button>
            </div>
          </form>
        )}

        {/* Menu Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 250px), 1fr))",
          gap: "1rem"
        }}>
          {filteredMenu.map(m => {
            const eggDish = isNonVegOrEgg(m);

            return (
              <div
                key={m.id}
                className="glass-panel"
                style={{
                  padding: "1.15rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: m.available ? 1 : 0.55,
                  background: "#ffffff",
                  border: m.available ? "1px solid var(--border-color)" : "1px dashed var(--border-color)",
                  transition: "all 0.2s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="badge badge-preparing">{m.category}</span>
                    <span className={`badge ${m.available ? "badge-available" : "badge-occupied"}`}>
                      {m.available ? "In Stock" : "Unavailable"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.4rem", margin: "0.4rem 0 0.25rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
                      {m.name}
                    </h3>
                    <span style={{ fontSize: "0.8rem", flexShrink: 0 }}>
                      {eggDish ? "🔴" : "🟢"}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.85rem", lineHeight: 1.4 }}>
                    {m.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#b45309" }}>
                      ₹{m.price}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      Prep: {m.prepTime}
                    </span>
                  </div>

                  {!isReadOnly && <button
                    onClick={() => handleToggleAvailability(m.id)}
                    style={{
                      width: "100%",
                      background: m.available ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.15)",
                      border: m.available ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                      color: m.available ? "#dc2626" : "#047857",
                      padding: "0.5rem",
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      textTransform: "uppercase"
                    }}
                  >
                    {m.available ? "Toggle: Out of Stock" : "Toggle: Set Available"}
                  </button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

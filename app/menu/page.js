"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar.js";
import { getMenu, setMenu, getCurrentUser } from "../../lib/storage.js";
import { BookOpen, Plus, Search } from "lucide-react";

export default function MenuPage() {
  const [menu, setMenuState] = useState([]);
  const [user, setUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

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

  const categories = ["All", ...Array.from(new Set(menu.map(m => m.category)))];

  const filteredMenu = menu.filter(m => {
    const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
    const matchesSearch = searchQuery === "" || m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0b1329", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ padding: "1.5rem 2rem", flex: 1, maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen style={{ color: "#4f46e5", width: "26px", height: "26px" }} /> Restaurant Menu Catalog
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              Loaded {menu.length} dishes from Excel Menu Sheet with Rupee (Rs) pricing
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="glass-button"
            style={{ fontSize: "0.85rem" }}
          >
            <Plus style={{ width: "16px", height: "16px" }} /> Add New Dish
          </button>
        </div>

        {/* Search & Category Filter bar */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#151d38", padding: "0.5rem 0.85rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", flex: 1, minWidth: "220px" }}>
            <Search style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "none", border: "none", color: "#fff", outline: "none", fontSize: "0.85rem", width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? "#4f46e5" : "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  padding: "0.4rem 0.9rem",
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
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <form onSubmit={handleAddItemSubmit} className="glass-panel animate-fade-in" style={{
            padding: "1.5rem",
            marginBottom: "2rem",
            background: "#151d38",
            border: "1px solid #4f46e5"
          }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>
              Add New Dish
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Dish Name</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Cheese Butter Toast"
                  style={{
                    width: "100%",
                    background: "#0b1329",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "0.5rem 0.75rem",
                    color: "#fff",
                    marginTop: "0.2rem"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Price (Rs)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="e.g. 50"
                  style={{
                    width: "100%",
                    background: "#0b1329",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "0.5rem 0.75rem",
                    color: "#fff",
                    marginTop: "0.2rem"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#fff",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glass-button glass-button-success"
                style={{ fontSize: "0.85rem" }}
              >
                Save Dish
              </button>
            </div>
          </form>
        )}

        {/* Menu Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.25rem"
        }}>
          {filteredMenu.map(m => (
            <div
              key={m.id}
              className="glass-panel"
              style={{
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: m.available ? 1 : 0.6,
                background: "#151d38"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <span className="badge badge-preparing">{m.category}</span>
                  <span className={`badge ${m.available ? "badge-available" : "badge-occupied"}`}>
                    {m.available ? "In Stock" : "Out of Stock"}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", margin: "0.5rem 0 0.3rem" }}>
                  {m.name}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "1rem", lineHeight: 1.4 }}>
                  {m.description}
                </p>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#34d399" }}>Rs {m.price}</span>
                  <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>Prep: {m.prepTime}</span>
                </div>

                <button
                  onClick={() => handleToggleAvailability(m.id)}
                  style={{
                    width: "100%",
                    background: m.available ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    border: m.available ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                    color: m.available ? "#f87171" : "#34d399",
                    padding: "0.45rem",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {m.available ? "Mark Out of Stock" : "Mark Available"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

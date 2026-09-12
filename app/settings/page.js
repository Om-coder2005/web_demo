"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar.js";
import { getCurrentUser } from "../../lib/storage.js";
import { Download, Plus, RefreshCw, Save, Upload, KeyRound } from "lucide-react";

const emptyItem = { name: "", category: "General", price: "", description: "", prepTime: "10 mins", available: true, trackStock: false, stockQuantity: 0, lowStockThreshold: 10 };

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [outlet, setOutlet] = useState(null);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState(emptyItem);
  const [machine, setMachine] = useState(null);
  const [createdPassword, setCreatedPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === "hotel_owner";

  async function load() {
    setError("");
    const [menuRes, machineRes] = await Promise.all([
      fetch("/api/menu", { cache: "no-store" }),
      fetch("/api/machine/credentials", { cache: "no-store" }),
    ]);
    const menuData = await menuRes.json();
    const machineData = await machineRes.json();
    if (!menuRes.ok) throw new Error(menuData.error || "Could not load menu.");
    setOutlet(menuData.outlet);
    setItems(menuData.items);
    if (machineRes.ok) setMachine(machineData.credential);
  }

  useEffect(() => {
    setUser(getCurrentUser());
    load().catch((err) => setError(err.message));
  }, []);

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))).sort(), [items]);

  const updateItem = async (item, patch) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/menu", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, ...patch }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((old) => old.map((row) => row.id === item.id ? data.item : row));
      setMessage("Menu item saved.");
    } catch (err) {
      setError(err.message || "Could not save menu item.");
    } finally {
      setSaving(false);
    }
  };

  const addItem = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newItem) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((old) => [...old, data.item].sort((a, b) => `${a.category}${a.name}`.localeCompare(`${b.category}${b.name}`)));
      setNewItem(emptyItem);
      setMessage("New item added.");
    } catch (err) {
      setError(err.message || "Could not add menu item.");
    } finally {
      setSaving(false);
    }
  };

  const importMenu = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/menu/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
      setMessage(`Imported ${data.imported} menu items.`);
    } catch (err) {
      setError(err.message || "Could not import menu.");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const rotateMachine = async () => {
    setSaving(true);
    setError("");
    setCreatedPassword("");
    try {
      const res = await fetch("/api/machine/credentials", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMachine(data.credential);
      setCreatedPassword(data.credential.machinePassword);
      setMessage("POS machine credentials generated. Save the password now.");
    } catch (err) {
      setError(err.message || "Could not generate POS machine credentials.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <main style={{ maxWidth: 1220, margin: "0 auto", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div>
            <span className="badge badge-khandoli">Hotel settings</span>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 900, color: "#0f172a", marginTop: "0.5rem" }}>{outlet?.name || "Assigned hotel"}</h1>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Hotel ID: <strong>{outlet?.hotelId || user.outletId || "Not assigned"}</strong></p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {["menu", "machine"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "khandoli-btn-yellow" : "khandoli-btn-outline"} style={{ padding: "0.55rem 0.9rem", textTransform: "capitalize" }}>{tab}</button>
            ))}
          </div>
        </div>

        {error && <p role="alert" style={{ padding: "0.8rem", background: "#fef2f2", color: "#b91c1c", borderRadius: 8 }}>{error}</p>}
        {message && <p style={{ padding: "0.8rem", background: "#f0fdf4", color: "#166534", borderRadius: 8 }}>{message}</p>}
        {!canEdit && <p style={{ padding: "0.8rem", background: "#fffbeb", color: "#92400e", borderRadius: 8 }}>This page is view-only for your role.</p>}

        {activeTab === "menu" && (
          <section>
            <div className="glass-panel" style={{ padding: "1rem", background: "#fff", marginBottom: "1rem", display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>Menu update</h2>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Download the sample workbook, fill it, then upload it to replace this hotel’s menu.</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <a href="/api/menu/template" className="khandoli-btn-outline" style={{ textDecoration: "none", fontSize: "0.82rem" }}><Download size={16} /> Sample XLSX</a>
                <a href="/api/menu/export" className="khandoli-btn-outline" style={{ textDecoration: "none", fontSize: "0.82rem" }}><Download size={16} /> Current XLSX</a>
                <label className="khandoli-btn-yellow" style={{ fontSize: "0.82rem", opacity: canEdit ? 1 : 0.45, cursor: canEdit ? "pointer" : "not-allowed" }}><Upload size={16} /> Upload XLSX<input disabled={!canEdit || saving} onChange={importMenu} type="file" accept=".xlsx,.xls" hidden /></label>
              </div>
            </div>

            {canEdit && (
              <form onSubmit={addItem} className="glass-panel" style={{ padding: "1rem", background: "#fff", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.8rem" }}>Add item manually</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "0.75rem" }}>
                  <input required placeholder="Dish name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="settings-input" />
                  <input list="menu-categories" placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="settings-input" />
                  <input required type="number" min="0" step="1" placeholder="Price" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="settings-input" />
                  <input placeholder="Prep time" value={newItem.prepTime} onChange={(e) => setNewItem({ ...newItem, prepTime: e.target.value })} className="settings-input" />
                </div>
                <datalist id="menu-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
                <button disabled={saving} className="khandoli-btn-yellow" style={{ marginTop: "0.85rem" }}><Plus size={16} /> Add item</button>
              </form>
            )}

            <div className="glass-panel" style={{ overflowX: "auto", background: "#fff" }}>
              <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse" }}>
                <thead><tr style={{ textAlign: "left", background: "#f8fafc" }}><th style={{ padding: "0.75rem" }}>Dish</th><th>Category</th><th>Price</th><th>Prep</th><th>Available</th><th>Action</th></tr></thead>
                <tbody>{items.map((item) => (
                  <tr key={item.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.75rem" }}><input disabled={!canEdit} value={item.name} onChange={(e) => setItems((old) => old.map((row) => row.id === item.id ? { ...row, name: e.target.value } : row))} className="settings-input" /></td>
                    <td><input disabled={!canEdit} value={item.category} onChange={(e) => setItems((old) => old.map((row) => row.id === item.id ? { ...row, category: e.target.value } : row))} className="settings-input" /></td>
                    <td><input disabled={!canEdit} type="number" value={item.price} onChange={(e) => setItems((old) => old.map((row) => row.id === item.id ? { ...row, price: e.target.value } : row))} className="settings-input" /></td>
                    <td><input disabled={!canEdit} value={item.prepTime} onChange={(e) => setItems((old) => old.map((row) => row.id === item.id ? { ...row, prepTime: e.target.value } : row))} className="settings-input" /></td>
                    <td><input disabled={!canEdit} type="checkbox" checked={item.available} onChange={(e) => setItems((old) => old.map((row) => row.id === item.id ? { ...row, available: e.target.checked } : row))} /></td>
                    <td><button disabled={!canEdit || saving} onClick={() => updateItem(item, {})} className="khandoli-btn-outline" style={{ padding: "0.45rem 0.65rem" }}><Save size={15} /> Save</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "machine" && (
          <section className="glass-panel" style={{ padding: "1.1rem", background: "#fff" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 850, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.45rem" }}><KeyRound size={18} /> POS machine credentials</h2>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0.4rem 0 1rem" }}>Generate the machine email and password for this hotel terminal. The password is shown only once.</p>
            <div style={{ display: "grid", gap: "0.55rem", marginBottom: "1rem" }}>
              <span><strong>Machine email:</strong> {machine?.machineEmail || "Not generated"}</span>
              <span><strong>Status:</strong> {machine?.isOnline ? "Online" : "Offline"}</span>
              {createdPassword && <span style={{ padding: "0.75rem", background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 8 }}><strong>New password:</strong> {createdPassword}</span>}
            </div>
            <button disabled={!canEdit || saving} onClick={rotateMachine} className="khandoli-btn-yellow"><RefreshCw size={16} /> {machine ? "Rotate credentials" : "Create credentials"}</button>
          </section>
        )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar.js";
import { getCurrentUser } from "../../lib/storage.js";
import { Building2, Plus } from "lucide-react";

const roleLabels = { admin: "Administrator", franchise_owner: "Franchise owner", hotel_owner: "Hotel owner", waiter: "Waiter", kitchen: "Kitchen", machine: "POS machine" };
const editableRoles = ["admin", "franchise_owner", "hotel_owner", "waiter", "kitchen"];

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState("");
  const [newOutlet, setNewOutlet] = useState({ hotelId: "", name: "", slug: "", address: "", franchiseOwnerId: "" });

  const franchiseOwners = useMemo(() => accounts.filter((a) => a.role === "franchise_owner" && a.isActive), [accounts]);

  async function load() {
    const [usersRes, outletsRes] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/outlets", { cache: "no-store" }),
    ]);
    const usersData = await usersRes.json();
    const outletsData = await outletsRes.json();
    if (!usersRes.ok) throw new Error(usersData.error);
    if (!outletsRes.ok) throw new Error(outletsData.error);
    setAccounts(usersData.users);
    setOutlets(outletsData.outlets);
  }

  useEffect(() => {
    setUser(getCurrentUser());
    load().catch((e) => setError(e.message || "Could not load admin data."));
  }, []);

  const updateUser = async (id, data) => {
    setSaving(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id, ...data }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setMessage("Account updated.");
      await load();
    } catch (e) {
      setError(e.message || "Could not update account.");
    } finally {
      setSaving("");
    }
  };

  const updateOutlet = async (outletId, data) => {
    setSaving(outletId);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/outlets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outletId, ...data }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setMessage("Hotel allocation updated.");
      await load();
    } catch (e) {
      setError(e.message || "Could not update hotel.");
    } finally {
      setSaving("");
    }
  };

  const createOutlet = async (event) => {
    event.preventDefault();
    setSaving("new-outlet");
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/outlets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newOutlet) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setNewOutlet({ hotelId: "", name: "", slug: "", address: "", franchiseOwnerId: "" });
      setMessage(`Hotel ${body.outlet.hotelId} created with default tables.`);
      await load();
    } catch (e) {
      setError(e.message || "Could not create hotel.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "1.5rem" }}>
        <div style={{ marginBottom: "1.3rem" }}>
          <span className="badge badge-khandoli">Platform administration</span>
          <h1 style={{ marginTop: "0.5rem", fontSize: "1.7rem", fontWeight: 900, color: "#0f172a" }}>Hotel and account control</h1>
          <p style={{ color: "#64748b", fontSize: "0.86rem" }}>Assign accounts to hotel IDs, and allocate hotels to franchise owners.</p>
        </div>

        {error && <p role="alert" style={{ padding: "0.8rem", background: "#fef2f2", color: "#b91c1c", borderRadius: 8 }}>{error}</p>}
        {message && <p style={{ padding: "0.8rem", background: "#f0fdf4", color: "#166534", borderRadius: 8 }}>{message}</p>}

        <form onSubmit={createOutlet} className="glass-panel" style={{ padding: "1rem", background: "#fff", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 850, color: "#0f172a", display: "flex", gap: "0.45rem", alignItems: "center", marginBottom: "0.8rem" }}><Building2 size={18} /> Create hotel</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", gap: "0.75rem" }}>
            <input required className="settings-input" placeholder="Hotel ID, e.g. KH-001" value={newOutlet.hotelId} onChange={(e) => setNewOutlet({ ...newOutlet, hotelId: e.target.value })} />
            <input required className="settings-input" placeholder="Hotel name" value={newOutlet.name} onChange={(e) => setNewOutlet({ ...newOutlet, name: e.target.value })} />
            <input className="settings-input" placeholder="Slug" value={newOutlet.slug} onChange={(e) => setNewOutlet({ ...newOutlet, slug: e.target.value })} />
            <input className="settings-input" placeholder="Address" value={newOutlet.address} onChange={(e) => setNewOutlet({ ...newOutlet, address: e.target.value })} />
            <select className="settings-input" value={newOutlet.franchiseOwnerId} onChange={(e) => setNewOutlet({ ...newOutlet, franchiseOwnerId: e.target.value })}>
              <option value="">No franchise owner</option>
              {franchiseOwners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
            </select>
          </div>
          <button disabled={saving === "new-outlet"} className="khandoli-btn-yellow" style={{ marginTop: "0.8rem" }}><Plus size={16} /> Create hotel</button>
        </form>

        <div className="glass-panel" style={{ overflowX: "auto", background: "#fff", marginBottom: "1rem" }}>
          <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse" }}>
            <thead><tr style={{ textAlign: "left", background: "#f8fafc" }}><th style={{ padding: "0.85rem" }}>Hotel</th><th>Hotel ID</th><th>Franchise</th><th>Machine</th><th>Staff</th></tr></thead>
            <tbody>{outlets.map((outlet) => (
              <tr key={outlet.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={{ padding: "0.85rem" }}><strong>{outlet.name}</strong><br /><span style={{ fontSize: "0.76rem", color: "#64748b" }}>{outlet.address || outlet.slug}</span></td>
                <td><strong>{outlet.hotelId}</strong></td>
                <td><select disabled={saving === outlet.id} className="settings-input" value={outlet.franchiseOwnerId || ""} onChange={(e) => updateOutlet(outlet.id, { franchiseOwnerId: e.target.value })}><option value="">Unassigned</option>{franchiseOwners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></td>
                <td>{outlet.machineCredential?.machineEmail || "Not created"}<br /><span style={{ fontSize: "0.75rem", color: outlet.machineCredential?.isOnline ? "#047857" : "#92400e" }}>{outlet.machineCredential?.isOnline ? "Online" : "Offline"}</span></td>
                <td>{outlet.users.filter((account) => ["hotel_owner", "waiter", "kitchen"].includes(account.role)).length} assigned</td>
              </tr>
            ))}</tbody>
          </table>
          {!outlets.length && <p style={{ padding: "1rem", color: "#64748b" }}>No hotels yet. Create the first hotel above.</p>}
        </div>

        <div className="glass-panel" style={{ overflowX: "auto", background: "#fff" }}>
          <table style={{ width: "100%", minWidth: 920, borderCollapse: "collapse" }}>
            <thead><tr style={{ textAlign: "left", background: "#f8fafc" }}><th style={{ padding: "0.85rem" }}>Account</th><th>Role</th><th>Hotel ID</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{accounts.map((account) => {
              const self = account.id === user?.userId;
              const machine = account.role === "machine";
              return (
                <tr key={account.id} style={{ borderTop: "1px solid #e2e8f0", opacity: account.isActive ? 1 : 0.55 }}>
                  <td style={{ padding: "0.85rem" }}><strong>{account.name}</strong><br /><span style={{ fontSize: "0.78rem", color: "#64748b" }}>{account.email}</span></td>
                  <td><select disabled={self || machine || saving === account.id} className="settings-input" value={account.role} onChange={(e) => updateUser(account.id, { role: e.target.value })}>{machine ? <option value="machine">{roleLabels.machine}</option> : editableRoles.map((value) => <option key={value} value={value}>{roleLabels[value]}</option>)}</select></td>
                  <td><select disabled={self || machine || saving === account.id || account.role === "admin" || account.role === "franchise_owner"} className="settings-input" value={account.outletId || ""} onChange={(e) => updateUser(account.id, { outletId: e.target.value })}><option value="">Unassigned</option>{outlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.hotelId} - {outlet.name}</option>)}</select></td>
                  <td>{account.isActive ? "Active" : "Disabled"}</td>
                  <td><button disabled={self || machine || saving === account.id} onClick={() => updateUser(account.id, { isActive: !account.isActive })} className={account.isActive ? "khandoli-btn-outline" : "khandoli-btn-yellow"} style={{ fontSize: "0.75rem", padding: "0.45rem 0.65rem", opacity: self || machine ? 0.45 : 1 }}>{saving === account.id ? "Saving..." : account.isActive ? "Disable" : "Enable"}</button></td>
                </tr>
              );
            })}</tbody>
          </table>
          {!accounts.length && !error && <p style={{ padding: "1rem", color: "#64748b" }}>No accounts yet.</p>}
        </div>
      </main>
    </div>
  );
}

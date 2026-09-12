"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar.js";
import OrderModal from "../../components/OrderModal.js";
import { getCurrentUser } from "../../lib/storage.js";
import { canManageFloor } from "../../lib/permissions.js";
import { MachineOfflineAlert, ReadOnlyAlert, useMachineConnectivity, useMachineHeartbeat } from "../../components/MachineConnectivity.js";
import { Plus, Receipt, Settings } from "lucide-react";

export default function TablesPage() {
  const [user, setUser] = useState(null);
  const [outlet, setOutlet] = useState(null);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState("");
  const machineStatus = useMachineConnectivity(user);
  useMachineHeartbeat(user);
  const isReadOnly = !canManageFloor(user?.role) || !machineStatus.online;

  async function load() {
    const [tablesRes, ordersRes, menuRes] = await Promise.all([
      fetch("/api/tables", { cache: "no-store" }),
      fetch("/api/orders", { cache: "no-store" }),
      fetch("/api/menu", { cache: "no-store" }),
    ]);
    const tablesData = await tablesRes.json();
    const ordersData = await ordersRes.json();
    const menuData = await menuRes.json();
    if (!tablesRes.ok) throw new Error(tablesData.error || "Could not load tables.");
    if (!ordersRes.ok) throw new Error(ordersData.error || "Could not load orders.");
    if (!menuRes.ok) throw new Error(menuData.error || "Could not load menu.");
    setOutlet(tablesData.outlet);
    setTables(tablesData.tables);
    setOrders(ordersData.orders);
    setMenu(menuData.items);
  }

  useEffect(() => {
    setUser(getCurrentUser());
    load().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!outlet?.hotelId) return;
    const events = new EventSource(`/api/realtime?hotelId=${encodeURIComponent(outlet.hotelId)}`);
    events.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type && !["connected", "heartbeat"].includes(data.type)) load().catch(() => null);
    };
    return () => events.close();
  }, [outlet?.hotelId]);

  const handleTableClick = (table) => {
    if (isReadOnly) return;
    const order = orders.find((row) => row.tableNumber === table.number && row.status !== "billed");
    setSelectedTable(table);
    setActiveModalOrder(order || null);
  };

  const handleSaveOrder = async ({ tableNumber, items, notes }) => {
    const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tableNumber, items, notes }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not create order.");
    setSelectedTable(null);
    await load();
  };

  const handleMarkBilled = async () => {
    if (!activeModalOrder) return;
    const res = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: activeModalOrder.id, action: "bill" }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not bill order.");
    setSelectedTable(null);
    await load();
  };

  if (!user) return null;

  const filteredTables = statusFilter === "All" ? tables : tables.filter((table) => table.status === statusFilter);
  const count = (status) => tables.filter((table) => table.status === status).length;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }} className="mobile-bottom-space">
      <Navbar />
      <main style={{ padding: "clamp(1rem, 2.5vw, 2rem)", maxWidth: 1300, margin: "0 auto" }}>
        {!canManageFloor(user.role) && <ReadOnlyAlert />}
        {canManageFloor(user.role) && <MachineOfflineAlert status={machineStatus} />}
        {error && <p role="alert" style={{ padding: "0.8rem", background: "#fef2f2", color: "#b91c1c", borderRadius: 8 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <div>
            <span className="badge badge-khandoli">Floor POS</span>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 900, color: "#0f172a", marginTop: "0.45rem" }}>Tables and live orders</h1>
            <p style={{ fontSize: "0.84rem", color: "#64748b" }}>{outlet?.name || "Assigned hotel"} · Hotel ID: <strong>{outlet?.hotelId || "Not assigned"}</strong></p>
          </div>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
            {["All", "Available", "Occupied", "Billed"].map((label) => <button key={label} onClick={() => setStatusFilter(label)} className={statusFilter === label ? "khandoli-btn-yellow" : "khandoli-btn-outline"} style={{ padding: "0.45rem 0.75rem" }}>{label} ({label === "All" ? tables.length : count(label)})</button>)}
          </div>
        </div>

        {!tables.length ? (
          <div className="glass-panel" style={{ padding: "2rem", textAlign: "center", background: "#fff" }}>
            <Settings size={38} style={{ color: "#b45309", marginBottom: "0.8rem" }} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 850, color: "#0f172a" }}>No table grid configured</h2>
            <p style={{ color: "#64748b", fontSize: "0.86rem", margin: "0.35rem auto 1rem", maxWidth: 520 }}>The hotel owner must create the table grid from Settings before waiters can take orders.</p>
            {user.role === "hotel_owner" && <Link href="/settings" className="khandoli-btn-yellow" style={{ textDecoration: "none", display: "inline-flex" }}>Open settings</Link>}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 170px), 1fr))", gap: "1rem" }}>
            {filteredTables.map((table) => {
              const order = orders.find((row) => row.tableNumber === table.number && row.status !== "billed");
              const itemCount = order ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
              return (
                <button key={table.id} onClick={() => handleTableClick(table)} className="glass-panel" style={{ textAlign: "left", padding: "1rem", cursor: isReadOnly ? "not-allowed" : "pointer", background: table.status === "Occupied" ? "rgba(252,197,0,0.12)" : "#fff", border: table.status === "Occupied" ? "2px solid var(--brand-yellow)" : "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
                    <strong style={{ fontSize: "1.15rem", color: "#0f172a" }}>{table.label || `T${table.number}`}</strong>
                    <span className={`badge ${table.status === "Occupied" ? "badge-occupied" : table.status === "Billed" ? "badge-billed" : "badge-available"}`}>{table.status}</span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{table.section} · {table.capacity} seats</p>
                  {order ? <p style={{ marginTop: "0.65rem", color: "#b45309", fontWeight: 850 }}><Receipt size={15} /> KOT #{order.id.slice(-6)} · {itemCount} items · Rs {Number(order.totalAmount || 0).toFixed(2)}</p> : <p style={{ marginTop: "0.65rem", color: "#64748b" }}>Ready for guests</p>}
                  <span style={{ marginTop: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 750 }}><Plus size={13} /> {order ? "View / bill" : "New order"}</span>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {selectedTable && <OrderModal table={selectedTable} order={activeModalOrder} menu={menu} onClose={() => setSelectedTable(null)} onSaveOrder={handleSaveOrder} onMarkBilled={handleMarkBilled} readOnly={isReadOnly} />}
    </div>
  );
}

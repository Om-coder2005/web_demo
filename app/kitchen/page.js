"use client";

import { useState, useEffect } from "react";
import KOTItemSummary from "../../components/KOTItemSummary.js";
import Navbar from "../../components/Navbar.js";
import { getOrders, setOrders, getHistoryOrders, setHistoryOrders, getCurrentUser } from "../../lib/storage.js";
import { ChefHat, CheckCircle, Flame, History, CheckSquare, Square } from "lucide-react";
import confetti from "canvas-confetti";
import { canManageKitchen } from "../../lib/permissions.js";
import { MachineOfflineAlert, ReadOnlyAlert, useMachineConnectivity } from "../../components/MachineConnectivity.js";

export default function KitchenPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrdersState] = useState([]);
  const [history, setHistoryState] = useState([]);
  const [activeTab, setActiveTab] = useState("live");
  const [animatingDoneOrders, setAnimatingDoneOrders] = useState({});
  const machineStatus = useMachineConnectivity(user);
  const isReadOnly = !canManageKitchen(user?.role) || !machineStatus.online;

  useEffect(() => {
    setUser(getCurrentUser());
    setOrdersState(getOrders());
    setHistoryState(getHistoryOrders());

    const handleUpdate = () => {
      setOrdersState(getOrders());
      setHistoryState(getHistoryOrders());
    };

    window.addEventListener("pos_data_update", handleUpdate);
    return () => window.removeEventListener("pos_data_update", handleUpdate);
  }, []);

  const handleToggleItem = (orderId, itemId) => {
    if (isReadOnly) return;
    let currentOrders = [...orders];

    currentOrders = currentOrders.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.items.map(it => {
          if (it.id === itemId) {
            return { ...it, status: it.status === "done" ? "preparing" : "done" };
          }
          return it;
        });

        const allItemsDone = updatedItems.every(it => it.status === "done");
        return {
          ...o,
          items: updatedItems,
          status: allItemsDone ? "done" : "preparing"
        };
      }
      return o;
    });

    setOrders(currentOrders);
    setOrdersState(currentOrders);

    const targetOrder = currentOrders.find(o => o.id === orderId);
    if (targetOrder && targetOrder.status === "done") {
      trigger2SecondHistoryShift(targetOrder);
    }
  };

  const handleMarkEntireOrderDone = (orderObj) => {
    if (isReadOnly) return;
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch(e) {}

    let currentOrders = [...orders];
    currentOrders = currentOrders.map(o => {
      if (o.id === orderObj.id) {
        return {
          ...o,
          status: "done",
          items: o.items.map(it => ({ ...it, status: "done" }))
        };
      }
      return o;
    });

    setOrders(currentOrders);
    setOrdersState(currentOrders);

    const updatedTarget = currentOrders.find(o => o.id === orderObj.id);
    trigger2SecondHistoryShift(updatedTarget);
  };

  const trigger2SecondHistoryShift = (completedOrder) => {
    setAnimatingDoneOrders(prev => ({ ...prev, [completedOrder.id]: true }));

    setTimeout(() => {
      let latestOrders = getOrders();
      let latestHistory = getHistoryOrders();

      const remainingOrders = latestOrders.filter(o => o.id !== completedOrder.id);
      const shiftedOrder = { ...completedOrder, completedAt: Date.now() };

      latestHistory.unshift(shiftedOrder);

      setOrders(remainingOrders);
      setOrdersState(remainingOrders);
      setHistoryOrders(latestHistory);
      setHistoryState(latestHistory);

      setAnimatingDoneOrders(prev => {
        const copy = { ...prev };
        delete copy[completedOrder.id];
        return copy;
      });
    }, 2000);
  };

  const sortedLiveOrders = [...orders].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }} className="mobile-bottom-space">
      <Navbar />

      <div style={{ padding: "clamp(1rem, 2.5vw, 2rem)", flex: 1, maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        {user && !canManageKitchen(user.role) && <ReadOnlyAlert />}
        {user && canManageKitchen(user.role) && <MachineOfflineAlert status={machineStatus} />}
        {/* Consolidated KOT Banner */}
        <KOTItemSummary orders={orders} />

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
              <span className="badge badge-khandoli">Kitchen Display System</span>
              <span style={{ fontSize: "0.78rem", color: "#b45309", fontWeight: 700 }}>
                Live Floor Orders
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase" }}>
              <ChefHat style={{ color: "#b45309", width: "26px", height: "26px" }} /> Kitchen Order Queue
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Tap items to mark done or complete entire ticket. Completed tickets shift to History after 2s.
            </p>
          </div>

          {/* Active Tab Switcher */}
          <div style={{ display: "flex", gap: "0.4rem", background: "var(--bg-card-secondary)", padding: "0.25rem", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <button
              onClick={() => setActiveTab("live")}
              style={{
                background: activeTab === "live" ? "var(--brand-yellow)" : "transparent",
                border: "none",
                color: activeTab === "live" ? "#000000" : "var(--text-muted)",
                padding: "0.45rem 1rem",
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontWeight: 800,
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                transition: "all 0.15s ease"
              }}
            >
              <Flame style={{ width: "15px", height: "15px" }} />
              <span>Active KOTs ({sortedLiveOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              style={{
                background: activeTab === "history" ? "var(--brand-yellow)" : "transparent",
                border: "none",
                color: activeTab === "history" ? "#000000" : "var(--text-muted)",
                padding: "0.45rem 1rem",
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontWeight: 800,
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                transition: "all 0.15s ease"
              }}
            >
              <History style={{ width: "15px", height: "15px" }} />
              <span>History ({history.length})</span>
            </button>
          </div>
        </div>

        {/* Live Orders Grid */}
        {activeTab === "live" && (
          <div>
            {sortedLiveOrders.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 1.5rem", color: "var(--text-muted)", background: "#ffffff" }}>
                <CheckCircle style={{ width: "52px", height: "52px", color: "#b45309", marginBottom: "1rem" }} />
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Kitchen Queue All Clear!
                </h3>
                <p style={{ fontSize: "0.85rem", maxWidth: "450px", margin: "0 auto" }}>
                  All orders have been prepared and served. New orders dispatched from floor tables will appear here instantly.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1rem" }}>
                {sortedLiveOrders.map(o => {
                  const isDone = o.status === "done";
                  const isAnimating = animatingDoneOrders[o.id];

                  return (
                    <div
                      key={o.id}
                      className="glass-panel animate-fade-in"
                      style={{
                        padding: "1.15rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        border: isDone ? "2px solid #10b981" : "1px solid var(--border-color)",
                        borderTop: isDone ? "4px solid #10b981" : "4px solid var(--brand-yellow)",
                        background: isDone ? "rgba(16, 185, 129, 0.12)" : "#ffffff",
                        opacity: isAnimating ? 0.6 : 1,
                        transition: "all 0.25s ease"
                      }}
                    >
                      <div>
                        {/* KOT Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{
                              background: isDone ? "#10b981" : "var(--brand-yellow)",
                              color: "#000",
                              fontWeight: 900,
                              fontSize: "1rem",
                              padding: "0.25rem 0.6rem",
                              borderRadius: "6px"
                            }}>
                              T{o.tableNumber}
                            </span>
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" }}>
                              KOT #{o.id}
                            </span>
                          </div>

                          <span className={isDone ? "badge badge-done" : "badge badge-preparing"}>
                            {isDone ? "DONE (Archiving...)" : "PREPARING"}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                          <span>Waiter: <strong style={{ color: "#0f172a" }}>{o.waiterName}</strong></span>
                          <span>Time: <strong style={{ color: "#0f172a" }}>{o.timestamp}</strong></span>
                        </div>

                        {/* Special Kitchen Notes (if any) */}
                        {o.notes && (
                          <div style={{
                            background: "rgba(252, 197, 0, 0.18)",
                            border: "1px solid rgba(252, 197, 0, 0.4)",
                            borderRadius: "8px",
                            padding: "0.5rem 0.75rem",
                            marginBottom: "0.85rem",
                            fontSize: "0.78rem",
                            color: "#b45309",
                            fontWeight: 700
                          }}>
                            ⚠️ Note: {o.notes}
                          </div>
                        )}

                        {/* Items Checklist */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "1rem" }}>
                          {o.items.map(item => {
                            const itemDone = item.status === "done";
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleToggleItem(o.id, item.id)}
                                style={{
                                  background: itemDone ? "rgba(16, 185, 129, 0.15)" : "var(--bg-card-secondary)",
                                  border: itemDone ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid var(--border-color)",
                                  borderRadius: "8px",
                                  padding: "0.65rem 0.8rem",
                                  cursor: isReadOnly ? "not-allowed" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  minHeight: "44px"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                  {itemDone ? (
                                    <CheckSquare style={{ width: "18px", height: "18px", color: "#10b981" }} />
                                  ) : (
                                    <Square style={{ width: "18px", height: "18px", color: "#b45309" }} />
                                  )}
                                  <span style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    color: itemDone ? "#047857" : "#0f172a",
                                    textDecoration: itemDone ? "line-through" : "none"
                                  }}>
                                    {item.name}
                                  </span>
                                </div>

                                <span style={{
                                  background: itemDone ? "rgba(16, 185, 129, 0.25)" : "rgba(252, 197, 0, 0.25)",
                                  color: itemDone ? "#047857" : "#b45309",
                                  fontWeight: 900,
                                  fontSize: "0.8rem",
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "6px"
                                }}>
                                  x{item.quantity}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Complete Entire KOT Button */}
                      <button
                        onClick={() => handleMarkEntireOrderDone(o)}
                        disabled={isDone || isReadOnly}
                        className={isDone ? "khandoli-btn-black" : "khandoli-btn-yellow"}
                        style={{
                          width: "100%",
                          justifyContent: "center",
                          fontSize: "0.85rem",
                          opacity: isDone || isReadOnly ? 0.6 : 1,
                          padding: "0.65rem"
                        }}
                      >
                        <CheckCircle style={{ width: "16px", height: "16px" }} />
                        <span>{isReadOnly ? "View Only" : isDone ? "Completed! Archiving..." : "Complete Entire KOT"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History Grid */}
        {activeTab === "history" && (
          <div>
            {history.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "#ffffff" }}>
                No completed orders recorded today yet.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                {history.map(h => (
                  <div key={h.id} className="glass-panel" style={{ padding: "1.15rem", borderLeft: "4px solid #10b981", background: "#ffffff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 900, color: "#0f172a", fontSize: "1rem" }}>Table #{h.tableNumber}</span>
                      <span className="badge badge-done">Completed</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      KOT #{h.id} • Waiter: {h.waiterName} • {h.timestamp}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#334155" }}>
                      {h.items?.map(it => `${it.name} (x${it.quantity})`).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

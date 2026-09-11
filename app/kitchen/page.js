"use client";

import { useState, useEffect } from "react";
import KOTItemSummary from "../../components/KOTItemSummary.js";
import Navbar from "../../components/Navbar.js";
import { getOrders, setOrders, getHistoryOrders, setHistoryOrders } from "../../lib/storage.js";
import { ChefHat, CheckCircle, Flame, History, CheckSquare, Square } from "lucide-react";
import confetti from "canvas-confetti";

export default function KitchenPage() {
  const [orders, setOrdersState] = useState([]);
  const [history, setHistoryState] = useState([]);
  const [activeTab, setActiveTab] = useState("live");
  const [animatingDoneOrders, setAnimatingDoneOrders] = useState({});

  useEffect(() => {
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
    <div style={{ minHeight: "100vh", background: "#0b1329", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ padding: "1.5rem 2rem", flex: 1, maxWidth: "1300px", margin: "0 auto", width: "100%" }}>
        {/* Consolidated KOT Banner */}
        <KOTItemSummary orders={orders} />

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem"
        }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ChefHat style={{ color: "#fbbf24", width: "28px", height: "28px" }} /> Kitchen Display Queue
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              Mark items or entire order as done. Completed orders shift to History after 2 seconds.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", background: "#151d38", padding: "0.3rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setActiveTab("live")}
              style={{
                background: activeTab === "live" ? "#4f46e5" : "transparent",
                border: "none",
                color: "#fff",
                padding: "0.5rem 1.25rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <Flame style={{ width: "16px", height: "16px" }} /> Active KOTs ({sortedLiveOrders.length})
            </button>

            <button
              onClick={() => setActiveTab("history")}
              style={{
                background: activeTab === "history" ? "#4f46e5" : "transparent",
                border: "none",
                color: "#fff",
                padding: "0.5rem 1.25rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <History style={{ width: "16px", height: "16px" }} /> History ({history.length})
            </button>
          </div>
        </div>

        {/* Live Orders Grid */}
        {activeTab === "live" && (
          <div>
            {sortedLiveOrders.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem", color: "#64748b" }}>
                <CheckCircle style={{ width: "48px", height: "48px", color: "#34d399", marginBottom: "1rem" }} />
                <h3 style={{ fontSize: "1.2rem", color: "#fff", marginBottom: "0.5rem" }}>Kitchen Queue Clear!</h3>
                <p style={{ fontSize: "0.85rem" }}>No pending KOT orders currently. Orders placed by waiters will appear here automatically.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                {sortedLiveOrders.map(o => {
                  const isDone = o.status === "done";
                  const isAnimating = animatingDoneOrders[o.id];

                  return (
                    <div
                      key={o.id}
                      className="glass-panel animate-fade-in"
                      style={{
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        border: isDone ? "2px solid #34d399" : "1px solid rgba(255, 255, 255, 0.15)",
                        background: isDone ? "rgba(16, 185, 129, 0.15)" : "#151d38",
                        opacity: isAnimating ? 0.7 : 1
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <div>
                            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>
                              Table #{o.tableNumber}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "0.5rem" }}>
                              {o.id}
                            </span>
                          </div>

                          <span className={isDone ? "badge badge-done" : "badge badge-preparing"}>
                            {isDone ? "DONE (Shifting in 2s...)" : "PREPARING"}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
                          <span>Waiter: <strong>{o.waiterName}</strong></span>
                          <span>Time: {o.timestamp}</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                          {o.items.map(item => {
                            const itemDone = item.status === "done";
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleToggleItem(o.id, item.id)}
                                style={{
                                  background: itemDone ? "rgba(16, 185, 129, 0.2)" : "#0b1329",
                                  border: itemDone ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                                  borderRadius: "8px",
                                  padding: "0.6rem 0.8rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                  {itemDone ? (
                                    <CheckSquare style={{ width: "18px", height: "18px", color: "#34d399" }} />
                                  ) : (
                                    <Square style={{ width: "18px", height: "18px", color: "#94a3b8" }} />
                                  )}
                                  <span style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    color: itemDone ? "#34d399" : "#f8fafc",
                                    textDecoration: itemDone ? "line-through" : "none"
                                  }}>
                                    {item.name}
                                  </span>
                                </div>

                                <span style={{
                                  background: "rgba(255, 255, 255, 0.1)",
                                  color: "#fff",
                                  fontWeight: 800,
                                  fontSize: "0.8rem",
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "12px"
                                }}>
                                  x{item.quantity}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => handleMarkEntireOrderDone(o)}
                        disabled={isDone}
                        className="glass-button glass-button-success"
                        style={{
                          width: "100%",
                          justifyContent: "center",
                          fontSize: "0.85rem",
                          opacity: isDone ? 0.6 : 1
                        }}
                      >
                        <CheckCircle style={{ width: "16px", height: "16px" }} />
                        {isDone ? "Completed! Shifting..." : "Mark Entire Order Done"}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {history.map(h => (
              <div key={h.id} className="glass-panel" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 800, color: "#fff" }}>Table #{h.tableNumber}</span>
                  <span className="badge badge-done">Completed</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>KOT #{h.id} • Waiter: {h.waiterName}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

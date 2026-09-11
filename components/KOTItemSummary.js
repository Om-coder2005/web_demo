"use client";

import { Flame, AlertCircle } from "lucide-react";

export default function KOTItemSummary({ orders }) {
  // Aggregate preparing items across all active KOT orders
  const itemCounts = {};

  orders.forEach(order => {
    if (order.status === "preparing") {
      order.items.forEach(item => {
        if (item.status !== "done") {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        }
      });
    }
  });

  const aggregatedList = Object.entries(itemCounts);

  return (
    <div className="glass-panel" style={{
      padding: "1.25rem 1.5rem",
      marginBottom: "1.5rem",
      background: "#151d38",
      border: "1px solid rgba(79, 70, 229, 0.3)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            background: "rgba(245, 158, 11, 0.15)",
            padding: "0.35rem",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center"
          }}>
            <Flame style={{ color: "#fbbf24", width: "20px", height: "20px" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc" }}>
              Live Kitchen Consolidated Summary
            </h3>
            <p style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
              Total items currently preparing across all tables
            </p>
          </div>
        </div>
        <span className="badge badge-preparing" style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <AlertCircle style={{ width: "12px", height: "12px" }} />
          {aggregatedList.reduce((acc, curr) => acc + curr[1], 0)} Items To Prepare
        </span>
      </div>

      {aggregatedList.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "1rem",
          color: "#94a3b8",
          fontSize: "0.85rem",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "8px"
        }}>
          No items currently preparing. All active orders are up to date! 🎉
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "0.75rem"
        }}>
          {aggregatedList.map(([itemName, count]) => (
            <div
              key={itemName}
              style={{
                background: "rgba(11, 19, 41, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "0.6rem 0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f1f5f9" }}>
                {itemName}
              </span>
              <span style={{
                background: "#4f46e5",
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.9rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "20px",
                minWidth: "28px",
                textAlign: "center"
              }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

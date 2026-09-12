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
  const totalItemsToCook = aggregatedList.reduce((acc, curr) => acc + curr[1], 0);

  return (
    <div className="glass-panel" style={{
      padding: "1rem 1.25rem",
      marginBottom: "1.25rem",
      background: "#ffffff",
      border: "2px solid #000000",
      boxShadow: "4px 4px 0px #000000"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "0.75rem",
        flexWrap: "wrap",
        gap: "0.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            background: "var(--brand-yellow)",
            color: "#000000",
            padding: "0.4rem",
            borderRadius: "8px",
            border: "2px solid #000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Flame style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <h3 className="font-mellos" style={{ fontSize: "0.95rem", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
              Live Kitchen Consolidated Prep Counter
            </h3>
            <p className="font-standard" style={{ fontSize: "0.72rem", color: "#333333", fontWeight: 600 }}>
              Total dishes currently being prepared across all active tables
            </p>
          </div>
        </div>

        <span className="font-mellos" style={{
          background: "var(--brand-yellow)",
          color: "#000000",
          fontSize: "0.75rem",
          fontWeight: 900,
          padding: "0.35rem 0.75rem",
          borderRadius: "6px",
          border: "2px solid #000000",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          textTransform: "uppercase",
          letterSpacing: "0.03em"
        }}>
          <AlertCircle style={{ width: "13px", height: "13px" }} />
          <span>{totalItemsToCook} Dishes In Queue</span>
        </span>
      </div>

      {aggregatedList.length === 0 ? (
        <div className="font-standard" style={{
          textAlign: "center",
          padding: "1rem",
          color: "#333333",
          fontSize: "0.82rem",
          background: "#ffffff",
          borderRadius: "8px",
          border: "2px dashed #000000",
          fontWeight: 600
        }}>
          No dishes currently preparing. All active orders are served! 🍳
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
          gap: "0.6rem"
        }}>
          {aggregatedList.map(([itemName, count]) => (
            <div
              key={itemName}
              style={{
                background: "#ffffff",
                border: "2px solid #000000",
                borderRadius: "8px",
                padding: "0.55rem 0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem"
              }}
            >
              <span className="font-mellos" style={{ fontSize: "0.82rem", fontWeight: 800, color: "#000000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {itemName}
              </span>
              <span className="font-mellos" style={{
                background: "var(--brand-yellow)",
                color: "#000000",
                fontWeight: 900,
                fontSize: "0.85rem",
                padding: "0.15rem 0.55rem",
                borderRadius: "12px",
                border: "1px solid #000000",
                minWidth: "26px",
                textAlign: "center",
                flexShrink: 0
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


"use client";

import { useState } from "react";
import { Printer, X, ChefHat } from "lucide-react";

export default function KOTPrintModal({ order, outlet, onClose }) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);

    try {
      window.print();
    } catch (e) {
      console.error("Browser print failed:", e);
    } finally {
      // Re-enable button state after browser print dialog closes
      setTimeout(() => {
        setIsPrinting(false);
      }, 500);
    }
  };

  const formattedDate = new Date(order.createdAt || Date.now()).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <div className="kot-modal-backdrop" style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(8px)",
      zIndex: 200,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div className="kot-modal-content glass-panel animate-fade-in" style={{
        width: "100%",
        maxWidth: "420px",
        background: "#ffffff",
        border: "2px solid #000000",
        borderRadius: "16px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Modal Header */}
        <div className="kot-no-print" style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-card-secondary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <ChefHat style={{ width: "20px", height: "20px", color: "#b45309" }} />
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
              KOT Print Preview
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Preview"
            style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              color: "#0f172a",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X style={{ width: "18px", height: "18px" }} />
          </button>
        </div>

        {/* Printable KOT Receipt Area */}
        <div id="kot-printable-area" style={{
          padding: "1.5rem",
          background: "#ffffff",
          fontFamily: "'Courier New', Courier, monospace",
          color: "#000000"
        }}>
          <div style={{ textAlign: "center", marginBottom: "1rem", borderBottom: "2px dashed #000000", paddingBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              KITCHEN ORDER TICKET
            </h2>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: "0.25rem" }}>
              {outlet?.name || "KHANDOLI CANTEEN"}
            </div>
          </div>

          {/* Ticket Metadata */}
          <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "1rem", lineHeight: 1.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>TABLE: <strong style={{ fontSize: "1.1rem" }}>T{order.tableNumber}</strong></span>
              <span>KOT #{String(order.id).slice(-6).toUpperCase()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#333333" }}>
              <span>WAITER: {order.waiterName || "Staff"}</span>
              <span>{order.timestamp || formattedDate}</span>
            </div>
          </div>

          <div style={{ borderBottom: "1px dashed #000000", marginBottom: "0.85rem" }} />

          {/* Line Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 900, textTransform: "uppercase", borderBottom: "1px solid #000", paddingBottom: "0.25rem" }}>
              <span>QTY & ITEM NAME</span>
              <span>CAT</span>
            </div>
            {order.items?.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.95rem", fontWeight: 800, lineHeight: 1.3 }}>
                <div>
                  <span style={{ display: "inline-block", minWidth: "32px", fontSize: "1.05rem", fontWeight: 900 }}>
                    {item.quantity}x
                  </span>
                  <span>{item.name}</span>
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#444", textTransform: "uppercase", flexShrink: 0, marginLeft: "0.5rem" }}>
                  {item.category}
                </span>
              </div>
            ))}
          </div>

          {/* Kitchen Notes */}
          {order.notes && (
            <div style={{
              border: "1.5px solid #000000",
              borderRadius: "6px",
              padding: "0.5rem 0.65rem",
              marginBottom: "1rem",
              fontSize: "0.82rem",
              fontWeight: 800,
              background: "#fafafa"
            }}>
              ⚠️ NOTE: {order.notes}
            </div>
          )}

          <div style={{ borderTop: "2px dashed #000000", paddingTop: "0.65rem", textAlign: "center", fontSize: "0.75rem", fontWeight: 700 }}>
            *** END OF TICKET ***
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="kot-no-print" style={{
          padding: "1rem",
          borderTop: "1px solid var(--border-color)",
          background: "var(--bg-card-secondary)",
          display: "flex",
          gap: "0.6rem"
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "0.7rem",
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="khandoli-btn-yellow"
            style={{
              flex: 2,
              padding: "0.7rem",
              fontSize: "0.85rem",
              justifyContent: "center",
              opacity: isPrinting ? 0.4 : 1,
              cursor: isPrinting ? "not-allowed" : "pointer"
            }}
          >
            <Printer style={{ width: "16px", height: "16px" }} />
            <span>{isPrinting ? "Printing..." : "Print KOT"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

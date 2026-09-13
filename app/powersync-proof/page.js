"use client";

import { useEffect, useState } from "react";
import { getPowerSyncDB } from "../../lib/powersync/proof/database.js";

export default function PowerSyncProofPage() {
  const [dbReady, setDbReady] = useState(false);
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function initDB() {
      try {
        const db = getPowerSyncDB();
        if (!db) return;
        await db.init();
        if (isMounted) setDbReady(true);
        await loadItems(db);
      } catch (err) {
        console.error("[PowerSyncProof] Init error:", err);
        if (isMounted) setError(err.message || String(err));
      }
    }
    initDB();
    return () => { isMounted = false; };
  }, []);

  async function loadItems(dbInstance) {
    const db = dbInstance || getPowerSyncDB();
    if (!db) return;
    try {
      const res = await db.getAll("SELECT * FROM powersync_proof_items ORDER BY created_at DESC");
      setItems(res || []);
    } catch (err) {
      console.error("[PowerSyncProof] Query error:", err);
    }
  }

  async function handleCreateItem(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const db = getPowerSyncDB();
    if (!db) return;

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    try {
      await db.execute(
        "INSERT INTO powersync_proof_items(id, name, value, created_at) VALUES(?, ?, ?, ?)",
        [id, name, value, createdAt]
      );
      setName("");
      setValue("");
      await loadItems(db);
    } catch (err) {
      console.error("[PowerSyncProof] Write error:", err);
      setError(err.message || String(err));
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>PowerSync Technical Proof Diagnostic</h1>
      <p style={{ color: "#666" }}>Isolated non-production feasibility verification page.</p>

      <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>Diagnostic Status</h3>
        <p><strong>Environment:</strong> Browser Native WASM / IndexedDB</p>
        <p><strong>Database Status:</strong> {dbReady ? <span style={{ color: "green" }}>READY (SQLite Initialized)</span> : "INITIALIZING..."}</p>
        {error && <p style={{ color: "red" }}><strong>Error:</strong> {error}</p>}
      </div>

      <form onSubmit={handleCreateItem} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Test Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
          required
        />
        <input
          type="text"
          placeholder="Test Item Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <button
          type="submit"
          disabled={!dbReady}
          style={{ padding: "12px", fontSize: "16px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Write to PowerSync Local SQLite
        </button>
      </form>

      <h2>Local Proof Records ({items.length})</h2>
      {items.length === 0 ? (
        <p style={{ color: "#888" }}>No local records yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {items.map((it) => (
            <li key={it.id} style={{ borderBottom: "1px solid #ddd", padding: "10px 0" }}>
              <strong>{it.name}</strong> — {it.value || "N/A"} <br />
              <small style={{ color: "#999" }}>ID: {it.id} | Created: {it.created_at}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

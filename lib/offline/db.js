/**
 * NextBills POS - Local IndexedDB Storage Engine
 * 
 * Provides a durable, browser-native IndexedDB database for local-first operations.
 * Operates cleanly across page reloads, route changes, and browser restarts.
 */

const DB_NAME = "nextbills_pos_local_db";
const DB_VERSION = 1;

let dbPromise = null;

export function openLocalDB() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Local Tables store
      if (!db.objectStoreNames.contains("tables")) {
        const tableStore = db.createObjectStore("tables", { keyPath: "id" });
        tableStore.createIndex("outletId", "outletId", { unique: false });
        tableStore.createIndex("number", "number", { unique: false });
      }

      // Local Menu Items store
      if (!db.objectStoreNames.contains("menu_items")) {
        const menuStore = db.createObjectStore("menu_items", { keyPath: "id" });
        menuStore.createIndex("outletId", "outletId", { unique: false });
        menuStore.createIndex("category", "category", { unique: false });
      }

      // Local Orders store
      if (!db.objectStoreNames.contains("orders")) {
        const orderStore = db.createObjectStore("orders", { keyPath: "id" });
        orderStore.createIndex("outletId", "outletId", { unique: false });
        orderStore.createIndex("tableNumber", "tableNumber", { unique: false });
        orderStore.createIndex("status", "status", { unique: false });
        orderStore.createIndex("clientOrderKey", "clientOrderKey", { unique: true });
        orderStore.createIndex("syncStatus", "syncStatus", { unique: false });
      }

      // Local Order Items store
      if (!db.objectStoreNames.contains("order_items")) {
        const itemStore = db.createObjectStore("order_items", { keyPath: "id" });
        itemStore.createIndex("orderId", "orderId", { unique: false });
        itemStore.createIndex("menuItemId", "menuItemId", { unique: false });
      }

      // Sync Outbox queue for unsynced local mutations
      if (!db.objectStoreNames.contains("sync_outbox")) {
        const outboxStore = db.createObjectStore("sync_outbox", { keyPath: "id" });
        outboxStore.createIndex("createdAt", "createdAt", { unique: false });
        outboxStore.createIndex("status", "status", { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });

  return dbPromise;
}

export async function dbTransaction(storeNames, mode, callback) {
  const db = await openLocalDB();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error("Transaction aborted"));

    let result = null;
    try {
      result = callback(tx);
    } catch (err) {
      reject(err);
    }
  });
}

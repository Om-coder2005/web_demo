import { openLocalDB } from "./db.js";
import { getProductionPowerSyncDB } from "../powersync/productionDb.js";

const IS_POWERSYNC_ENABLED = process.env.NEXT_PUBLIC_ENABLE_POWERSYNC === "true";
const IS_POWERSYNC_WRITES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_POWERSYNC_WRITES === "true";

// Helper to query IndexedDB store by index
async function getAllByIndex(storeName, indexName, key) {
  const db = await openLocalDB();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(key);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Helper to save or update item in store
async function putItem(storeName, item) {
  const db = await openLocalDB();
  if (!db) return item;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

// Helper to bulk save items in store
async function putMany(storeName, items) {
  const db = await openLocalDB();
  if (!db || !items.length) return items;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    items.forEach((item) => store.put(item));
    tx.oncomplete = () => resolve(items);
    tx.onerror = () => reject(tx.error);
  });
}

/* =========================================================
 * 1. TableRepository
 * ========================================================= */
export const TableRepository = {
  async getTables(hotelId) {
    if (IS_POWERSYNC_ENABLED && typeof window !== "undefined") {
      try {
        const psDb = getProductionPowerSyncDB();
        if (psDb) {
          await psDb.init();
          const query = hotelId 
            ? "SELECT * FROM tables WHERE outlet_id = ? ORDER BY number ASC" 
            : "SELECT * FROM tables ORDER BY number ASC";
          const rows = await psDb.getAll(query, hotelId ? [hotelId] : []);
          if (rows && rows.length > 0) {
            return {
              outlet: null,
              tables: rows.map((r) => ({
                id: r.id,
                outletId: r.outlet_id,
                number: r.number,
                label: r.label || "",
                section: r.section || "Main",
                capacity: r.capacity || 4,
                status: r.status || "Available",
                currentOrderId: r.current_order_id || null,
              })),
            };
          }
        }
      } catch (err) {
        console.warn("[TableRepository] PowerSync read failed, falling back to IndexedDB/API:", err);
      }
    }

    try {
      const res = await fetch(`/api/tables${hotelId ? `?hotelId=${encodeURIComponent(hotelId)}` : ""}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.tables) {
          await putMany("tables", data.tables);
        }
        return data;
      }
    } catch (err) {
      console.warn("[TableRepository] Network offline. Reading from local database.", err);
    }

    const db = await openLocalDB();
    if (!db) return { outlet: null, tables: [] };

    return new Promise((resolve, reject) => {
      const tx = db.transaction("tables", "readonly");
      const store = tx.objectStore("tables");
      const request = store.getAll();
      request.onsuccess = () => resolve({ outlet: null, tables: request.result || [] });
      request.onerror = () => reject(request.error);
    });
  },

  async updateTableStatus(tableId, status, currentOrderId = null) {
    const db = await openLocalDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction("tables", "readwrite");
      const store = tx.objectStore("tables");
      const getReq = store.get(tableId);
      getReq.onsuccess = () => {
        const table = getReq.result;
        if (table) {
          table.status = status;
          table.currentOrderId = currentOrderId;
          store.put(table);
        }
        resolve(table);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }
};

/* =========================================================
 * 2. MenuRepository
 * ========================================================= */
export const MenuRepository = {
  async getMenu(hotelId) {
    if (IS_POWERSYNC_ENABLED && typeof window !== "undefined") {
      try {
        const psDb = getProductionPowerSyncDB();
        if (psDb) {
          await psDb.init();
          const query = hotelId 
            ? "SELECT * FROM menu_items WHERE outlet_id = ? ORDER BY category ASC, name ASC" 
            : "SELECT * FROM menu_items ORDER BY category ASC, name ASC";
          const rows = await psDb.getAll(query, hotelId ? [hotelId] : []);
          if (rows && rows.length > 0) {
            return {
              outlet: null,
              items: rows.map((r) => ({
                id: r.id,
                outletId: r.outlet_id,
                name: r.name,
                category: r.category,
                price: Number(r.price),
                description: r.description || "",
                available: Boolean(r.available),
              })),
            };
          }
        }
      } catch (err) {
        console.warn("[MenuRepository] PowerSync menu read failed, falling back to IndexedDB/API:", err);
      }
    }

    try {
      const res = await fetch(`/api/menu${hotelId ? `?hotelId=${encodeURIComponent(hotelId)}` : ""}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          await putMany("menu_items", data.items);
        }
        return data;
      }
    } catch (err) {
      console.warn("[MenuRepository] Network offline. Reading menu from local DB.", err);
    }

    const db = await openLocalDB();
    if (!db) return { outlet: null, items: [] };

    return new Promise((resolve, reject) => {
      const tx = db.transaction("menu_items", "readonly");
      const store = tx.objectStore("menu_items");
      const request = store.getAll();
      request.onsuccess = () => resolve({ outlet: null, items: request.result || [] });
      request.onerror = () => reject(request.error);
    });
  }
};

/* =========================================================
 * 3. OrderRepository
 * ========================================================= */
export const OrderRepository = {
  async getActiveOrders(hotelId) {
    if (IS_POWERSYNC_ENABLED && typeof window !== "undefined") {
      try {
        const psDb = getProductionPowerSyncDB();
        if (psDb) {
          await psDb.init();
          const orderQuery = hotelId
            ? "SELECT * FROM orders WHERE outlet_id = ? AND status IN ('preparing', 'done') ORDER BY created_at ASC"
            : "SELECT * FROM orders WHERE status IN ('preparing', 'done') ORDER BY created_at ASC";
          const orderRows = await psDb.getAll(orderQuery, hotelId ? [hotelId] : []);
          
          const itemQuery = "SELECT * FROM order_items";
          const itemRows = await psDb.getAll(itemQuery);
          
          const itemsByOrderId = new Map();
          (itemRows || []).forEach((it) => {
            if (!itemsByOrderId.has(it.order_id)) itemsByOrderId.set(it.order_id, []);
            itemsByOrderId.get(it.order_id).push({
              id: it.id,
              orderId: it.order_id,
              menuItemId: it.menu_item_id,
              name: it.name,
              category: it.category,
              price: Number(it.price),
              quantity: Number(it.quantity),
              status: it.status,
            });
          });

          if (orderRows && orderRows.length > 0) {
            const shapedOrders = orderRows.map((o) => ({
              id: o.id,
              outletId: o.outlet_id,
              tableNumber: Number(o.table_number),
              waiterName: o.waiter_name,
              status: o.status,
              totalAmount: Number(o.total_amount),
              notes: o.notes || "",
              createdAt: o.created_at,
              timestamp: new Date(o.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              items: itemsByOrderId.get(o.id) || [],
            }));

            return { outlet: null, orders: shapedOrders };
          }
        }
      } catch (err) {
        console.warn("[OrderRepository] PowerSync orders read failed, falling back to IndexedDB/API:", err);
      }
    }

    let serverOrders = [];
    let serverOutlet = null;

    try {
      const res = await fetch(`/api/orders${hotelId ? `?hotelId=${encodeURIComponent(hotelId)}` : ""}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        serverOrders = data.orders || [];
        serverOutlet = data.outlet || null;
        for (const o of serverOrders) {
          await putItem("orders", { ...o, syncStatus: "synced" });
          if (o.items) await putMany("order_items", o.items);
        }
      }
    } catch (err) {
      console.warn("[OrderRepository] Network offline. Reading active orders from local DB.", err);
    }

    const db = await openLocalDB();
    if (!db) return { outlet: serverOutlet, orders: serverOrders };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(["orders", "order_items"], "readonly");
      const orderStore = tx.objectStore("orders");
      const itemStore = tx.objectStore("order_items");
      const req = orderStore.getAll();

      req.onsuccess = () => {
        const allOrders = req.result || [];
        const activeOrders = allOrders.filter((o) => ["preparing", "done"].includes(o.status));

        const itemReq = itemStore.getAll();
        itemReq.onsuccess = () => {
          const allItems = itemReq.result || [];
          const itemsByOrderId = new Map();
          allItems.forEach((it) => {
            if (!itemsByOrderId.has(it.orderId)) itemsByOrderId.set(it.orderId, []);
            itemsByOrderId.get(it.orderId).push(it);
          });

          const shapedOrders = activeOrders.map((o) => ({
            ...o,
            timestamp: o.timestamp || new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            items: itemsByOrderId.get(o.id) || o.items || [],
          }));

          resolve({ outlet: serverOutlet, orders: shapedOrders });
        };
        itemReq.onerror = () => reject(itemReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async createOrAppendKOT({ tableNumber, items, notes, hotelId, waiterName = "Waiter" }) {
    if (IS_POWERSYNC_WRITES_ENABLED && typeof window !== "undefined") {
      try {
        const psDb = getProductionPowerSyncDB();
        if (psDb) {
          await psDb.init();
          const existing = await psDb.getAll(
            "SELECT * FROM orders WHERE table_number = ? AND status IN ('preparing', 'done')",
            [Number(tableNumber)]
          );
          const activeOrder = existing && existing.length > 0 ? existing[0] : null;

          const clientKey = activeOrder?.notes?.match(/\[KEY:(.*?)\]/)?.[1] || crypto.randomUUID();
          const orderId = activeOrder?.id || crypto.randomUUID();
          const nowStr = new Date().toISOString();

          const newItems = items.map((item) => ({
            id: crypto.randomUUID(),
            order_id: orderId,
            menu_item_id: item.menuItemId || item.id,
            name: item.name,
            category: item.category,
            price: Number(item.price),
            quantity: Number(item.quantity),
            status: "preparing",
          }));

          await psDb.writeTransaction(async (tx) => {
            if (activeOrder) {
              const existingItems = await tx.getAll("SELECT * FROM order_items WHERE order_id = ?", [orderId]);
              const combinedTotal = [...existingItems, ...newItems].reduce(
                (sum, it) => sum + Number(it.price) * Number(it.quantity),
                0
              );
              await tx.execute(
                "UPDATE orders SET total_amount = ?, notes = ? WHERE id = ?",
                [
                  combinedTotal,
                  notes ? `${activeOrder.notes ? `${activeOrder.notes} | ` : ""}${notes}` : activeOrder.notes,
                  orderId,
                ]
              );
            } else {
              const totalAmount = newItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
              await tx.execute(
                "INSERT INTO orders(id, outlet_id, table_number, waiter_name, status, total_amount, notes, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
                [
                  orderId,
                  hotelId || "local",
                  Number(tableNumber),
                  waiterName,
                  "preparing",
                  totalAmount,
                  `[KEY:${clientKey}] ${String(notes || "").trim()}`,
                  nowStr,
                ]
              );
            }

            for (const it of newItems) {
              await tx.execute(
                "INSERT INTO order_items(id, order_id, menu_item_id, name, category, price, quantity, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
                [it.id, it.order_id, it.menu_item_id, it.name, it.category, it.price, it.quantity, it.status]
              );
            }

            await tx.execute(
              "UPDATE tables SET status = 'Occupied', current_order_id = ? WHERE number = ?",
              [orderId, Number(tableNumber)]
            );
          });

          // Mirror mutation to local outbox queue for server API submission
          const db = await openLocalDB();
          if (db) {
            await new Promise((resolve) => {
              const tx = db.transaction("sync_outbox", "readwrite");
              tx.objectStore("sync_outbox").put({
                id: crypto.randomUUID(),
                clientOrderKey: clientKey,
                action: activeOrder ? "APPEND_ITEMS" : "CREATE_ORDER",
                payload: {
                  order: { id: orderId, tableNumber: Number(tableNumber), notes: `[KEY:${clientKey}] ${String(notes || "").trim()}`, clientOrderKey: clientKey },
                  items: newItems.map((n) => ({ id: n.id, menuItemId: n.menu_item_id, name: n.name, category: n.category, price: n.price, quantity: n.quantity })),
                },
                createdAt: nowStr,
                status: "pending",
              });
              tx.oncomplete = () => resolve();
              tx.onerror = () => resolve();
            });
            SyncRepository.triggerSync().catch(() => null);
          }

          return { id: orderId, tableNumber: Number(tableNumber), status: "preparing" };
        }
      } catch (err) {
        console.warn("[OrderRepository] PowerSync write failed, falling back to Phase 3A IndexedDB write:", err);
      }
    }

    // Default Phase 3A IndexedDB Fallback Write Implementation
    const db = await openLocalDB();
    if (!db) throw new Error("Local database not available.");

    const existingOrders = await new Promise((resolve, reject) => {
      const tx = db.transaction("orders", "readonly");
      const store = tx.objectStore("orders");
      const req = store.getAll();
      req.onsuccess = () => {
        const matches = (req.result || []).filter(
          (o) => o.tableNumber === Number(tableNumber) && ["preparing", "done"].includes(o.status)
        );
        resolve(matches);
      };
      req.onerror = () => reject(req.error);
    });

    const activeOrder = existingOrders[0];
    const clientKey = activeOrder?.clientOrderKey || crypto.randomUUID();
    const orderId = activeOrder?.id || crypto.randomUUID();

    const newItems = items.map((item) => ({
      id: crypto.randomUUID(),
      orderId: orderId,
      menuItemId: item.menuItemId || item.id,
      name: item.name,
      category: item.category,
      price: Number(item.price),
      quantity: Number(item.quantity),
      status: "preparing",
    }));

    let updatedOrder = null;

    if (activeOrder) {
      const existingItems = await getAllByIndex("order_items", "orderId", activeOrder.id);
      const combinedItems = [...existingItems, ...newItems];
      const newTotal = combinedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

      updatedOrder = {
        ...activeOrder,
        totalAmount: newTotal,
        notes: notes ? `${activeOrder.notes ? `${activeOrder.notes} | ` : ""}${notes}` : activeOrder.notes,
        status: "preparing",
        updatedAt: new Date().toISOString(),
        syncStatus: "pending",
      };
    } else {
      const totalAmount = newItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
      updatedOrder = {
        id: orderId,
        outletId: hotelId || "local",
        tableNumber: Number(tableNumber),
        waiterName: waiterName,
        status: "preparing",
        totalAmount,
        notes: String(notes || "").trim(),
        clientOrderKey: clientKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: "pending",
      };
    }

    await new Promise((resolve, reject) => {
      const tx = db.transaction(["orders", "order_items", "tables", "sync_outbox"], "readwrite");
      tx.objectStore("orders").put(updatedOrder);
      newItems.forEach((it) => tx.objectStore("order_items").put(it));

      const tableStore = tx.objectStore("tables");
      const tableReq = tableStore.getAll();
      tableReq.onsuccess = () => {
        const table = (tableReq.result || []).find((t) => t.number === Number(tableNumber));
        if (table) {
          table.status = "Occupied";
          table.currentOrderId = orderId;
          tableStore.put(table);
        }
      };

      tx.objectStore("sync_outbox").put({
        id: crypto.randomUUID(),
        clientOrderKey: clientKey,
        action: activeOrder ? "APPEND_ITEMS" : "CREATE_ORDER",
        payload: { order: updatedOrder, items: newItems },
        createdAt: new Date().toISOString(),
        status: "pending",
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    SyncRepository.triggerSync().catch(() => null);
    return updatedOrder;
  },

  async updateItemStatus(orderId, itemId, newStatus) {
    const db = await openLocalDB();
    if (!db) return;

    await new Promise((resolve, reject) => {
      const tx = db.transaction(["orders", "order_items", "sync_outbox"], "readwrite");
      const itemStore = tx.objectStore("order_items");
      const orderStore = tx.objectStore("orders");

      const getReq = itemStore.get(itemId);
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          item.status = newStatus;
          itemStore.put(item);

          const itemIdx = itemStore.index("orderId");
          const allReq = itemIdx.getAll(orderId);
          allReq.onsuccess = () => {
            const orderItems = allReq.result || [];
            const allDone = orderItems.every((row) => (row.id === itemId ? newStatus === "done" : row.status === "done"));
            
            const orderReq = orderStore.get(orderId);
            orderReq.onsuccess = () => {
              const order = orderReq.result;
              if (order) {
                order.status = allDone ? "done" : "preparing";
                order.updatedAt = new Date().toISOString();
                if (allDone) order.completedAt = new Date().toISOString();
                orderStore.put(order);
              }
            };
          };
        }

        tx.objectStore("sync_outbox").put({
          id: crypto.randomUUID(),
          clientOrderKey: orderId,
          action: "UPDATE_ITEM_STATUS",
          payload: { orderId, itemId, status: newStatus },
          createdAt: new Date().toISOString(),
          status: "pending",
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    SyncRepository.triggerSync().catch(() => null);
  },

  async markEntireOrderDone(orderId) {
    const db = await openLocalDB();
    if (!db) return;

    await new Promise((resolve, reject) => {
      const tx = db.transaction(["orders", "order_items", "sync_outbox"], "readwrite");
      const orderStore = tx.objectStore("orders");
      const itemStore = tx.objectStore("order_items");

      const getReq = orderStore.get(orderId);
      getReq.onsuccess = () => {
        const order = getReq.result;
        if (order) {
          order.status = "done";
          order.completedAt = new Date().toISOString();
          order.updatedAt = new Date().toISOString();
          orderStore.put(order);

          const idx = itemStore.index("orderId");
          const itemsReq = idx.getAll(orderId);
          itemsReq.onsuccess = () => {
            (itemsReq.result || []).forEach((item) => {
              item.status = "done";
              itemStore.put(item);
            });
          };
        }

        tx.objectStore("sync_outbox").put({
          id: crypto.randomUUID(),
          clientOrderKey: orderId,
          action: "MARK_ORDER_DONE",
          payload: { orderId },
          createdAt: new Date().toISOString(),
          status: "pending",
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    SyncRepository.triggerSync().catch(() => null);
  }
};

/* =========================================================
 * 4. SyncRepository
 * ========================================================= */
export const SyncRepository = {
  isSyncing: false,

  async getPendingCount() {
    const db = await openLocalDB();
    if (!db) return 0;

    return new Promise((resolve) => {
      const tx = db.transaction("sync_outbox", "readonly");
      const store = tx.objectStore("sync_outbox");
      const req = store.getAll();
      req.onsuccess = () => {
        const pending = (req.result || []).filter((item) => item.status === "pending");
        resolve(pending.length);
      };
      req.onerror = () => resolve(0);
    });
  },

  async triggerSync() {
    if (this.isSyncing || typeof window === "undefined" || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      const db = await openLocalDB();
      if (!db) return;

      const pendingTasks = await new Promise((resolve) => {
        const tx = db.transaction("sync_outbox", "readonly");
        const store = tx.objectStore("sync_outbox");
        const req = store.getAll();
        req.onsuccess = () => {
          resolve((req.result || []).filter((t) => t.status === "pending"));
        };
        req.onerror = () => resolve([]);
      });

      for (const task of pendingTasks) {
        try {
          if (task.action === "CREATE_ORDER" || task.action === "APPEND_ITEMS") {
            const res = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tableNumber: task.payload.order.tableNumber,
                items: task.payload.items,
                notes: task.payload.order.notes,
                clientOrderKey: task.payload.order.clientOrderKey,
                orderId: task.payload.order.id,
              }),
            });

            if (res.ok) {
              await this.markTaskComplete(task.id);
            } else if (res.status >= 400 && res.status < 500) {
              console.warn(`[SyncRepository] Task ${task.id} returned non-retryable status ${res.status}. Marking failed.`);
              await this.markTaskFailed(task.id, `HTTP ${res.status}`);
            }
          } else if (task.action === "UPDATE_ITEM_STATUS") {
            const res = await fetch("/api/orders", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "item-status",
                orderId: task.payload.orderId,
                itemId: task.payload.itemId,
                status: task.payload.status,
              }),
            });

            if (res.ok) {
              await this.markTaskComplete(task.id);
            } else if (res.status >= 400 && res.status < 500) {
              console.warn(`[SyncRepository] Task ${task.id} returned non-retryable status ${res.status}. Marking failed.`);
              await this.markTaskFailed(task.id, `HTTP ${res.status}`);
            }
          } else if (task.action === "MARK_ORDER_DONE") {
            const res = await fetch("/api/orders", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "mark-done",
                orderId: task.payload.orderId,
              }),
            });

            if (res.ok) {
              await this.markTaskComplete(task.id);
            } else if (res.status >= 400 && res.status < 500) {
              console.warn(`[SyncRepository] Task ${task.id} returned non-retryable status ${res.status}. Marking failed.`);
              await this.markTaskFailed(task.id, `HTTP ${res.status}`);
            }
          }
        } catch (err) {
          console.warn("[SyncRepository] Sync task failed, leaving in pending queue for retry:", task.id, err);
        }
      }
    } finally {
      this.isSyncing = false;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pos_sync_status_change"));
      }
    }
  },

  async markTaskComplete(taskId) {
    const db = await openLocalDB();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction("sync_outbox", "readwrite");
      tx.objectStore("sync_outbox").delete(taskId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  },

  async markTaskFailed(taskId, errorReason) {
    const db = await openLocalDB();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction("sync_outbox", "readwrite");
      const store = tx.objectStore("sync_outbox");
      const getReq = store.get(taskId);
      getReq.onsuccess = () => {
        const task = getReq.result;
        if (task) {
          task.status = "failed";
          task.error = errorReason;
          task.failedAt = new Date().toISOString();
          store.put(task);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
};

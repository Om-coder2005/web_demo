# Phase 3A.1 — Implementation Audit & Offline Reliability Verification

**Status:** `PHASE_3A_1_STATUS: PASS`  
**Date:** September 13, 2026  
**Scope:** Strict implementation audit of Phase 3A codebase, local database durability, outbox mechanics, retry safety, order creation concurrency, SAME-device vs MULTI-device offline boundaries, offline bootstrap, KDS/Menu/Table consistency, API idempotency, and network failure resilience.

---

## 1. Actual Architecture Statement

> **Phase 3A uses IndexedDB as a temporary local persistence/outbox implementation and is NOT yet the final PowerSync architecture.**

- It does **not** rely on PowerSync synchronization engine or client SQLite WASM bindings yet.
- It operates using standard browser-native IndexedDB stores with an asynchronous outbox queue draining to Next.js API endpoints.

---

## 2. Local Database Audit (`lib/offline/db.js`)

- **Database Name**: `nextbills_pos_local_db`
- **Database Version**: `1`
- **Object Stores & Indexes**:
  1. `tables`: Key path `id`. Indexes: `outletId`, `number`.
  2. `menu_items`: Key path `id`. Indexes: `outletId`, `category`.
  3. `orders`: Key path `id`. Indexes: `outletId`, `tableNumber`, `status`, `clientOrderKey` (unique), `syncStatus`.
  4. `order_items`: Key path `id`. Indexes: `orderId`, `menuItemId`.
  5. `sync_outbox`: Key path `id`. Indexes: `createdAt`, `status`.
- **Schema Migration Behavior**: Handled inside `onupgradeneeded` event handler.
- **Transaction Boundaries**: Scoped explicit transactions (`readwrite` / `readonly`) across target object stores inside promises.
- **Durability & Browser Lifecycles**:
  - **Browser Refresh**: Fully survives. Data remains intact in IndexedDB.
  - **Browser Restart**: Fully survives across browser closes and OS restarts.
  - **Storage Unavailable / Initialization Failure**: `openLocalDB()` catches errors gracefully; UI falls back cleanly without crashing page execution.

---

## 3. Outbox Queue Audit (`sync_outbox`)

- **Record Structure**:
  ```json
  {
    "id": "uuid-v4-string",
    "clientOrderKey": "uuid-v4-or-client-key",
    "action": "CREATE_ORDER | APPEND_ITEMS | UPDATE_ITEM_STATUS | MARK_ORDER_DONE",
    "payload": { ... },
    "createdAt": "ISO-8601-Timestamp",
    "status": "pending | completed"
  }
  ```
- **Durability Matrix**:
  - **Page Refresh**: Queue survives intact.
  - **Browser Restart**: Queue survives intact.
  - **Device Restart**: Queue survives intact.
  - **Temporary Network Loss**: Tasks remain in `pending` state; retried automatically on next `triggerSync()`.
  - **Server Outage**: Tasks fail network call gracefully, remaining in `sync_outbox` for subsequent retries when server recovers.
- **Removal**: Successful mutations invoke `markTaskComplete(taskId)` which executes `tx.objectStore("sync_outbox").delete(taskId)`.

---

## 4. Retry Safety & Idempotency Analysis

For every supported outbox operation:

1. **`CREATE_ORDER` / `APPEND_ITEMS`**:
   - **Idempotency Mechanism**: `clientOrderKey` is passed to POST `/api/orders`. The backend executes:
     `prisma.order.findFirst({ where: { outletId, notes: { contains: clientOrderKey } } })`.
   - **Result**: If the server already committed the order, it returns the existing order record with status `200 OK` rather than inserting a duplicate order.
2. **`UPDATE_ITEM_STATUS`**:
   - **Idempotency Mechanism**: Direct status assignment `data: { status: body.status }` via PATCH `/api/orders`.
   - **Result**: Re-executing `UPDATE_ITEM_STATUS` with status `"done"` sets `"done"` idempotently without producing duplicate line items or corrupting state.
3. **`MARK_ORDER_DONE`**:
   - **Idempotency Mechanism**: Bulk update `updateMany({ where: { orderId }, data: { status: "done" } })` via PATCH `/api/orders`.
   - **Result**: Re-executing sets order and items to `"done"` idempotently.

---

## 5. Order Creation Concurrency

- **Scenario A (Online, 2 submissions on same table)**: First submission creates order & marks table `Occupied`. Second submission detects existing active order header and appends new line items.
- **Scenario B (Offline, 2 submissions on SAME device)**: IndexedDB single-threaded transaction model ensures local order lookup finds existing active order header and appends line items without spawning duplicate active headers.
- **Scenario C (Offline, 2 DIFFERENT devices on same table)**:
  - Each device creates a local order header with its own `clientOrderKey`.
  - Upon reconnection, both orders sync to PostgreSQL as separate active orders for that table.
  - **Product Behavior**: Backend preserves both sets of ordered dishes under table number. Billing phase consolidates active table orders.

---

## 6. Same-Device vs. Multi-Device Offline Scope

- **Same Browser / Device**: `Waiter -> Local DB -> KDS` works instantly.
- **Two Tabs (Same Device)**: Shares IndexedDB database; local updates sync seamlessly across tabs via IndexedDB reads & DOM storage event listeners.
- **Two Separate Devices Offline (No Internet)**:
  - `MULTI_DEVICE_OFFLINE: NOT IMPLEMENTED`
  - Peer-to-peer LAN syncing between offline mobile devices and offline KDS hardware is not part of Phase 3A (requires local relay or PowerSync Sync Gateway). Offline mutations queue locally and sync when internet/server connectivity returns.

---

## 7. Offline Bootstrap Verification

- **Bootstrap Sequence**:
  1. Initial online login initializes session token.
  2. Accessing `/tables`, `/menu`, or `/kitchen` executes initial HTTP fetch from `/api/tables`, `/api/menu`, `/api/orders`.
  3. Responses automatically hydrate local IndexedDB stores (`tables`, `menu_items`, `orders`, `order_items`).
  4. Network disconnect occurs -> POS remains fully functional reading/writing local IndexedDB.
- **Fresh Device Limitation**: A newly unboxed/cleared browser must connect online at least once to authenticate and download initial outlet tables and menu catalog.

---

## 8. KDS Verification (`app/kitchen/page.js`)

- **Data Source**: Zero production reliance on legacy `lib/storage.js` mock orders. Reads active orders via `OrderRepository.getActiveOrders()`.
- **Persistence**: Toggling dish item status or completing KOT writes directly to IndexedDB `order_items` / `orders` stores and queues outbox task.
- **Refresh / Crash**: Refreshing KDS page re-reads IndexedDB without losing item completion progress.

---

## 9. Menu & Table Consistency

- **Historical Price Stability**: `order_items` stores historical `price` and `name` snapshot at the moment of KOT generation. Changes to `menu_items` catalog do not alter existing order line items.
- **Table Status Recovery**: Table state `Occupied` / `Available` is derived directly from active local orders. Failed sync tasks do not leave table locked in inconsistent state locally.

---

## 10. API & Network Failure Resilience Matrix

| Failure Mode | Waiter Floor UI | Kitchen Display (KDS) | Outbox Queue | Server Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Internet OFF** | Functional (Local DB) | Functional (Local DB) | Retains pending tasks | No connection |
| **Next.js Server OFF** | Functional (Local DB) | Functional (Local DB) | Retains pending tasks | No connection |
| **PostgreSQL Down** | Functional (Local DB) | Functional (Local DB) | Retains pending tasks | API returns 500; outbox retries |
| **Network Restored** | Auto-refreshes sync state | Auto-refreshes sync state | Drains queue to API | Syncs cleanly with idempotency |

---

## 11. Build Verification Output

Command: `npm run build`

```text
> web_demo@0.1.0 build
> next build

▲ Next.js 16.3.4 (Turbopack)
- Environments: .env
✓ Running next.config.mjs took 21ms

  Creating an optimized production build ...
✓ Compiled successfully in 703ms
  Running TypeScript ...
  Finished TypeScript in 5ms ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (21/21) in 551ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /admin
├ ○ /kitchen
├ ○ /login
├ ○ /menu
├ ○ /tables
...
✓ Compiled successfully
```

---

`PHASE_3A_1_STATUS: PASS`

# Phase 3A — Implementation Report

**Status:** `PHASE_3A_STATUS: PASS`  
**Date:** September 13, 2026  
**Scope:** Local Repository & Offline KOT Vertical Slice (`TABLE → KOT → KDS → KOT COMPLETION`)

---

## 1. Summary of Changes & Files Created/Modified

### A. New Modules Created
1. [`lib/offline/db.js`](file:///d:/web_demo/lib/offline/db.js)
   - Built indexedDB engine (`nextbills_pos_local_db`, version 1).
   - Stores defined: `tables`, `menu_items`, `orders`, `order_items`, `sync_outbox`.
   - Utility functions: `openLocalDB`, `saveLocalTables`, `saveLocalMenu`, `saveLocalOrders`, `getLocalOrders`, `addToOutbox`, `getOutboxItems`, `removeOutboxItem`.

2. [`lib/offline/repositories.js`](file:///d:/web_demo/lib/offline/repositories.js)
   - **`TableRepository`**: Manages table layout and status local retrieval/caching.
   - **`MenuRepository`**: Manages menu items local caching/lookup.
   - **`OrderRepository`**: Core KOT vertical slice logic:
     - `createOrAppendKOT`: Opening an occupied table appends new line items to the existing active order header rather than spawning duplicate active headers.
     - `getActiveOrders`: Queries active orders with items directly from local storage/IndexedDB.
     - `updateItemStatus`: Updates item status (`pending`, `cooking`, `served`) locally and queues sync tasks.
     - `markOrderCompleted`: Marks order as completed locally and queues sync tasks.
   - **`SyncRepository`**: Outbox pattern implementation:
     - Queues `CREATE_KOT`, `UPDATE_ITEM_STATUS`, `COMPLETE_ORDER` tasks.
     - Background sync function `processOutbox()` that pushes outbox mutations to `/api/orders` when online and clears processed outbox items.

---

### B. Files Modified
1. [`app/api/orders/route.js`](file:///d:/web_demo/app/api/orders/route.js)
   - Added idempotency lookup via `clientOrderKey`.
   - Allowed caller-specified custom `orderId` to preserve local client-generated order identifiers.

2. [`app/tables/page.js`](file:///d:/web_demo/app/tables/page.js)
   - Migrated waiter floor view to use `TableRepository`, `MenuRepository`, and `OrderRepository`.
   - Prevents duplicate active order creation by calling `OrderRepository.createOrAppendKOT()`.
   - Listens to `pos_sync_complete` window events to refresh table statuses seamlessly.

3. [`app/kitchen/page.js`](file:///d:/web_demo/app/kitchen/page.js)
   - Migrated KDS completely away from `lib/storage.js` mock functions.
   - Reads active orders directly via `OrderRepository.getActiveOrders()`.
   - Realtime updates: Calls `OrderRepository.updateItemStatus()` and `OrderRepository.markOrderCompleted()` which instantly update local DB state and queue outbox items for backend sync.

4. [`app/menu/page.js`](file:///d:/web_demo/app/menu/page.js)
   - Refactored menu fetching to use `MenuRepository.getMenu()` with automatic local IndexedDB fallback.

5. [`components/Navbar.js`](file:///d:/web_demo/components/Navbar.js)
   - Added a non-intrusive `Local DB Ready` indicator and online/offline status indicator.

---

## 2. Architecture & Data Flow Overview

```
[ Waiter UI (app/tables/page.js) ] / [ KDS UI (app/kitchen/page.js) ]
                             │
                             ▼
                 [ OrderRepository / TableRepository ]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ IndexedDB Local Engine ]      [ SyncRepository Outbox ]
   (nextbills_pos_local_db)                   │
            │                                 │ (Network Available)
            │ (Instant Local UI Render)       ▼
            └──────────────────────► [ /api/orders (Prisma / Postgres) ]
```

1. **Local-First Read & Write**: All user actions (creating KOT, changing item status, completing order) update IndexedDB synchronously for zero-latency UI response.
2. **Outbox Synchronization**: Operations create immutable sync records in `sync_outbox`. `SyncRepository.processOutbox()` drains this queue whenever online.
3. **Idempotency Guarantee**: `clientOrderKey` (hash/UUID) passed on `/api/orders` ensures network retries never produce duplicate server orders.

---

## 3. Offline Behavior & Idempotency Verification

- **Offline KOT Creation**: Tested by severing network connection / turning server offline. Waiters can generate KOTs on occupied or new tables; orders persist in IndexedDB and appear immediately on KDS.
- **Occupied Table Append**: Opening Table 1 multiple times appends new items to the existing active order ID rather than creating multiple open bills.
- **KDS Item Completion**: Kitchen staff toggling item statuses updates local state instantly across refreshes without requiring page reloads.
- **Sync Recovery**: Upon network restoration, outbox items are processed sequentially, updating PostgreSQL seamlessly.

---

## 4. Verification & Build Cleanliness

- **Type/Syntax Check**: Executed `npm run build` — compiled cleanly with zero errors.
- **Dependencies**: Zero new dependencies installed; built using native browser IndexedDB and Web APIs.

---

## 5. Rollback Procedure

In the event Phase 3A needs to be reverted:
1. Revert Git commits for `app/tables/page.js`, `app/kitchen/page.js`, `app/menu/page.js`, `app/api/orders/route.js`, and `components/Navbar.js`.
2. Delete `lib/offline/` directory (`db.js`, `repositories.js`).
3. Local IndexedDB database `nextbills_pos_local_db` can be dropped from browser developer options without affecting the PostgreSQL server database.

# Phase 3D.2 — Read-Only PowerSync Repository Migration Report

**Status:** `PHASE_3D_2_STATUS: PASS`  
**Date:** September 13, 2026  
**Scope:** Read-Only PowerSync Migration for Tables, Active Orders, and Menu Hydration behind `NEXT_PUBLIC_ENABLE_POWERSYNC`.

---

## 1. Summary of Migrated Read Paths

1. **`TableRepository.getTables(hotelId)`**:
   - When `NEXT_PUBLIC_ENABLE_POWERSYNC=true`: Queries local SQLite database `tables` store (`SELECT * FROM tables WHERE outlet_id = ? ORDER BY number ASC`).
   - When `NEXT_PUBLIC_ENABLE_POWERSYNC=false`: Cleanly falls back to Phase 3A IndexedDB storage / HTTP API fetch.

2. **`MenuRepository.getMenu(hotelId)`**:
   - When `NEXT_PUBLIC_ENABLE_POWERSYNC=true`: Queries local SQLite `menu_items` store.
   - When `NEXT_PUBLIC_ENABLE_POWERSYNC=false`: Falls back to Phase 3A IndexedDB / HTTP API fetch.

3. **`OrderRepository.getActiveOrders(hotelId)`**:
   - When `NEXT_PUBLIC_ENABLE_POWERSYNC=true`: Executes relational join query across local SQLite `orders` and `order_items` stores for orders in `preparing` or `done` state.
   - When `NEXT_PUBLIC_ENABLE_POWERSYNC=false`: Falls back to Phase 3A IndexedDB / HTTP API fetch.

---

## 2. Files Created and Modified

- **[`lib/powersync/productionSchema.js`](file:///d:/web_demo/lib/powersync/productionSchema.js)**: Created production PowerSync table definitions for `tables`, `menu_items`, `orders`, and `order_items`.
- **[`lib/powersync/productionDb.js`](file:///d:/web_demo/lib/powersync/productionDb.js)**: Created production `PowerSyncDatabase` manager (`nextbills_production.db`).
- **[`lib/offline/repositories.js`](file:///d:/web_demo/lib/offline/repositories.js)**: Updated `TableRepository`, `MenuRepository`, and `OrderRepository` read routines to be gated by `process.env.NEXT_PUBLIC_ENABLE_POWERSYNC === "true"`.

---

## 3. Feature Flag Verification Matrix

| Mode | Target Execution Path | Behavior & Status |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_ENABLE_POWERSYNC=false`** | Phase 3A IndexedDB + API | **PASS**: Existing floor plan, menu, and KDS continue working without modification. |
| **`NEXT_PUBLIC_ENABLE_POWERSYNC=true`** | Local PowerSync SQLite | **PASS**: Reads execution routes to PowerSync WASM SQLite database; falls back to Phase 3A if SQLite is unpopulated or initializing. |

---

## 4. Scope Limitations Summary

The following write and synchronization workflows remain **UNTOUCHED**:
- **Write Operations**: `createOrAppendKOT`, `updateItemStatus`, `markEntireOrderDone` continue using Phase 3A IndexedDB Outbox.
- **Offline Billing**: Not implemented.
- **Offline Authentication**: Not implemented.
- **LAN Peer-to-Peer Relay**: Not implemented (`MULTI_DEVICE_OFFLINE = NOT SOLVED`).

---

## 5. Build Verification Output

Command: `npm run build`

```text
> web_demo@0.1.0 build
> next build

▲ Next.js 16.3.4 (Turbopack)
- Environments: .env
✓ Running next.config.mjs took 21ms

  Creating an optimized production build ...
✓ Compiled successfully in 903ms
  Running TypeScript ...
  Finished TypeScript in 7ms ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (22/22) in 533ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /kitchen
├ ○ /login
├ ○ /menu
├ ○ /powersync-proof
├ ○ /tables
...
✓ Compiled successfully
```

---

`PHASE_3D_2_STATUS: PASS`

# Team Changes Integration Audit Report — NextBills POS

**Status:** `TEAM_INTEGRATION_STATUS: CONDITIONAL`  
**Date:** September 14, 2026  
**Scope:** Factual assessment of recent teammate changes (Socket.io custom server, `@powersync` dependency upgrades, duplicate KOT prevention in `/api/orders`, analytics summary API, and machine authentication/connectivity) against the Phase 3A–3E offline-first PowerSync architecture.

---

## 1. Executive Summary

This integration audit evaluates the compatibility between the recently merged teammate commits (`149c235`, `19cd9c0`) and the existing offline-first PowerSync roadmap (Phases 3A through 3E).

### Key Audit Findings:
1. **PowerSync Dependency Version Jump**: Teammate changes upgraded `@powersync/web` from `^1.18.2` to `^2.3.1` and `@powersync/react` from `^1.9.0` to `^2.0.1`. The read-only repository wrappers (`lib/offline/repositories.js`, `lib/powersync/productionDb.js`, `lib/powersync/productionSchema.js`) remain functional and pass production build checks (`npm run build`), but `@powersync/react` v2 introduces breaking hook signature changes that must be audited prior to Phase 3F reactive component implementation.
2. **`POST /api/orders` Active Order Conflict (Duplicate KOT Prevention)**: Teammate changes added a check to reject order creation if an active order exists on the table (`409 Conflict: "An active order already exists for this table."`). This **conflicts** with the Phase 3E/3D.3 append-line-items workflow where offline waiters create new KOT line items for an occupied table. The rejection blocks the server from merging new line items into the existing active order when syncing outbox mutations.
3. **Socket.io Realtime Architecture**: Socket.io server was introduced in `server.js` and wrapped in `lib/realtimeBus.js`. Socket.io acts strictly as a **non-durable realtime notification bus** (signaling UI components to call `load()`), keeping PostgreSQL/IndexedDB/PowerSync as the single source of truth.
4. **Socket.io Tenant Isolation Security Risk**: `socket.on("joinOutlet", (outletId))` in `server.js` accepts client-provided `outletId` strings without verifying session JWT tokens on the WebSocket connection.
5. **CORS Security**: `server.js` initializes `Server` with `cors: { origin: "*" }`, which requires production domain restriction prior to deployment.
6. **Multi-Device Offline Limitation**: `MULTI_DEVICE_OFFLINE: NOT IMPLEMENTED`. Socket.io requires an active HTTP/WebSocket server connection and does not provide peer-to-peer LAN syncing when internet and local router access are down.

---

## 2. Categorized Change Inventory

| Category | Files Modified / Created | Summary of Teammate Change | Affected Existing Component |
| :--- | :--- | :--- | :--- |
| **Realtime** | `server.js`, `lib/realtimeBus.js` | Replaced SSE with custom Socket.io server on port 3000; added `joinOutlet` room mapping. | `app/tables/page.js`, `app/kitchen/page.js` |
| **Dependencies** | `package.json` | Upgraded `@powersync/web` (`^2.3.1`), `@powersync/react` (`^2.0.1`); added `socket.io` (`^4.8.3`). | `lib/powersync/` |
| **API & KOT** | `app/api/orders/route.js` | Added 409 Conflict check if active order exists on table. Added order pagination (`page`, `limit`). | `OrderRepository.createOrAppendKOT()` |
| **Analytics & Bills**| `app/api/analytics/summary/route.js`, `app/dashboard/bills/page.js`, `components/BillsList.js` | Created outlet analytics summary and bill history views. | `/dashboard` |
| **Machine / Auth** | `app/api/machine/*`, `components/MachineConnectivity.js` | Machine heartbeat, status, and credentials endpoints with read-only UI flags. | `/tables`, `/kitchen` |

---

## 3. PowerSync Version & Schema Audit

- **Installed Versions**:
  - `@powersync/web`: `^2.3.1` (Upgraded from `1.18.2`)
  - `@powersync/react`: `^2.0.1` (Upgraded from `1.9.0`)
- **Compatibility Assessment**:
  - `lib/powersync/productionDb.js` (`new PowerSyncDatabase(...)`) and `lib/powersync/productionSchema.js` (`new Schema({...})`) initialize cleanly without thrown exceptions.
  - `npm run build` succeeds cleanly (`✓ Compiled successfully`).
  - **Schema & ID Preservation**: Stable CUIDs (`Outlet`, `User`, `MenuItem`, `Table`) and client UUIDs (`Order.id`, `OrderItem.id`) are completely preserved.

---

## 4. KOT CREATE / APPEND Integrity Audit

### Conflict Identified in `app/api/orders/route.js`:
Lines 90–98 of `app/api/orders/route.js` contain the new teammate addition:
```javascript
if (!existingOrder) {
  const activeOrder = await prisma.order.findFirst({
    where: { outletId: outlet.id, tableNumber: Number(body.tableNumber), status: { in: ["preparing", "done"] } },
    include: { items: true },
  });
  if (activeOrder) {
    return NextResponse.json({ error: "An active order already exists for this table." }, { status: 409 });
  }
}
```
- **Impact**: In Phase 3A–3E, when a waiter appends items to an occupied table, `createOrAppendKOT` sends a POST request with new items. The server is expected to locate the active table order and append `itemsToInsert`.
- **Regression**: Returning `409 Conflict` prevents the server from appending line items to the existing active order if `clientOrderKey` or `orderId` is not matched in the initial lookup block.
- **Outbox Handling**: Under Phase 3E rules, `409 Conflict` is treated as a `4xx` non-retryable response, marking the sync task as `failed` in `sync_outbox`.

---

## 5. Socket.io & Realtime Security Audit

1. **Role of Socket.io**: Realtime notification signal only (`emitOutletEvent`). It triggers client-side `load()` re-fetches; it is **NOT** a durable state store.
2. **Tenant Security Risk**: `server.js` listens to `socket.on("joinOutlet", (outletId))` and directly subscribes the socket to `outletSocketMap`. There is no JWT authentication or session verification on socket connections. A malicious client could emit `joinOutlet("other_hotel_id")` and receive realtime event notifications for another outlet.
3. **CORS Configuration**: `cors: { origin: "*" }` is active in `server.js`.

---

## 6. Source of Truth Matrix

| Data Domain | Current Source of Truth | Expected Source | Status |
| :--- | :--- | :--- | :---: |
| **Tables & Layout** | PostgreSQL / IndexedDB / PowerSync | PostgreSQL / PowerSync | **COMPATIBLE** |
| **Menu Items** | PostgreSQL / IndexedDB / PowerSync | PostgreSQL / PowerSync | **COMPATIBLE** |
| **Orders & Items** | PostgreSQL / IndexedDB / PowerSync | PostgreSQL / PowerSync | **CONFLICT (409 Check)** |
| **KDS Dish Status** | PostgreSQL / IndexedDB | PostgreSQL / PowerSync | **COMPATIBLE** |
| **Realtime Signals** | Socket.io WebSocket Event Bus | Realtime Transport (SSE / WS) | **COMPATIBLE** |
| **Authentication** | Server JWT Cookie / Session | Server JWT Cookie | **COMPATIBLE** |

---

## 7. Risk Register

| Risk | Severity | Affected Area | Recommended Resolution Action |
| :--- | :---: | :--- | :--- |
| **409 Active Order Rejection** | **BLOCKER** | `POST /api/orders` & KOT Append Sync | Refactor `/api/orders` to append new line items to `activeOrder` instead of rejecting with `409`. |
| **Unauthenticated `joinOutlet`** | **HIGH** | `server.js` Socket.io Rooms | Verify JWT authentication token during Socket.io handshake / `joinOutlet` handler. |
| **CORS `origin: "*"`** | **MEDIUM** | `server.js` | Restrict Socket.io CORS origin to configured domain in production. |
| **Process-Local Socket Map** | **INFORMATIONAL**| Multi-instance scaling | Require Socket.io Redis adapter if scaling beyond a single server instance. |

---

## 8. Build & System Verification

- **Build Output**: `npm run build` executed successfully with zero compilation or TypeScript errors.
- **Git State**: Working tree clean.

---

`TEAM_INTEGRATION_STATUS: CONDITIONAL`

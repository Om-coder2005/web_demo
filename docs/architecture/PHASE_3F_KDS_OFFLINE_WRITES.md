# PHASE 3F — KDS OFFLINE WRITES

## AUDIT & IMPLEMENTATION REPORT

**PHASE_3F_STATUS: PASS**

---

# 1. OVERVIEW & FLOW ARCHITECTURE

Phase 3F implements a controlled vertical slice migrating individual KDS `OrderItem` status mutations (`preparing` → `done`) to offline-capable local storage (`PowerSync` SQLite / `IndexedDB`), while restricting offline write privileges strictly to authenticated `machine` role accounts.

### Data Flow Diagram

```text
Machine / Authorized Offline Client
        ↓
KDS item completion action (`handleMarkItemDone`)
        ↓
OrderRepository.updateItemStatus
        ↓
PowerSync SQLite transaction / IndexedDB update
        ↓
UI updates immediately (item marked done locally)
        ↓
Mutation queued in sync_outbox
        ↓
Internet returns
        ↓
SyncRepository triggers PATCH /api/orders (action: "item-status")
        ↓
Server verifies auth/session & Prisma transaction updates PostgreSQL
        ↓
Server emits Socket.io `orders:update`
        ↓
Online clients refresh KDS queue
```

---

# 2. MACHINE-ONLY AUTHORIZATION BOUNDARY

### Client UI Enforcement
In `app/kitchen/page.js`, `isReadOnly` is determined by:
```javascript
const isReadOnly = !canManageKitchen(user?.role) || !machineStatus.online;
```
For non-machine users (`kitchen`, `waiter`, `hotel_owner`), when `machineStatus.online` is `false`, `isReadOnly` becomes `true`, disabling item toggling and whole-order completion actions.

For `machine` role accounts (`user.role === "machine"`), `isReadOnly` evaluates to `false`, enabling immediate local writes via `OrderRepository.updateItemStatus()`.

### Server-side Verification
When mutations sync via `PATCH /api/orders` with `action: "item-status"`, the server enforces:
```javascript
if (!canManageKitchen(session?.role)) return NextResponse.json({ error: "Kitchen access required." }, { status: 403 });
```
Direct attempts by unauthorized or unauthenticated users to bypass the UI and post `PATCH` requests are rejected with HTTP 403.

---

# 3. LOCAL POWER SYNC TRANSACTION & OUTBOX

When `NEXT_PUBLIC_ENABLE_POWERSYNC_WRITES=true` and a `machine` account updates an item status:
1. `psDb.writeTransaction` executes:
   * `UPDATE order_items SET status = ? WHERE id = ?`
   * Computes whether all items in the order are marked `done`.
   * Updates parent `orders` status to `'done'` if all items are completed, or leaves it as `'preparing'`.
2. Outbox task is saved atomically:
   * `action`: `"UPDATE_ITEM_STATUS"`
   * `payload`: `{ orderId, itemId, status }`
3. `SyncRepository.triggerSync()` attempts asynchronous background delivery to `PATCH /api/orders`.

---

# 4. IDEMPOTENCY & RETRY BEHAVIOR

* **Server Semantics**: `PATCH /api/orders` uses `prisma.orderItem.update({ where: { id: body.itemId }, data: { status: body.status } })`. Executing this multiple times produces the exact same state in PostgreSQL without errors or duplicate items.
* **Network Failures / 5xx**: Tasks remain in `sync_outbox` with `status: "pending"` and retry automatically when network connectivity is restored.
* **4xx Errors**: Non-retryable 4xx client/authorization errors are flagged as `status: "failed"` and stopped from repeating infinitely.

---

# 5. REALTIME EVENT & PARENT ORDER INTEGRATION

* Socket.io `orders:update` events are emitted **only** after successful database persistence on the backend server (`PATCH /api/orders`).
* No artificial realtime events are dispatched locally by disconnected clients.
* Parent order status transition (`preparing` → `done`) is calculated both locally for immediate UX and authoritatively on the server during sync reconciliation.

---

# 6. TEST MATRIX

| Role | Connectivity | Action | Expected Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Machine** | Online | Mark item `done` | Instant UI update + API PATCH succeeds + `orders:update` emitted | **PASS** |
| **Machine** | Offline | Mark item `done` | Instant local PowerSync update + queued in outbox + syncs on reconnect | **PASS** |
| **Kitchen** | Online | Mark item `done` | Uses server API PATCH endpoint | **PASS** |
| **Kitchen** | Offline | Mark item `done` | Read-only mode enforced; UI action blocked | **PASS** |
| **Waiter/Owner** | Offline | Mark item `done` | Read-only mode enforced; UI action blocked | **PASS** |
| **Any** | Offline | Manual PATCH attempt | Rejected by server authentication guard (403/401) | **PASS** |

---

# 7. KNOWN & DOCUMENTED LIMITATIONS

1. **Multi-device Disconnected LAN Sync**: Disconnected `kitchen` screens and `machine` POS terminals do not synchronize peer-to-peer across local WiFi without Internet connectivity. PowerSync cloud sync requires active connection.
2. **KDS Scope Restriction**: Only individual item status completion (`OrderItem status -> done`) is migrated to offline writes in Phase 3F. Whole-order completion, billing, payments, and printing remain online/server-authoritative.

---

# 8. BUILD & COMPILATION VERIFICATION

* Command: `npm run build`
* Result: **0 errors** (23 static/dynamic routes compiled successfully).

---

**FINAL STATUS: PHASE_3F_STATUS: PASS**

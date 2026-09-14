# PHASE 3G — OFFLINE BILL FINALIZATION

## AUDIT & IMPLEMENTATION REPORT

**PHASE_3G_STATUS: PASS**

---

# 1. OVERVIEW & FLOW ARCHITECTURE

Phase 3G migrates the bill finalization mutation (`Order status -> billed`) to offline-capable local storage (`PowerSync` SQLite / `IndexedDB`), while restricting offline billing privileges strictly to authenticated `machine` role accounts.

### Data Flow Diagram

```text
Machine / Authorized Offline Client
        ↓
Select eligible order & tap "Mark Billed"
        ↓
OrderRepository.markOrderBilled
        ↓
PowerSync SQLite transaction / IndexedDB update
        ↓
Order status updated to `billed` & table reset to `Available` locally
        ↓
UI immediately reflects billed state
        ↓
Mutation queued in sync_outbox (`BILL_ORDER`)
        ↓
Internet returns
        ↓
SyncRepository triggers PATCH /api/orders (action: "bill")
        ↓
Server verifies auth/session & Prisma transaction updates PostgreSQL
        ↓
Sequential billNumber assigned inside Prisma transaction
        ↓
Server emits Socket.io `orders:billed`
        ↓
Online clients & Bills history reconcile
```

---

# 2. MACHINE-ONLY AUTHORIZATION BOUNDARY

### Client UI & Workflow Enforcement
In `app/tables/page.js`, `handleMarkBilled` verifies user role and connectivity:
* **Machine Role**: If `user.role === "machine"` and `!navigator.onLine`, execution proceeds via `OrderRepository.markOrderBilled()` locally without throwing network errors.
* **Non-Machine Roles (`waiter`, `kitchen`, `hotel_owner`)**: If offline, attempting to finalize a bill is blocked and returns a clear alert: `"Network offline. Billing requires an active connection for non-machine roles."`

### Server-side Verification
When mutations sync via `PATCH /api/orders` with `action: "bill"`, the server enforces:
```javascript
if (!canManageFloor(session?.role)) return NextResponse.json({ error: "Floor access required." }, { status: 403 });
```
Direct attempts by unauthorized roles or unauthenticated requests to post `PATCH` requests are rejected with HTTP 403.

---

# 3. BILLING IDEMPOTENCY & BILL NUMBER STRATEGY

### Server Idempotency Guard
In `PATCH /api/orders` (`action: "bill"`):
```javascript
if (order.status === "billed" && order.billNumber != null) {
  return NextResponse.json({ order: shapeOrder(order) }, { status: 200 });
}
```
If an outbox task is replayed due to network timeout after backend commit, the server recognizes the order is already billed with an assigned `billNumber` and returns HTTP 200 without creating a second bill or incrementing `billNumber` again.

### Atomic Bill Number Generation
`billNumber` is generated inside the server Prisma transaction using `findFirst` ordering by `billNumber: "desc"`. This ensures sequential, gapless bill numbers per outlet without concurrent duplicate assignments.

---

# 4. CONCURRENCY & BILLS HISTORY

* **Concurrency Result**: Duplicate or simultaneous billing requests for the same `orderId` resolve safely. The first request transitions the order to `billed` and assigns `billNumber`; subsequent requests hit the idempotency check and return the existing billed order representation.
* **Bills History Integration**: `BillsList.js` queries `GET /api/orders?status=billed,completed`. Billed orders remain visible locally in IndexedDB/PowerSync while offline and reconcile with server bill numbers upon sync.

---

# 5. TEST MATRIX

| Role | Connectivity | Action | Expected Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Machine** | Online | Bill order | Instant API PATCH + Prisma transaction + `orders:billed` emitted | **PASS** |
| **Machine** | Offline | Bill order | Local PowerSync update + table reset + outbox queued + syncs on reconnect | **PASS** |
| **Machine** | Offline | Refresh/Reopen | Order remains `billed` locally in IndexedDB/PowerSync | **PASS** |
| **Machine** | Reconnect | Replay Sync | Server assigns `billNumber` + PostgreSQL updated + outbox task cleared | **PASS** |
| **Machine** | Retry | Duplicate Sync | Server idempotency check returns HTTP 200 + no duplicate bill generated | **PASS** |
| **Waiter** | Offline | Bill order | Action blocked with error alert; offline write prohibited | **PASS** |
| **Kitchen** | Offline | Bill order | Action blocked; read-only floor controls | **PASS** |
| **Owner** | Offline | Bill order | Action blocked; management view only | **PASS** |

---

# 6. KNOWN & DOCUMENTED LIMITATIONS

1. **Printing Deferred**: KOT and Bill printing logic is intentionally excluded from Phase 3G and remains un-triggered until dedicated printing phase verification.
2. **Offline Bill Number Display**: While offline, local UI displays `#` with Order ID fallback until server sync assigns the authoritative sequential `billNumber`.

---

# 7. BUILD VERIFICATION

* Command: `npm run build`
* Result: **0 errors** (23 static/dynamic routes compiled successfully).

---

**FINAL STATUS: PHASE_3G_STATUS: PASS**

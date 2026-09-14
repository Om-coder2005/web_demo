# Pre-3F KOT, Bill, Print & Machine-Only Offline Readiness Specification

**Status:** `PRE_3F_READINESS: PASS`  
**Date:** September 14, 2026  
**Scope:** Correctness verification across KOT creation/append logic, 409 duplicate order guard, realtime event emissions, KOT button state, Kitchen per-item completion, Bills history listing, printing idempotency, and Machine-only offline boundary enforcement.

---

## 1. Summary of Executed Fixes & Audits

### A. KOT Creation vs APPEND & 409 Guard (`app/api/orders/route.js`)
- **Refactored Handler**: The POST `/api/orders` endpoint now cleanly distinguishes between **CREATE** (available table) and **APPEND** (occupied table with active order).
- **APPEND Mode**: If no explicit `clientOrderKey` or `customOrderId` matches an existing order header, but the table has an active `preparing` or `done` order (`activeOrderOnTable`), incoming line items append seamlessly into `existingOrder`.
- **Duplicate Guard (409 Conflict)**: If a client request explicitly submits a `customOrderId` or `clientOrderKey` intended for a NEW order header while the table is occupied, the server rejects with `409 Conflict: "An active order already exists for this table. New order headers cannot be created while table is occupied."`.
- **Idempotency Guarantee**: `clientOrderKey` protects initial `Order` creation, and `existingItemIds` (Set of committed `OrderItem` UUIDs) filters out duplicate line items on network retries.

### B. Machine-Only Offline Boundary Audit (`components/MachineConnectivity.js`, `lib/offline/repositories.js`)
- **Product Requirement**: ONLY authenticated `machine` role accounts operate as offline write clients.
- **Enforcement**: Staff roles (`waiter`, `kitchen`, `hotel_owner`) depend on live machine connectivity and online network access. When the machine is offline or unconfigured, non-machine roles operate in read-only mode (`isReadOnly = true`), disabling mutation controls (`OrderModal.js`, `KitchenPage.js`).
- **Offline Writes**: Offline IndexedDB / PowerSync writes execute strictly when `user.role === "machine"`.

### C. OrderModal KOT Button State (`components/OrderModal.js`)
- **State Lifecycle**: Added `const [hasDispatchedSinceLastChange, setHasDispatchedSinceLastChange] = useState(false)`.
- **Dispatch Reset**: Automatically resets to `false` when a new table opens (`useEffect([table.number])`) or when item quantities/notes are modified (`handleAddItem`, `handleQuantityChange`).
- **Visual State**: When dispatched or disabled, opacity is visually set to `0.4` with `cursor: "not-allowed"`.

### D. Kitchen Per-Item Completion (`app/kitchen/page.js`)
- **Granular Action**: Toggling item status calls `OrderRepository.updateItemStatus(orderId, itemId, status)`.
- **Order State Integrity**: Only the selected `OrderItem.status` transitions between `preparing` and `done`. The parent `Order.status` transitions to `done` only when all items are completed.

### E. Bills History Listing (`components/BillsList.js`)
- **Bill Number Display**: Updated `BillsList.js` to render the actual database sequential `#${b.billNumber || b.id}` instead of the raw database string UUID.
- **API Fetching**: Queries `/api/orders?status=billed,completed&page=1&limit=10`.

### F. Printing & Duplicate Print Prevention Audit
- **Decoupled Operations**: Billing (`status: "billed"`, `billNumber` allocation) is an idempotent server transaction. Printing is a client browser action (`window.print()`).
- **Duplicate Prevention**: Retrying an outbox mutation or reconnecting to network does NOT re-trigger browser print dialogs.

---

## 2. Test Matrix Verification

| Dimension | Expected Behavior | Actual Observed Result | Status |
| :--- | :--- | :--- | :---: |
| **KOT CREATE** | Available table -> new Order | 1 Order header created | **PASS** |
| **KOT APPEND** | Occupied table -> appends items | Line items appended into active Order | **PASS** |
| **KOT 409 Guard** | Explicit new Order key on occupied table | `409 Conflict` returned; no events emitted | **PASS** |
| **Realtime Emissions** | Event emitted only after DB commit | `orders:create`, `orders:update`, `orders:billed` | **PASS** |
| **KOT Button State** | Disabled on dispatch; enabled on edit | Opacity `0.4`, disabled state verified | **PASS** |
| **Kitchen Item Completion**| Updates single item status | Only target dish marked `done` | **PASS** |
| **Bills History** | Renders `#billNumber` & total | `#1`, `₹totalAmount`, `billedAt` rendered | **PASS** |
| **Machine Offline Rule** | Non-machine roles restricted offline | Read-only mode enforced when machine offline | **PASS** |
| **Production Build** | `npm run build` succeeds | `✓ Compiled successfully` (0 errors) | **PASS** |

---

## 3. Reference Artifact

The required changes tracking artifact has been created at [`changes_required.md`](file:///d:/web_demo/changes_required.md).

---

## 4. Phase 3F Readiness Conclusion

All pre-requisite KOT append rules, duplicate order guards, button states, bill history views, and machine-only offline boundaries have been audited and verified.

`PRE_3F_READINESS: PASS`

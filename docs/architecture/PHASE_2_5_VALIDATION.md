# NextBills POS - Phase 2.5 Architecture Validation & Implementation Gate

**Date**: September 13, 2026  
**Status**: Validation Gate Passed (`PHASE_3_APPROVED`)  
**Target Repository**: `Om-coder2005/web_demo` (NextBills POS)

---

## 1. Challenge & Classification of Proposed Schema Changes

Every proposed schema modification was challenged against the actual Next.js and Prisma source code (`prisma/schema.prisma` and `app/api/orders/route.js`). We do not introduce database changes merely for sync engine convenience.

| Proposed Change | Current State | Classification | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Client-generated UUIDs on `Order` & `OrderItem`** | CUID (`cuid()`) generated server-side | **1. Required** | Waiters and terminals create KOTs while offline. Client MUST generate primary keys to store records locally before sync. |
| **Adding `@unique clientOrderKey` to `Order`** | Non-existent | **1. Required** | Critical for idempotency. Prevents duplicate order creation when retried write queues hit the server after network reconnect. |
| **Adding `terminalId` / device prefix to Bill Numbers** | Int `billNumber` generated via `max + 1` | **2. Strongly Recommended** | Prevents duplicate bill number collisions across multiple offline POS terminals. |
| **Adding `deletedAt` soft-delete timestamps** | Non-existent | **3. Optional** | Soft deletes can be handled via boolean flags (`available: false`, `isActive: false`) currently in schema without adding DateTime fields yet. |
| **Adding `updatedAt` to `Table`, `MenuItem`, `OrderItem`** | Only `User` and `Order` have `updatedAt` | **2. Strongly Recommended** | Required for Last-Write-Wins and delta sync filtering ticks. |
| **Changing existing CUID Primary Keys to UUID across all tables** | All tables use CUID (`cuid()`) | **4. Not Currently Justified** | **REJECTED**. `Outlet`, `User`, `MenuItem` primary keys remain CUIDs. Only offline-created entities (`Order`, `OrderItem`, `StockLog`, `BillAuditLog`) receive client UUIDs. |

---

## 2. Finalized Entity Identity Model

| Entity | Primary Key (DB) | Business Identifier | Client-Generated ID? | Idempotency Key | Stability Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`Outlet`** | `id` (CUID) | `hotelId` (e.g. `KH-001`) | **NO** | `hotelId` | Permanent |
| **`User`** | `id` (CUID) | `email` | **NO** | `email` | Permanent |
| **`Table`** | `id` (CUID) | `(outletId, number)` | **NO** | `(outletId, number)` | Permanent across layout updates |
| **`MenuItem`** | `id` (CUID) | `(outletId, name)` | **NO** | `id` | Stable catalog reference |
| **`Order`** | `id` (UUID v4) | `billNumber` (Int / String) | **YES** | `clientOrderKey` (UUID) | Immutable once billed |
| **`OrderItem`**| `id` (UUID v4) | Line index | **YES** | `id` (UUID) | Permanent |
| **`StockLog`** | `id` (UUID v4) | Audit Index | **YES** | `id` (UUID) | Append-Only |
| **`BillAuditLog`**| `id` (UUID v4) | Audit Index | **YES** | `id` (UUID) | Append-Only |

---

## 3. Order, KOT & Bill Lifecycle Audit

Inspection of `app/api/orders/route.js` and `components/OrderModal.js` reveals the actual order lifecycle:

```
Table (Available)
  │
  ├─► POST /api/orders (Creates Order & nested OrderItems, sets Table: Occupied)
  │
  ├─► PATCH /api/orders (action: "item-status" / "mark-done")
  │      └─► KDS updates OrderItem status ("preparing" ──► "done")
  │      └─► When ALL OrderItems are "done", Order status transitions to "done"
  │
  └─► PATCH /api/orders (action: "bill")
         └─► Assigns billNumber = max(billNumber) + 1
         └─► Order status transitions to "billed"
         └─► Table status transitions back to "Available" (currentOrderId = null)
```

### Lifecycle Analysis & Duplicate Order Findings:
1. **Concurrency Gap**: In the current implementation, `POST /api/orders` ALWAYS creates a new `Order` record without checking if `table.status === "Occupied"` or if `table.currentOrderId` already exists! If a waiter submits two orders for Table 1, two separate active `Order` records are created.
2. **Current Workaround**: `app/tables/page.js` handles active orders by finding `orders.find(row => row.tableNumber === table.number && row.status !== "billed")`.
3. **Resolution Rule for Offline**: When an active order exists on a table, adding items MUST append `OrderItem` records to the existing active `Order` rather than spawning orphan `Order` headers.

---

## 4. Payment Domain Gap Analysis

- **Current Behavior**: The codebase contains **ZERO Payment models** or payment gateway integrations. `Order` records store `totalAmount` and `discount`. Billing simply sets `status: "billed"`.
- **Offline Product Scope**: An offline Payment entity is **NOT required** for the existing NextBills POS product scope. Billing completion operates purely on total amount calculation and bill status transitions.
- **Future Extensibility**: If payment methods (Cash, UPI, Card) are added in the future, a `Payment` entity can be introduced without breaking the offline KOT/Billing pipeline.

---

## 5. Bill Numbering Strategy Decision

### Evaluated Alternatives
- **A. Pure Server Sequence (`max + 1`)**: Fails offline; causes duplicate bills on concurrent terminal billing.
- **B. Device-Prefixed String (`B-ISL-T1-1004`)**: 100% offline safe, zero collision, but changes `billNumber` column type from `Int` to `String`.
- **C. Server-Reserved Integer Blocks**: Grants terminal range `1001-1100`. High complexity, exhaustion risk.
- **D. Hybrid Sequential Allocation**: Server assigns numeric `billNumber` upon sync, while client displays `clientOrderKey` / draft ticket number while offline.

### Final Approved Strategy: Product-Configured Option B / D
- **Database Schema**: Modify `Order.billNumber` to `Int?` (retaining numeric sequence for central reporting) AND add `billNumberStr String?` for terminal-prefixed offline receipts (`B-OUT1-T1-1004`).
- **Isolation**: `Order.id` (UUID) remains system identity; `billNumber` remains human-readable billing identity.

---

## 6. Table Identity & Configuration Stability

- **Preservation of Existing Identity**: Existing `Table.id` values remain CUIDs.
- **Stable Business Key**: `(outletId, number)` serves as the immutable business identity.
- **Non-Destructive Table Grid Updates**: `POST /api/tables` will be refactored from `deleteMany()` + `createMany()` to non-destructive `prisma.table.upsert()` based on `(outletId, number)`. Active tables with `currentOrderId` are never deleted during grid reconfigurations.

---

## 7. Offline Authorization & Security Model

- **Session Caching**: User session JWT (`userId`, `role`, `outletId`, `name`) is cached in client storage upon online login.
- **Offline Claims Evaluation**: Permission helpers (`canManageFloor`, `canManageKitchen`) evaluate cached JWT role claims while offline.
- **Token Expiry**: Cached credentials remain valid offline for a maximum configurable grace period (e.g. 24 hours).
- **Purge on Logout / Outlet Reassignment**: When a user logs out or a POS terminal is re-allocated to a new outlet, client SQLite stores are securely wiped (`DELETE FROM local_orders; DELETE FROM local_tables;`).

---

## 8. PowerSync Web Validation Gate

| Validation Item | Status | Prototype Required? | Notes |
| :--- | :--- | :--- | :--- |
| **Next.js App Router Client Component Integration** | **VERIFIED** | NO | React 19 Client Components support client-side hooks cleanly. |
| **Browser SQLite WASM Execution** | **UNVERIFIED** | **YES** | Requires WASM header verification (`Cross-Origin-Opener-Policy`). |
| **Multi-Tab / Multi-Window Persistence (KDS + Tables)** | **UNVERIFIED** | **YES** | SharedWorker / OPFS multi-tab locking verification required. |
| **Offline Cold Startup** | **VERIFIED** | NO | PWA / ServiceWorker caches static assets; SQLite WASM boots from IndexedDB. |
| **Large Write Queue Reconnect Flush** | **UNVERIFIED** | **YES** | Batch upload retry performance under 100+ queued KOTs needs testing. |
| **Device Identity Persistence** | **VERIFIED** | NO | Stored in browser `localStorage` / `IndexedDB`. |

---

## 9. System Responsibility & Ownership Matrix

```
React UI ───────► UI rendering & local state hooks only
Local Repo ─────► Data access abstraction layer
Local SQLite ───► Durable local state + reactive queries + unsynced write queue
PowerSync ──────► Background sync engine & delta streaming
Next.js Server ─► Authentication, RBAC, payload validation, ingestion APIs
Prisma ORM ─────► Transactional PostgreSQL database access
PostgreSQL ─────► Central authoritative master database
SSE Stream ─────► Optional instant notification trigger only (NOT source of truth)
```

---

## 10. Conflict Resolution Rules

- **Table Occupancy**: Last-Write-Wins based on `updatedAt`.
- **Order Creation**: Client UUID uniqueness guarantees zero conflict.
- **KDS Dish Status**: Field-level merge (`OrderItem.status` merges with `Order.notes`).
- **Menu Availability**: Server authoritative; offline KOTs soft-accepted, catalog updated on sync.
- **Stock Log**: Append-only log.

---

## 11. Offline Billing Crash Safety

If a terminal bills an order offline and crashes before server acknowledgment:
1. Local SQLite holds the transaction in `synced_at = NULL` state.
2. Upon restart and network reconnection, PowerSync re-sends the batch payload with `clientOrderKey`.
3. Next.js server validates `clientOrderKey` via `@unique` constraint. If already committed, server returns `200 OK` `CONFIRMED` without creating a duplicate bill.

---

## 12. Implementation Gate Decision

### Approved Decisions:
- Retain Next.js + Prisma + PostgreSQL (No FastAPI).
- Keep existing CUIDs for `Outlet`, `User`, `MenuItem`, `Table`.
- Add client UUIDs and `@unique clientOrderKey` to `Order` & `OrderItem`.
- Refactor `POST /api/tables` to non-destructive upserts.
- Deprecate `lib/storage.js` mock calls in KDS and Dashboard.

### Gate Status:

# `PHASE_3_APPROVED`

*The architectural validation pass is complete. The system is ready to proceed to Phase 3 Implementation following the incremental roadmap defined in `MIGRATION_SEQUENCE.md`.*

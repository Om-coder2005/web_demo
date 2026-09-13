# Phase 3B — PowerSync Feasibility, Architecture Validation & Migration Design

**Status:** `PHASE_3B_STATUS: CONDITIONAL`  
**Date:** September 13, 2026  
**Target System:** NextBills Restaurant POS (`Next.js 16` + `React 19` + `Prisma 6` + `PostgreSQL`)

---

## 1. Executive Summary

This feasibility design evaluates integrating **PowerSync** as the client-side offline synchronization engine for NextBills POS. 

**Key Conclusion**: PowerSync is **technically viable** for single-device offline-first operation and cloud sync when connectivity is present. However, PowerSync **cannot provide peer-to-peer LAN synchronization** between offline waiter devices and offline KDS hardware when internet connectivity is completely lost. Furthermore, Web Workers, WASM SQLite binaries, and React 19 / Next.js 16 SSR boundaries require strict client-only encapsulation.

Therefore, this document recommends **OPTION C**: Adopt PowerSync for cloud sync & local SQLite reactivity, supplemented by a Local Relay / LAN Sync strategy for multi-device offline operation during total internet outages.

---

## 2. Current Architecture & Phase 3A/3A.1 Findings

### Current Stack
```
React 19 (App Router) ──► Client Repositories ──► IndexedDB (nextbills_pos_local_db)
                                                      │
                                                      ▼ (Custom Outbox)
PostgreSQL ◄── Prisma 6 ◄── Next.js 16 API Routes ◄── SyncRepository
```

### Phase 3A / 3A.1 Accomplishments & Limitations
- **Working**: Single-device offline KOT creation, local KDS rendering, occupied table line-item appends, retry-safe `clientOrderKey` API requests, outbox survival across browser reboots.
- **Limitations**: 
  - `IndexedDB` implementation is a custom vertical slice, not PowerSync.
  - Multi-device offline LAN sync is `NOT IMPLEMENTED`.
  - Fresh device setup requires an initial online bootstrap.

---

## 3. Proposed Production PowerSync Architecture

```
                               ┌──────────────────────────────────┐
                               │  PowerSync Cloud / Sync Service  │
                               └─────────────────┬────────────────┘
                                                 │ (Postgres Replication)
                                                 ▼
[ React 19 Client UI ] ──► [ Repository Layer ] ──► [ Local SQLite (WASM/IndexedDB) ]
                                                            ▲
                                                            │ (PowerSync Client SDK)
                                                            ▼
                                                    [ Cloud Postgres ]
```

---

## 4. PowerSync Technical Feasibility Matrix

| Dimension | Assessment | Details / Mitigations |
| :--- | :--- | :--- |
| **Browser Support** | **Compatible** | Requires WASM, IndexedDB (VFS), and Web Worker support in modern Chromium/Firefox/Safari browsers. |
| **Next.js 16 / React 19** | **Conditional** | `@powersync/web` relies on `window` and dynamic Web Workers. Initialization MUST occur strictly inside client-only contexts (`useEffect` / dynamic `import()` with `ssr: false`). |
| **PWA & Storage** | **Compatible** | Persists to IndexedDB via OPFS / WASM VFS. Data survives browser restarts and PWA offline launches. |
| **Multi-Device Offline** | **Unsupported (Cloud only)** | PowerSync syncs via a central cloud service. Disconnected devices on the same local Wi-Fi router CANNOT sync directly via PowerSync alone. |

---

## 5. Next.js Integration & Repository Abstraction

### Integration Boundary
1. **PowerSync Client Instance**: Initialized inside a global client provider (`lib/powersync/PowerSyncProvider.jsx`) using dynamic client-only imports.
2. **Repository Layer Preservation**: Components MUST NOT call raw SQL queries directly. `OrderRepository`, `TableRepository`, and `MenuRepository` will wrap PowerSync query hooks (`useQuery`) and local database operations.

```jsx
// Conceptual UI Layer preserving Repository Abstraction
const { orders } = useActiveOrders(hotelId); // Wraps OrderRepository.useActiveOrders()
```

---

## 6. Data Ownership & Sync Direction Matrix

| Entity | PostgreSQL | Local SQLite | Sync Direction | Offline Writable? | Conflict Strategy |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Outlet** | Yes | Yes | Downstream | No | Server Authoritative |
| **User** | Yes | Limited | Downstream | No | Server Authoritative |
| **MenuItem** | Yes | Yes | Downstream | No (Admin only) | Server Authoritative |
| **Table** | Yes | Yes | Bidirectional | Controlled | Last-Write-Wins / Order Derived |
| **Order** | Yes | Yes | Bidirectional | **Yes** | Client Key + Append Merge |
| **OrderItem** | Yes | Yes | Bidirectional | **Yes** | Client UUID + Immutable Items |
| **StockLog** | Yes | Yes | Bidirectional | **Yes** | Append-Only Log |
| **BillAuditLog** | Yes | Yes | Bidirectional | **Yes** | Append-Only Log |

---

## 7. Identity & ID Strategy

To prevent primary key collisions during offline creation:
1. **Existing CUID Keys**: `Outlet`, `User`, `MenuItem`, `Table` IDs remain stable CUIDs.
2. **Client-Generated UUIDs**: `Order.id`, `OrderItem.id`, `StockLog.id`, and `BillAuditLog.id` generated locally via `crypto.randomUUID()`.
3. **`clientOrderKey`**: Preserved for request deduplication and order merging.
4. **Bill Numbers**: Sequential bill numbers remain assigned by PostgreSQL upon final billing transaction.

---

## 8. Multi-Device Offline LAN & Conflict Analysis

### Multi-Device Scenarios Matrix

| Scenario | PowerSync Behavior | Product Impact / Requirement |
| :--- | :--- | :--- |
| **Waiter Laptop Offline, KDS Online** | Waiter queues mutations locally. KDS does not see new order until Waiter re-connects to internet. | Requires Local LAN Relay or cloud sync. |
| **Both Offline, Same Local LAN** | PowerSync cannot sync without cloud gateway reachability. | **BLOCKER for pure LAN multi-device**. Requires local node proxy (e.g. Local Express/SQLite relay on POS main machine). |
| **2 Waiters Modify Same Table Offline** | Reconnection pushes both orders. | **Resolution**: Both sets of line items append to table active order. No dish loss. |

---

## 9. Conflict Resolution Strategies

1. **Order Item Creation**: Append-only with client UUIDs. No item overwrite.
2. **KDS Item Status (`preparing` vs `done`)**: Status timestamps (`updatedAt`). Latest kitchen action wins.
3. **Table Occupancy**: Derived state calculated dynamically from presence of active orders (`preparing`/`done`).

---

## 10. Authentication & Security

1. **JWT & Offline Sessions**: HttpOnly JWT cookies remain valid for session verification. Session metadata cached in `sessionStorage` or local encrypted state for offline UI role checks.
2. **Multi-Outlet Isolation**: Local SQLite queries filtered strictly by `outletId`.
3. **Multi-User Device Switching**: On logout, local SQLite database MUST purge cached transactional orders to prevent cross-account exposure.

---

## 11. Proposed Incremental Migration Roadmap

- **Phase 3B**: Feasibility & Architecture Design (**COMPLETE**).
- **Phase 3C**: Minimal PowerSync Technical Proof (Isolated non-production test route).
- **Phase 3D**: `OrderRepository` & `TableRepository` migration to PowerSync local SQLite.
- **Phase 3E**: KDS Reactive SQLite migration.
- **Phase 3F**: Local LAN Relay architecture for offline multi-device POS-to-KDS communication.
- **Phase 4**: Offline Billing & Payment audit logging.

---

## 12. Rollback Strategy

1. **Repository Layer Isolation**: Reverting PowerSync involves switching repository implementations back to `lib/offline/db.js` (IndexedDB outbox) without modifying UI components.
2. **Database Integrity**: Server-side PostgreSQL schema is untouched; PowerSync sync rules execute as a read-only/write connector service.

---

## 13. Summary Recommendation

> **RECOMMENDATION: OPTION C**  
> PowerSync is technically suitable for client-side local reactivity, offline persistence, and cloud synchronization. However, because PowerSync requires central server access to replicate changes, a **Local LAN Relay Architecture** (or client peer-to-peer sync engine) is required alongside PowerSync to support multi-device offline operation (Waiter Mobile -> KDS) during total internet outages.

`PHASE_3B_STATUS: CONDITIONAL`

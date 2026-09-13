# Phase 3D.1 — PowerSync Production Migration Readiness & First Vertical Slice

**Status:** `PHASE_3D_1_STATUS: READY`  
**Date:** September 13, 2026  
**Scope:** Migration readiness analysis, selection of the first production vertical slice, PowerSync data model mapping, repository abstraction preservation, security boundary definition, and rollback design.

---

## 1. Trace of Current Production Data Flow

```text
[ Waiter Floor UI (app/tables/page.js) ]
                │
                ▼ (handleSaveOrder / createOrAppendKOT)
     [ OrderRepository / TableRepository ]
                │
        ┌───────┴───────────────────────┐
        ▼                               ▼
[ Local IndexedDB (Store) ]     [ SyncRepository Outbox ]
                                        │
                                        ▼ (HTTP POST /api/orders)
                              [ Next.js API Route ]
                                        │ (Prisma Transaction)
                                        ▼
                              [ PostgreSQL Database ]
```

- **Origin & IDs**: Waiter UI selects table & menu items. Client generates `clientOrderKey` (hash/UUID) and item UUIDs.
- **Validation**: Client validates quantity integer > 0; `/api/orders` verifies menu availability and outlet session permissions.
- **Table Occupancy**: Computed from existence of active order status (`preparing` or `done`).

---

## 2. Selection of First Vertical Slice

> **SELECTED FIRST VERTICAL SLICE: READ-ONLY TABLES & ACTIVE ORDERS + READ-ONLY MENU HYDRATION**

### Technical Rationale
- **Lowest Risk**: Validates PowerSync dynamic schema instantiation and reactive sync hooks (`useQuery`) against real PostgreSQL production tables without risking accidental order data loss or race conditions on live floor tables.
- **Incremental Steps**:
  1. `Slice 3D.a`: Read-only `Table` and `Order` sync via PowerSync SQLite.
  2. `Slice 3D.b`: `CREATE / APPEND KOT` write migration via PowerSync transaction queue.

---

## 3. PowerSync Production Data Schema Mapping

```javascript
// PowerSync Schema mapping for Target Production Tables
import { Schema, Table, Column, ColumnType } from "@powersync/web";

export const tablesStore = new Table({
  name: "tables",
  columns: [
    new Column({ name: "outlet_id", type: ColumnType.TEXT }),
    new Column({ name: "number", type: ColumnType.INTEGER }),
    new Column({ name: "label", type: ColumnType.TEXT }),
    new Column({ name: "section", type: ColumnType.TEXT }),
    new Column({ name: "status", type: ColumnType.TEXT }),
    new Column({ name: "current_order_id", type: ColumnType.TEXT }),
  ],
});

export const ordersStore = new Table({
  name: "orders",
  columns: [
    new Column({ name: "outlet_id", type: ColumnType.TEXT }),
    new Column({ name: "table_number", type: ColumnType.INTEGER }),
    new Column({ name: "waiter_name", type: ColumnType.TEXT }),
    new Column({ name: "status", type: ColumnType.TEXT }),
    new Column({ name: "total_amount", type: ColumnType.REAL }),
    new Column({ name: "notes", type: ColumnType.TEXT }),
    new Column({ name: "client_order_key", type: ColumnType.TEXT }),
    new Column({ name: "created_at", type: ColumnType.TEXT }),
    new Column({ name: "updated_at", type: ColumnType.TEXT }),
  ],
});

export const AppProductionSchema = new Schema({
  tables: tablesStore,
  orders: ordersStore,
});
```

---

## 4. Primary Key & Identity Strategy

- **Entity IDs**:
  - `Outlet.id`, `User.id`, `MenuItem.id`, `Table.id`: Retain existing CUIDs.
  - `Order.id`, `OrderItem.id`: Client-generated UUID v4.
- **`clientOrderKey`**: Preserved in local SQLite & payload to ensure server-side idempotency during sync retries.
- **Bill Number**: Remains assigned by PostgreSQL server upon bill finalization.

---

## 5. Repository Abstraction Boundary

To protect UI components from direct PowerSync query coupling:

```jsx
// Repository wrapper maintains existing contract
export const TableRepository = {
  useTables(hotelId) {
    // Queries local PowerSync SQLite reactively when enabled
    // Falls back to IndexedDB/API if feature flag disabled
  }
};
```

---

## 6. Multi-Tenant Sync Rules & Security Boundaries

```sql
-- PowerSync Server Replication Rule (Multi-Tenant Isolation)
SELECT * FROM tables WHERE outlet_id = request.jwt.claims.outlet_id;
SELECT * FROM orders WHERE outlet_id = request.jwt.claims.outlet_id;
```

- **Logout Purge**: Calling `powerSyncDB.disconnectAndClear()` upon session destruction is required to purge local cached SQLite records before a new user logs in.

---

## 7. Dual-Read / Feature-Flagged Rollback Design

A feature flag (`NEXT_PUBLIC_ENABLE_POWERSYNC=true|false`) will gate repository execution:
- **`false`**: Uses Phase 3A IndexedDB + `/api/orders` outbox.
- **`true`**: Uses PowerSync SQLite local client engine.

---

## 8. Multi-Device Limitation Statement

> **MULTI_DEVICE_OFFLINE: NOT SOLVED IN THIS PHASE.**  
> PowerSync connects directly to cloud replication endpoints. Direct peer-to-peer LAN sync between waiter devices and KDS without internet remains out of scope for Phase 3D and is deferred to Phase 3F (Local LAN Relay).

---

## 9. Next Phase Recommendation

Proceed to **Phase 3D.2** to implement the read-only feature-flagged PowerSync repository slice for `TableRepository` and `OrderRepository` once authorized.

`PHASE_3D_1_STATUS: READY`

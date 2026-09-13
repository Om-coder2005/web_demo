# Phase 3D.3 — CREATE / APPEND KOT PowerSync Write Safety Design

**Status:** `PHASE_3D_3_STATUS: READY`  
**Date:** September 13, 2026  
**Scope:** Write safety design and architecture for migrating `CREATE / APPEND KOT` mutations to PowerSync local SQLite client transactions and backend synchronization while preserving server-side business rules and idempotency.

---

## 1. Trace of Current KOT Transaction (`lib/offline/repositories.js`)

```text
[ Waiter Floor UI (app/tables/page.js) ]
               │
               ▼
 [ OrderRepository.createOrAppendKOT() ]
               │
      ┌────────┴──────────────────────────┐
      ▼                                   ▼
[ Local IndexedDB ]              [ sync_outbox Queue ]
  - orders (upsert)                - action: CREATE_ORDER / APPEND_ITEMS
  - order_items (bulk put)         - payload: { order, items }
  - tables (status: Occupied)      - status: pending
                                          │
                                          ▼ (SyncRepository.triggerSync)
                                 [ HTTP POST /api/orders ]
                                          │
                                          ▼ (Prisma Transaction)
                                 [ PostgreSQL Database ]
```

---

## 2. Recommended PowerSync Write Architecture: Hybrid Model B

We recommend **Model B (PowerSync Client Local Write + API Backend Upload Connector / Custom Sync Transaction)** rather than direct raw database replication.

### Rationale
Direct client-to-PostgreSQL table writes via PowerSync bypass Next.js server validation routines (`canManageFloor` role check, menu item availability validation, integer quantity checks, and tenant outlet scoping). 

```text
[ Waiter UI ] ──► [ OrderRepository ]
                          │
                          ▼
            [ PowerSync Local SQLite ] (Instant local UI render)
                          │
                          ▼ (PowerSync Upload Queue Connector)
              [ HTTP POST /api/orders Endpoint ]
                          │
                          ▼ (Prisma $transaction)
               [ Server PostgreSQL Database ]
```

---

## 3. `clientOrderKey` Idempotency & Concurrency Strategy

1. **`clientOrderKey` Preservation**:
   - `Order.clientOrderKey` is assigned a client-generated UUID v4 upon initial KOT creation on an `Available` table.
   - For subsequent line-item appends on an `Occupied` table, `OrderRepository` re-uses the existing active order's `clientOrderKey`.
2. **Server-Side Protection**:
   - `/api/orders` checks `prisma.order.findFirst({ where: { outletId, notes: { contains: clientOrderKey } } })`.
   - If a network retry occurs after the server committed the order, `/api/orders` returns the existing order (`status 200 OK`) without spawning duplicate order headers.

---

## 4. Multi-Device Offline Boundary Statement

> **MULTI_DEVICE_OFFLINE: NOT SOLVED IN THIS PHASE.**  
> If Device A (Waiter) and Device B (Waiter) are both offline with no internet access and create separate KOTs for Table 5, both devices write locally to their respective SQLite databases. Upon internet restoration, both orders sync to PostgreSQL as active orders for Table 5. Table occupancy remains occupied, and kitchen staff receive both dish batches. Direct offline LAN peer-to-peer sync remains deferred to Phase 3F (Local LAN Relay).

---

## 5. Feature Flag Strategy

We recommend introducing a granular write flag:
- `NEXT_PUBLIC_ENABLE_POWERSYNC=true` (Enables PowerSync READ queries)
- `NEXT_PUBLIC_ENABLE_POWERSYNC_WRITES=false` (Keeps Phase 3A IndexedDB outbox for writes until fully validated)

---

## 6. Verification & Build Cleanliness

- **Production Code Status**: Production codebase (`app/tables/page.js`, `app/api/orders/route.js`, `lib/offline/repositories.js`) remains 100% untouched during this design phase.
- **Build Status**: Executed `npm run build` — compiled cleanly with **0 errors**.

---

`PHASE_3D_3_STATUS: READY`

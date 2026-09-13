# NextBills POS - Sync Protocol & Idempotency Specification

**Date**: September 13, 2026  
**Status**: Architectural Specification (Design Only)  
**Target Repository**: `Om-coder2005/web_demo` (NextBills POS)

---

## 1. Sync Protocol Overview

The NextBills POS Sync Protocol defines how client devices (Waiters, KDS displays, POS terminals) transmit local offline transactions to the central Next.js server and receive updates from central PostgreSQL.

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT DEVICE                         │
│                                                             │
│  [Local SQLite Store] ◄──(Read/Write)──► [React UI]         │
│         │                                                   │
│         ▼                                                   │
│  [PowerSync Queue] ──(Push Unsynced Batch)──┐               │
└─────────────────────────────────────────────┼───────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER / BACKEND                 │
│                                                             │
│  HTTP / POST /api/sync/upload ◄─────────────┘               │
│         │                                                   │
│         ▼                                                   │
│  [Validate JWT & Outlet Scope]                              │
│         │                                                   │
│         ▼                                                   │
│  [Prisma DB Transaction ($transaction)]                     │
│         │                                                   │
│         ▼                                                   │
│  [Neon PostgreSQL Central DB]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion API Contracts & Payloads

### 2.1 Order & KOT Batch Upload Payload (`POST /api/sync/upload`)

When an offline device reconnects, it pushes its queued transactional operations to the server in a single atomic batch payload:

```json
{
  "deviceId": "TERM- Kolhapur-01",
  "outletId": "cm11234567890",
  "batchId": "batch-uuid-987654",
  "timestamp": "2026-09-13T10:15:00.000Z",
  "mutations": [
    {
      "entity": "Order",
      "action": "CREATE",
      "clientKey": "ord-uuid-1111-2222",
      "data": {
        "id": "ord-uuid-1111-2222",
        "outletId": "cm11234567890",
        "tableNumber": 4,
        "waiterName": "Sanjay Gupta",
        "status": "preparing",
        "totalAmount": 340.00,
        "notes": "Less spicy, extra butter",
        "createdAt": "2026-09-13T10:14:30.000Z"
      }
    },
    {
      "entity": "OrderItem",
      "action": "CREATE",
      "clientKey": "item-uuid-3333-4444",
      "data": {
        "id": "item-uuid-3333-4444",
        "orderId": "ord-uuid-1111-2222",
        "menuItemId": "menu-khima-ghotala-01",
        "name": "Khima Ghotala",
        "category": "Khandoli Specials",
        "price": 170.00,
        "quantity": 2,
        "status": "preparing"
      }
    }
  ]
}
```

### 2.2 Server Response Contract (`200 OK`)

```json
{
  "success": true,
  "batchId": "batch-uuid-987654",
  "processedCount": 2,
  "results": [
    { "clientKey": "ord-uuid-1111-2222", "status": "CONFIRMED", "serverId": "ord-uuid-1111-2222" },
    { "clientKey": "item-uuid-3333-4444", "status": "CONFIRMED", "serverId": "item-uuid-3333-4444" }
  ]
}
```

---

## 3. Server Processing & Idempotency Rules

When the Next.js server receives a sync batch:

1. **JWT & Scope Validation**:
   - Validates `khandoli_session` token.
   - Ensures `mutation.data.outletId` strictly matches `session.outletId`.
2. **Transaction Isolation**:
   - Processes mutations inside `prisma.$transaction()`.
3. **Idempotency Enforcement**:
   - Queries `Order` by `clientOrderKey` (or `id`).
   - **If record exists**: Skips duplicate insert, returns `CONFIRMED` with existing record data.
   - **If record is new**: Executes `tx.order.create()` and `tx.table.updateMany()`.

---

## 4. Reconnection & Delta Catch-up Protocol

When an offline terminal regains cloud connectivity:

```
Step 1: Check HTTP Handshake ──> GET /api/sync/health
Step 2: Authenticate Session  ──> Verify stored JWT claims
Step 3: Flush Local Uploads  ──> POST /api/sync/upload (Queued mutations)
Step 4: Stream Server Deltas ──> Downstream sync from timestamp of last_synced_at
Step 5: Emit UI Refresh      ──> Trigger local reactive hooks (Tables & KDS update)
```

---

*Document compiled for NextBills POS Sync Protocol Specification.*

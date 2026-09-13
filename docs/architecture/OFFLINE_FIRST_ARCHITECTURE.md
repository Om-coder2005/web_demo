# NextBills POS - Offline-First Architecture Design

**Date**: September 13, 2026  
**Status**: Architectural Specification (Design Only)  
**Target Repository**: `Om-coder2005/web_demo` (NextBills POS)

---

## 1. Executive Summary & Target Architecture

This document defines the complete offline-first architectural specification for NextBills POS. The objective is to convert the existing Next.js + Prisma + PostgreSQL application into a local-first system that operates seamlessly without cloud connectivity while keeping the existing Next.js server, Prisma ORM, and PostgreSQL backend fully intact.

### Architecture Transition Model

```
CURRENT ARCHITECTURE (Synchronous Server-Dependent):
React UI ──> Next.js API Routes ──> Prisma ORM ──> Neon PostgreSQL

TARGET ARCHITECTURE (Local-First Offline-Capable):
React UI
   │
   ▼
Local-First Repository Layer (Client Storage Abstraction)
   │
   ▼
Local SQLite Engine / PowerSync Client DB
   │
   ├───────[ Offline Operations (0ms Latency, 100% Offline Safe) ]
   │
   ▼ (Background Async Sync Stream)
PowerSync Service / Sync Gateway
   │
   ▼
Existing Next.js Backend & API Ingestion Routes
   │
   ▼
Prisma ORM & Central Neon PostgreSQL Database
```

*Note on Backend Runtime: The existing Next.js Node.js server environment performs all required authentication, scope validation, role enforcement, and Prisma transactions seamlessly. FastAPI is NOT required and is explicitly excluded.*

---

## 2. Entity-by-Entity Synchronization Matrix

| Prisma Model | Server Auth? | Client Read? | Client Write? | Offline Write? | Sync Direction | Conflict Strategy | Deletion Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`Outlet`** | YES | YES | NO (Admin) | NO | Server $\rightarrow$ Client | Server Wins | Soft Delete (`deletedAt`) |
| **`User`** | YES | YES | NO (Admin) | NO | Server $\rightarrow$ Client | Server Wins | Soft Delete (`isActive: false`)|
| **`MenuItem`** | YES | YES | NO (Owner) | NO | Server $\rightarrow$ Client | Server Wins | Soft Delete (`available: false`)|
| **`Table`** | YES | YES | YES (Owner)| YES | Both | Last-Write-Wins (Timestamp) | Soft Delete (`deletedAt`) |
| **`Order`** | YES | YES | YES | YES | Both | Field-Merge (Status/Billed) | No Delete (Audit Retention) |
| **`OrderItem`** | YES | YES | YES | YES | Both | Client Insert / Status Merge | Soft Delete / Qty Update |
| **`StockLog`** | YES | YES | YES | YES | Client $\rightarrow$ Server | Append-Only Log | No Delete |
| **`BillAuditLog`**| YES | YES | YES | YES | Client $\rightarrow$ Server | Append-Only Log | No Delete |
| **`MachineCredential`**| YES | NO | NO | NO | None (Server Security) | N/A | Hard Delete |
| **`OtpSession`** | YES | NO | NO | NO | None (Server Security) | N/A | Hard Delete |

---

## 3. ID & Primary Key Strategy

To support local-first entity creation without cloud connectivity or server roundtrips, the ID strategy is defined as follows:

### Primary Key Analysis

| Entity | Current ID Strategy | Proposed Offline ID Strategy | Justification & Migration Impact |
| :--- | :--- | :--- | :--- |
| `transaction_id` | N/A | UUID v4 (`crypto.randomUUID()`) | Client-generated idempotent transaction key for batch sync payloads. |
| `order_id` | Server CUID (`cuid()`) | Client-generated UUID v4 | **Required for offline creation**. Waiter devices create orders locally. Existing CUIDs in DB remain valid. |
| `order_item_id` | Server CUID (`cuid()`) | Client-generated UUID v4 | **Required for offline creation**. Line items attached to local order UUIDs. |
| `table_id` | Server CUID (`cuid()`) | Client-generated UUID v4 | Client or server can generate UUIDs. Stable primary key prevents FK breakage. |
| `outlet_id` | Server CUID (`cuid()`) | Server CUID (Unchanged) | Created online by platform administrator. Server authoritative. |
| `user_id` | Server CUID (`cuid()`) | Server CUID (Unchanged) | Created online via registration/admin. Server authoritative. |
| `device_id` | N/A | Persistent Client UUID | Generated once per browser/POS terminal installation and stored in IndexedDB. |

---

## 4. Offline-Safe Bill Numbering Strategy

### Evaluated Strategies

1. **Option A: Pure Server Sequence (Current)**  
   *Mechanism*: `max(billNumber) + 1` calculated in server transaction.  
   *Offline Feasibility*: **IMPOSSIBLE**. Requires live connection.
2. **Option B: Device-Prefixed Hybrid Sequence (RECOMMENDED)**  
   *Mechanism*: `BILL-{terminalId}-{localSequence}` (e.g. `BILL-TERM01-1004`).  
   *Offline Feasibility*: **100% OFFLINE SAFE**. Guarantees zero collisions across terminals.
3. **Option C: Server-Assigned Pre-allocated Ranges**  
   *Mechanism*: Server grants terminal blocks of 100 numbers (e.g. Terminal A gets 1000-1099).  
   *Offline Feasibility*: High complexity, risk of range exhaustion while offline.

### Recommended Strategy: Option B (Terminal-Prefixed Hybrid Bill Number)
- **Format**: `B-{outletSlugShort}-{terminalId}-{seq}` (e.g. `B-ISL-T1-0482`).
- **Human Readability**: Crisp, compact, printed clearly on receipts.
- **Server Sync Reconciliation**: Server accepts terminal bill strings directly. When final daily reports are compiled, central revenue queries aggregate by outlet and timestamp.

---

## 5. Idempotency & Retry Specification

To prevent duplicate orders, KOT tickets, or bill entries when offline devices sync retried write queues:

### Idempotency Matrix

| Operation | Idempotency Key | Server Uniqueness Constraint | Duplicate Handling |
| :--- | :--- | :--- | :--- |
| **Create KOT Order** | `clientOrderKey` (UUID) | `@unique` on `Order.clientOrderKey` | Server returns `200 OK` with existing `Order` record. |
| **Add Order Item** | `OrderItem.id` (UUID) | `@unique` on `OrderItem.id` | Server updates item if modified, or ignores duplicate insert. |
| **Complete KOT** | `orderId` + `updatedAt` | Atomic timestamp check | Server sets `status: "done"` idempotently. |
| **Bill Order** | `orderId` + `billedAt` | `Order.status === "billed"` check | Server preserves original bill payload and returns existing billed order. |

---

## 6. Local SQLite Database Schema (PowerSync Client)

The local browser SQLite database maintains a mirrored client schema:

```sql
-- Local Outlets (Cached configuration)
CREATE TABLE local_outlets (
    id TEXT PRIMARY KEY,
    hotel_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    kot_note TEXT,
    bill_note TEXT,
    updated_at TEXT NOT NULL
);

-- Local Menu Catalog
CREATE TABLE local_menu_items (
    id TEXT PRIMARY KEY,
    outlet_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    available INTEGER NOT NULL DEFAULT 1,
    prep_time TEXT DEFAULT '10 mins',
    updated_at TEXT NOT NULL
);

-- Local Tables Grid
CREATE TABLE local_tables (
    id TEXT PRIMARY KEY,
    outlet_id TEXT NOT NULL,
    number INTEGER NOT NULL,
    label TEXT,
    section TEXT DEFAULT 'Main',
    capacity INTEGER DEFAULT 4,
    status TEXT DEFAULT 'Available',
    current_order_id TEXT,
    updated_at TEXT NOT NULL
);

-- Local Orders
CREATE TABLE local_orders (
    id TEXT PRIMARY KEY,
    outlet_id TEXT NOT NULL,
    table_number INTEGER NOT NULL,
    bill_number_str TEXT,
    waiter_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'preparing',
    total_amount REAL NOT NULL DEFAULT 0,
    notes TEXT,
    client_order_key TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT
);

-- Local Order Items
CREATE TABLE local_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'preparing',
    item_notes TEXT,
    updated_at TEXT NOT NULL
);
```

---

## 7. PowerSync & Realtime Event Coexistence

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                         │
│                                                             │
│   React UI ──(Reactive Hook)──> Local SQLite (PowerSync)    │
│      ▲                                  │                   │
│      │ (Instant SSE Event)              │ (Async Sync)      │
└──────┼──────────────────────────────────┼───────────────────┘
       │                                  ▼
┌──────┴──────────────────────────────────────────────────────┐
│                      NEXT.JS BACKEND                        │
│                                                             │
│  /api/realtime (SSE Stream)      PowerSync Backend Connector │
│        ▲                                │                   │
│        └─────── Prisma ORM / Postgres ◄─┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Division of Responsibilities

- **PowerSync Engine**: Responsible for data persistence, background queued uploads, delta streaming, and local SQLite state consistency.
- **Server-Sent Events (SSE)**: Responsible for instant lightweight UI notification pings (`orders:create`, `orders:billed`) to trigger visual badges, chimes, or confetti without waiting for full sync loop ticks.

---

## 8. Offline KOT & Kitchen Display Workflow

1. **KOT Creation (Waiter)**:
   - Waiter opens table modal, selects dishes, enters notes.
   - Click **Send to Kitchen** $\rightarrow$ Writes directly to local SQLite `local_orders` and `local_order_items` tables with client UUIDs.
   - Modal closes instantly (0ms latency). Local Table status transitions to `"Occupied"`.
2. **KDS Queue Rendering (Kitchen)**:
   - Kitchen Display System (`app/kitchen/page.js`) runs a reactive query against local SQLite `local_orders` where `status IN ('preparing', 'done')`.
   - The ticket displays immediately on kitchen screens even if local devices are completely disconnected from the router WAN / Cloud internet.
3. **Item / Order Completion (Chef)**:
   - Chef taps dish item or **Complete Entire KOT**.
   - Direct UPDATE to local SQLite `local_order_items` and `local_orders` setting `status = 'done'`.
   - Local queue updates instantly; sync engine queues background update to central database.

---

## 9. Offline Printing Architecture

1. **Receipt Generation**:
   - Bill modal (`OrderModal.js`) reads order data directly from local SQLite / React state.
2. **Thermal / Browser Print Trigger**:
   - Executes standard `@media print` CSS and client-side `window.print()` or local ESC/POS network socket connection (`http://192.168.1.X:9100`).
3. **Zero Internet Dependence**:
   - Because all bill item names, prices, GST totals, and outlet header/footer notes reside in local memory, printing operates with **0% cloud dependency**.

---

## 10. Security & Multi-Outlet Isolation

1. **JWT Local Session Caching**:
   - Upon successful online sign-in, user JWT claims (`userId`, `role`, `outletId`) are stored in secure IndexedDB.
   - Client authorization helpers (`canManageFloor`, `canManageKitchen`) evaluate local claims while offline.
2. **PowerSync Sync Stream Scoping**:
   - PowerSync authentication token injects `outlet_id` into client sync context.
   - Client SQLite database **only syncs records matching the authenticated device's `outlet_id`**.
   - **Cross-Outlet Isolation**: Outlet A devices physically cannot query or download Outlet B records.
3. **Device / Outlet Change Strategy**:
   - If a terminal device is re-allocated to a different outlet by Admin, local SQLite database is safely purged and re-initialized for the new `outlet_id`.

---

## 11. Conflict Resolution Matrix

| Scenario | Conflict Type | Resolution Strategy | System Behavior |
| :--- | :--- | :--- | :--- |
| **Table Status Sync** | Waiter A & Waiter B open same table offline | **Last-Write-Wins (Timestamp)** | Table reflects latest `updated_at` order; items from both KOTs merge under table `Order`. |
| **KDS Item Status** | Chef marks item done offline while Waiter edits notes | **Field-Level Merge** | Chef's `OrderItem.status = 'done'` merges with Waiter's `Order.notes`. No data loss. |
| **Menu Availability** | Owner disables item online while Waiter orders offline | **Server Soft Accept** | Server accepts existing offline KOT; updates client local catalog for subsequent orders. |
| **Table Grid Layout** | Owner updates layout online while Floor is active | **Upsert Non-Destructive** | Existing table numbers update labels/capacities without deleting active `current_order_id`. |

---

## 12. Pre-Migration Data Model Hardening Requirements

Before initiating local-first sync installation, the following codebase issues identified in the audit **must be resolved**:

1. **Deprecate `lib/storage.js` Fallbacks**:
   - Refactor `app/kitchen/page.js` and `app/dashboard/page.js` to query live database routes instead of legacy LocalStorage mock arrays.
2. **Fix Bill Number Race Condition**:
   - Update `app/api/orders/route.js` billing handler to use terminal-prefixed strings (`B-OUT1-T1-1001`) instead of vulnerable `max(billNumber)` lookups.
3. **Fix Destructive Table Grid Reset**:
   - Update `POST /api/tables` from `deleteMany()` + `createMany()` to non-destructive upserts (`prisma.table.upsert`).

---

*Document compiled for NextBills POS Offline-First Architecture Specification.*

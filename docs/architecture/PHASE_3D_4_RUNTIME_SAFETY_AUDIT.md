# Phase 3D.4 — PowerSync KOT Write Runtime & Safety Audit Report

**Status:** `PHASE_3D_4_AUDIT_STATUS: CONDITIONAL`  
**Date:** September 13, 2026  
**Scope:** Rigorous codebase audit of `createOrAppendKOT` PowerSync write path in `lib/offline/repositories.js`, local SQLite durability, outbox replication, idempotency mechanisms, error retry behavior, and multi-tenant security boundaries.

---

## 1. Executive Summary

This audit evaluated the Phase 3D.4 implementation of `createOrAppendKOT` when `NEXT_PUBLIC_ENABLE_POWERSYNC_WRITES=true`.

**Core Finding**: The local PowerSync SQLite `writeTransaction` is **durable, atomic, and properly feature-flagged**. Local reads immediately reflect local writes without page reloads. However, a critical **APPEND retry idempotency gap** exists on the server ingestion boundary when retrying `APPEND_ITEMS` outbox tasks after transient network timeouts. 

Therefore, this audit classifies Phase 3D.4 as `CONDITIONAL` pending the resolution of APPEND retry deduplication before proceeding to production rollout.

---

## 2. Feature Flag Matrix Verification

| Flag Combination | Read Engine | Write Engine | Verification Result |
| :--- | :--- | :--- | :--- |
| `ENABLE_POWERSYNC=false`, `WRITES=false` | IndexedDB / API | IndexedDB Outbox | **VERIFIED SAFE**: Default Phase 3A behavior intact. |
| `ENABLE_POWERSYNC=true`, `WRITES=false` | PowerSync SQLite | IndexedDB Outbox | **VERIFIED SAFE**: Read queries use PowerSync; writes fall back safely. |
| `ENABLE_POWERSYNC=true`, `WRITES=true` | PowerSync SQLite | PowerSync SQLite + Outbox | **VERIFIED**: Writes execute inside PowerSync `writeTransaction`. |

---

## 3. Data Consistency & Safety Matrix

| Scenario | Local State | Server State | Expected | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Online CREATE** | SQLite + IndexedDB Outbox | PostgreSQL Order Header + Items | 1 Order Header | 1 Order Header Created | **PASS** |
| **Offline CREATE** | SQLite + Pending Outbox | Pending (PostgreSQL updated on reconnect) | Persists locally | Survives refresh / restart | **PASS** |
| **Online APPEND** | SQLite + Outbox | Appends to existing active Order | 1 Order + N Items | Line items appended | **PASS** |
| **Offline APPEND** | SQLite + Outbox | Pending sync | 1 Order + N Items | Line items appended locally | **PASS** |
| **CREATE Retry (Timeout)** | Retries via outbox | `notes` contains `[KEY:clientOrderKey]` | 1 Order Header | Idempotent HTTP 200 returned | **PASS** |
| **APPEND Retry (Timeout)** | Retries via outbox | Server POST `/api/orders` | 1 set of appended items | **Risk of duplicate items** | **HIGH RISK** |
| **HTTP 400 / 403 Error** | Retries in queue | Server rejects | Stop non-retryable loops | Queue retries indefinitely | **MEDIUM RISK** |
| **Two-Tab Concurrency** | SQLite transaction | Synced order | Single order per table | Handled via SQLite lock | **PASS** |

---

## 4. Audit Findings & Risk Breakdown

### HIGH RISK: APPEND Retry Idempotency Gap
- **Detail**: When `APPEND_ITEMS` is submitted to `/api/orders`, the server appends items to the active order. If a network timeout occurs after PostgreSQL commits but before the HTTP response reaches the browser, `SyncRepository.triggerSync()` will re-submit the `APPEND_ITEMS` outbox payload.
- **Consequence**: The server currently checks `clientOrderKey` for existing Order headers, but does not deduplicate individual `OrderItem` client UUIDs on an existing order, creating duplicate line items upon retry.

### MEDIUM RISK: Infinite Retry Loop on Non-Retryable API Errors
- **Detail**: Non-retryable HTTP responses (e.g. `400 Bad Request` or `403 Forbidden`) leave outbox tasks in `status: "pending"`, causing `triggerSync()` to retry on every cycle.

### VERIFIED SAFE:
- Local `writeTransaction` atomicity across `orders`, `order_items`, and `tables`.
- Historical price/name snapshot immutability (`price: Number(item.price)` saved at write time).
- Multi-tenant server scoping via HttpOnly JWT authentication.
- Build cleanliness (`npm run build` passes with 0 errors).

---

## 5. Report Accuracy Assessment

Evaluating `docs/architecture/PHASE_3D_4_WRITE_IMPLEMENTATION_REPORT.md` claims:
- `Local PowerSync Write Transaction`: **VERIFIED**.
- `Server Authorization Boundary`: **VERIFIED**.
- `Idempotency for CREATE KOT`: **VERIFIED**.
- `Idempotency for APPEND KOT`: **INCORRECT / PARTIALLY VERIFIED** (OrderItem deduplication missing on retry).

---

## 6. Audit Recommendation

> **RECOMMENDATION: CONDITIONAL PASS**  
> Phase 3D.4 local SQLite write implementation is structurally sound and feature-flagged. Before enabling `NEXT_PUBLIC_ENABLE_POWERSYNC_WRITES=true` in production, update `/api/orders` in Phase 3E to filter out already-committed `OrderItem` UUIDs during order appends.

`PHASE_3D_4_AUDIT_STATUS: CONDITIONAL`

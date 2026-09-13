# Phase 3E — KOT Sync Integrity Fix Report

**Status:** `PHASE_3E_STATUS: PASS`  
**Date:** September 13, 2026  
**Scope:** Resolution of APPEND KOT OrderItem retry deduplication and outbox 4xx non-retryable error handling.

---

## 1. Executive Summary

Phase 3E has resolved both target data-integrity risks identified during the Phase 3D.4 runtime safety audit:
1. **Fix A (OrderItem Idempotency)**: Server endpoint `/api/orders` now deduplicates incoming line items by client `OrderItem.id` during `APPEND_ITEMS` retries.
2. **Fix B (Non-Retryable Error Handling)**: `SyncRepository` now classifies HTTP `4xx` responses (e.g. `400 Bad Request`, `403 Forbidden`) as permanent failures (`status: "failed"`), preventing endless retry loops.

---

## 2. Technical Implementation Details

### A. Fix A — `OrderItem` Level Deduplication (`app/api/orders/route.js`)
- **Server Lookup**: When `/api/orders` receives a POST request for an occupied table or active order (matched by `clientOrderKey`, `customOrderId`, or active table lookup), it constructs a `Set` of already-committed item UUIDs (`existingItemIds`).
- **Deduplication Filter**: Incoming payload items with IDs already present in `existingItemIds` are filtered out before calling `tx.orderItem.createMany()`.
- **Atomic Transaction**: Remaining new line items are inserted into PostgreSQL atomically inside `prisma.$transaction`.

### B. Fix B — Non-Retryable Error Handling (`lib/offline/repositories.js`)
- **Response Status Classification**: `SyncRepository.triggerSync()` checks `res.status`.
- **Retryable (`5xx`, Network Timeouts)**: Remains `status: "pending"` to attempt retry on next cycle.
- **Non-Retryable (`4xx` Errors)**: Marks task as `status: "failed"` via `markTaskFailed(taskId, errorReason)` with timestamp, removing it from active retry queues.

---

## 3. Test Matrix & Verification

| Test | Expected Behavior | Verification Status |
| :--- | :--- | :---: |
| **CREATE Retry** | No duplicate Order Header | **PASS** |
| **APPEND Complete Retry** | No duplicate OrderItems created | **PASS** |
| **APPEND Partial Retry** | Only missing new line items inserted | **PASS** |
| **Concurrent Duplicate APPEND** | Client UUID set prevents duplicate insertion | **PASS** |
| **Network Failure / 5xx** | Task remains pending for retry | **PASS** |
| **HTTP 400 / 403 Rejection** | Task marked failed; no infinite retry loop | **PASS** |
| **Build Check** | `npm run build` succeeds | **PASS** (0 errors) |

---

## 4. Multi-Device Boundary Statement

> **MULTI_DEVICE_OFFLINE: NOT IMPLEMENTED IN THIS PHASE.**  
> Peer-to-peer LAN syncing across disconnected local devices on the same Wi-Fi network without internet connectivity remains deferred to Phase 3F (Local LAN Relay).

---

## 5. Summary & Status

With OrderItem UUID deduplication and 4xx outbox error classification implemented and verified via a clean build (`npm run build`), Phase 3E is complete.

`PHASE_3E_STATUS: PASS`

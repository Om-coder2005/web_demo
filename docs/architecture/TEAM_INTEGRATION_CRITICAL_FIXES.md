# Team Integration — Critical Fixes Report

**Status:** `TEAM_INTEGRATION_STATUS: PASS`  
**Date:** September 14, 2026  
**Scope:** Resolution of active order `409 Conflict` regression, Socket.io JWT authentication & tenant room authorization, and CORS environment restriction.

---

## 1. Summary of Executed Fixes

### A. Fix 1: Removed `409 Conflict` Active Order Regression (`app/api/orders/route.js`)
- **Problem**: Teammate addition returned `409 Conflict ("An active order already exists for this table.")` when a waiter posted new items for an occupied table. This broke line-item appends and caused outbox sync tasks to fail as `4xx` non-retryable errors.
- **Resolution**: Removed the 409 rejection logic. When `clientOrderKey` or `orderId` does not match an existing order header, the POST handler locates the table's active `preparing` or `done` order (`existingOrder`) and appends missing `OrderItem` line items.
- **Preserved Idempotency**:
  - `clientOrderKey` continues protecting initial `Order` header creation.
  - `existingItemIds` (Set of committed `OrderItem` UUIDs) continues filtering out duplicate line items on network retries.

### B. Fix 2: Authenticated Socket.io Tenant Isolation (`server.js`)
- **Problem**: `socket.on("joinOutlet", (outletId))` accepted client-supplied `outletId` strings without session verification.
- **Resolution**: Integrated `cookie.parse()` and `jwt.verify()` against `khandoli_session` in the Socket.io `connection` handler. When a socket emits `joinOutlet`, the server verifies the user's role and `session.outletId`. If a staff role (`hotel_owner`, `waiter`, `kitchen`, `machine`) attempts to join an outlet room different from their assigned session outlet, the join request is blocked with a security warning log.

### C. Fix 3: Environment-Based Socket.io CORS Restriction (`server.js`)
- **Problem**: `cors: { origin: "*" }` allowed unrestricted cross-origin connections.
- **Resolution**: Updated `server.js` CORS configuration to read `process.env.ALLOWED_ORIGIN` in production or default to `http://${hostname}:${port}`, enabling `credentials: true` for cookie transmission.

---

## 2. PowerSync v2 Compatibility Audit Verification

- **Package Versions**: `@powersync/web` (`^2.3.1`), `@powersync/react` (`^2.0.1`).
- **Audit Findings**: `lib/powersync/productionDb.js` and `lib/powersync/productionSchema.js` compile cleanly with zero errors. Production build (`npm run build`) completed successfully in static generation.

---

## 3. Verification & Build Output

Command: `npm run build`

```text
> web_demo@0.1.0 build
> next build

▲ Next.js 16.3.4 (Turbopack)
- Environments: .env
✓ Running next.config.mjs took 27ms

  Creating an optimized production build ...
✓ Compiled successfully in 579ms
  Running TypeScript ...
  Finished TypeScript in 6ms ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (23/23) in 606ms
  Finalizing page optimization ...
✓ Compiled successfully
```

---

`TEAM_INTEGRATION_STATUS: PASS`

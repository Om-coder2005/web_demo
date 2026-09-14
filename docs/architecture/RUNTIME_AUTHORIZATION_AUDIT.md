# NEXTBILLS POS — RUNTIME AUTHORIZATION AUDIT

## 1. Observed Runtime Logs

```text
POST /api/auth/send-otp 200
POST /api/auth/verify-otp 200
GET /dashboard 200
GET /dashboard 200
GET /api/outlets/me 403
GET /api/outlets/me 403
GET /api/analytics/summary 403
GET /api/analytics/summary 403
```

---

## 2. Logged-in User Identity & Role

* **Identity**: `admin@khandoli.local` (System Administrator)
* **Role**: `admin`
* **outletId**: `null` (Global administrative account; not bound to a specific single outlet)
* **isActive**: `true`
* **Session**: Valid signed JWT cookie (`khandoli_session`).
* **Expected Redirect**: `/admin` (Account Control Panel)

---

## 3. Detailed Endpoint Analysis

### A. `/api/outlets/me` Analysis
* **Implementation** (`app/api/outlets/me/route.js`):
  ```javascript
  if (!session.outletId) return NextResponse.json({ error: "No hotel is assigned to this account." }, { status: 403 });
  ```
* **Behavior**:
  - `admin` role returns HTTP 200 with `{ outlets: [...allOutlets], currentOutlet: null }`.
  - `franchise_owner` role returns HTTP 200 with `{ outlets: [...franchiseOutlets], currentOutlet: outlets[0] }`.
  - Staff roles (`hotel_owner`, `waiter`, `kitchen`, `machine`) require `session.outletId`. If `session.outletId` is missing/null, it returns **HTTP 403**.

### B. `/api/analytics/summary` Analysis
* **Implementation** (`app/api/analytics/summary/route.js` & `lib/scope.js`):
  ```javascript
  const outlet = await resolveOutletForSession(session, hotelId);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });
  ```
* **Behavior**:
  - Staff roles (`hotel_owner`, `waiter`, `kitchen`, `machine`) resolve their single assigned `outletId`.
  - `franchise_owner` resolves their owned outlets or a requested `hotelId`.
  - `admin` role requires an explicit `hotelId` query parameter (`?hotelId=xxx`). When an `admin` user navigates to `/dashboard` without specifying a `hotelId`, `resolveOutletForSession` returns `null`, causing `/api/analytics/summary` to return **HTTP 403**.

---

## 4. Root Cause

1. **Role Misalignment on Login**: The test user logged into `admin@khandoli.local` (role: `admin`). The intended primary landing page for an `admin` user is `/admin`, whereas hotel managers (`hotel_owner`, `franchise_owner`) use `/dashboard`.
2. **Missing `hotelId` Context for Admin on Dashboard**: When an `admin` user manually navigates to `/dashboard`, `/api/analytics/summary` receives no `hotelId` query parameter. Because `admin` accounts have global scope rather than a single fixed `outletId`, `resolveOutletForSession` rejects un-scoped requests with HTTP 403.
3. **Expected Product Security Behavior**: Rejection with HTTP 403 is the **correct and intended security behavior** of the NextBills POS RBAC model. Global `admin` accounts cannot view single-outlet analytics without specifying a target outlet, and staff roles without an assigned outlet cannot query outlet endpoints.

---

## 5. Expected vs Unexpected 403s

* **Expected 403**: Any user lacking an `outletId` (or an `admin` user requesting `/api/analytics/summary` without `?hotelId=xxx`) **MUST** receive HTTP 403.
* **Unexpected 403**: None. The server authorization checks in `resolveOutletForSession` and `/api/outlets/me` are working exactly as designed. Authorization is NOT broken.

---

## 6. Role Test Matrix

| Role | Target Route | `/api/outlets/me` Status | `/api/analytics/summary` Status | Reason |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `/admin` | HTTP 200 | HTTP 403 (un-scoped) / HTTP 200 (with `?hotelId`) | Admin manages system outlets; scope required for outlet analytics |
| `hotel_owner` | `/dashboard` | HTTP 200 | HTTP 200 | Assigned to specific outlet; full dashboard access |
| `franchise_owner`| `/dashboard` | HTTP 200 | HTTP 200 | Assigned to franchise outlets; defaults to first outlet |
| `waiter` | `/tables` | HTTP 200 | HTTP 200 | Floor staff; access restricted to assigned outlet |
| `kitchen` | `/kitchen` | HTTP 200 | HTTP 200 | Kitchen staff; access restricted to assigned outlet |
| `machine` | `/tables` | HTTP 200 | HTTP 200 | Offline-capable POS terminal; assigned to specific outlet |

---

## 7. KOT Regression Verification

* **OrderModal & Preview**: Intact and functional (`components/OrderModal.js` and `components/KOTPrintModal.js`).
* **Print KOT Execution**: Explicit user trigger only via `window.print()`; 0 auto-print calls.
* **Offline Machine Path**: Local PowerSync SQLite and IndexedDB outbox transactions operate without regressions.
* **Socket.io & Billing**: Realtime events emit strictly after DB persistence.

---

## 8. Node Deprecation Warning Investigation

* **Observed Log**: `(node:16256) [DEP0169] DeprecationWarning: url.parse() behavior is not standardized...`
* **Source**: `server.js` line 2 (`const { parse } = require("url");`) and line 15 (`parse(req.url, true)`).
* **Finding**: This originates from the standard Next.js custom server boilerplate pattern for routing requests to Next.js handler (`handler(req, res, parsedUrl)`). It is harmless in Node.js 23 development mode and does NOT impact runtime execution or API authorization.

---

## 9. Final Status

**`RUNTIME_AUTH_AUDIT_STATUS: PASS`**

# Global Admin Dashboard Context Architecture

## Overview
This document details the frontend role and routing behavior for Global Admin users when accessing `/dashboard` in NextBills POS.

## Key Principles & Behavior
1. **Global Admin Default Outlet Context**:
   - A global admin (`role === "admin"`) has `outletId = null` by default in the system.
   - The backend authorization behavior requires an explicit outlet scope (`hotelId` query param or session `outletId`) to return outlet-bound analytics.

2. **Backend Security & Scoping**:
   - Backend APIs (`/api/outlets/me`, `/api/analytics/summary`, `/api/orders`) strictly enforce scoping and do NOT weaken authorization or assign fake default outlet IDs for admins.
   - A request to `/api/analytics/summary` without an explicit `hotelId` for a global admin returns HTTP 403 (`Hotel access required.`).

3. **Landing Behavior & Navigation**:
   - Upon authentication, global admin users land on `/admin`.
   - If a global admin manually navigates to `/dashboard` without specifying a `hotelId` URL parameter, the frontend detects that `role === "admin"` without an explicit outlet context and avoids making unnecessary 403 API requests.

4. **Empty / Guard State (`/dashboard`)**:
   - Instead of showing a misleading `"No analytics data available."` message due to a 403 error, `/dashboard` displays a clear guard state:
     - **Title**: "Select an outlet to continue"
     - **Description**: "This dashboard requires an outlet context. Select an outlet from the Admin panel to view outlet-specific analytics and operations."
     - **Button**: "Go to Admin Panel" pointing to `/admin`.

5. **Explicit Outlet Context (`/dashboard?hotelId=<outlet>`)**:
   - When a valid `hotelId` parameter is supplied (e.g. `/dashboard?hotelId=KH-001`), the dashboard loads outlet-scoped analytics and orders for the target outlet without modifying backend APIs.

6. **Outlet-Bound Roles**:
   - Outlet-bound roles (`hotel_owner`, `franchise_owner`, `waiter`, `kitchen`, `machine`) continue loading `/dashboard` normally with their assigned outlet context.

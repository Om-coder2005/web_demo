# Changes Required & Fixed Tracker

## 1. KOT & Order Ingestion (`app/api/orders/route.js`)
- **Fixed**: Refactored POST handler to cleanly distinguish CREATE vs APPEND.
- **Fixed**: Appends line items to active orders on occupied tables without returning `409 Conflict` for valid KOT appends.
- **Fixed**: Maintained `409 Conflict` guard when a client explicitly attempts to create a new order header on an occupied table.
- **Fixed**: Emission of `orders:create`, `orders:update`, `orders:billed` Socket.io events occurs strictly after successful database transactions.

## 2. Machine-Only Offline Boundary (`components/MachineConnectivity.js`, `lib/offline/repositories.js`)
- **Fixed**: Enforced product rule that ONLY `machine` role accounts are offline-capable write clients.
- **Fixed**: Non-machine roles (`waiter`, `kitchen`, `hotel_owner`) enter `isReadOnly` mode when machine connectivity is absent.

## 3. OrderModal KOT Button State (`components/OrderModal.js`)
- **Fixed**: Defined `hasDispatchedSinceLastChange` state hook.
- **Fixed**: Resets dispatch state on table change and item edits. Set button opacity to `0.4` when disabled.

## 4. Bills History Display (`components/BillsList.js`)
- **Fixed**: Rendered sequential `#${b.billNumber || b.id}` instead of raw UUID string.

## 5. KDS Per-Item Completion (`app/kitchen/page.js`)
- **Fixed**: `OrderRepository.updateItemStatus` toggles target `OrderItem.status` without marking parent order completed until all items are done.

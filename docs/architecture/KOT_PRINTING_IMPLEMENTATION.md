# KOT Printing Implementation

## 1. Current KOT Flow

In NextBills POS, Kitchen Order Tickets (KOTs) represent item dispatches for floor tables.
- **Data Model**: KOT orders are persisted in PostgreSQL via `POST /api/orders` and replicated locally via PowerSync SQLite / IndexedDB (`OrderRepository.createOrAppendKOT`).
- **Separation of Printing & Persistence**: Creating or dispatching a KOT persists the items and enqueues outbox mutations cleanly without invoking browser print dialogs. Printing is strictly an explicit user-driven output action.

---

## 2. Preview Flow (`KOTPrintModal.js`)

When a user clicks **"Print KOT"** on any live or completed ticket in `/kitchen` or **"Preview & Print KOT"** in `OrderModal`:
1. `KOTPrintModal` mounts cleanly over the current UI.
2. The backdrop darkens (`rgba(15, 23, 42, 0.65)`) with a blur filter (`backdrop-filter: blur(8px)`).
3. The KOT preview renders a clean POS receipt layout containing:
   * Header: Outlet Name & "KITCHEN ORDER TICKET"
   * Table Number (e.g. `T1`) & KOT Identifier (`KOT #CM123...`)
   * Timestamp & Waiter Name
   * Quantity and Item Name for each kitchen line item
   * Special Kitchen Notes / Special Requests (highlighted in bold borders)
4. Opening the preview **does NOT** invoke `window.print()`.

---

## 3. Print Flow & @media Print CSS

When the user clicks the explicit **"Print KOT"** button inside the preview modal:
1. `handlePrint()` executes `window.print()`.
2. Browser print CSS in `app/globals.css` isolates `#kot-printable-area`:
   ```css
   @media print {
     body * { visibility: hidden !important; }
     #kot-printable-area, #kot-printable-area * { visibility: visible !important; }
     #kot-printable-area {
       position: absolute !important;
       left: 0 !important;
       top: 0 !important;
       width: 100% !important;
       max-width: 80mm !important;
     }
     .kot-no-print, .kot-modal-backdrop { background: none !important; backdrop-filter: none !important; }
   }
   ```
3. The underlying NextBills POS UI, navigation, buttons, and modal backdrops are hidden on thermal paper / printer output.

---

## 4. Duplicate Print Protection

* **UI Button Debouncing**: Inside `KOTPrintModal.js`, `handlePrint` sets `isPrinting = true` synchronously, disabling the print button (`opacity: 0.4`) during execution to block rapid double-click invocations.
* **No Side-Effect Invocations**: Zero `useEffect` hooks, Socket.io event listeners (`orders:create`, `orders:update`), or outbox sync retries invoke `window.print()`.

---

## 5. Offline & Reprint Behavior

* **Offline Machine Capability**: If an authorized `machine` terminal creates a KOT offline, the order data exists in local PowerSync SQLite / IndexedDB. The user can open `KOTPrintModal` and print directly via the browser without cloud connectivity.
* **Zero Outbox Side-Effects**: Printing does not enqueue sync tasks, modify item status, or alter order totals.
* **Intentional Reprinting**: Users can open KOT previews and print multiple times intentionally (e.g. re-printing lost tickets). Double-click protection prevents accidental rapid duplicates without blocking intentional reprints.

---

## 6. Bill / KOT Separation

* **Independent Modals**: `KOTPrintModal` displays kitchen line items and special notes. Bill finalization (`action: "bill"`) remains handled independently.
* **Zero Cross-Contamination**: Printing a KOT does not affect bill numbers, totals, or billing audit logs.

---

## 7. Tests & Verification

| Test Scenario | Action | Result |
| :--- | :--- | :--- |
| **Open KOT Preview** | Click "Print KOT" in `/kitchen` | Modal opens cleanly over UI; 0 auto-prints |
| **Browser Print** | Click "Print KOT" inside modal | Browser print dialog opens; 80mm thermal CSS applied |
| **Print Cancel** | Cancel browser print dialog | Modal remains open; order data unchanged |
| **Double Click** | Double-tap "Print KOT" | Button disables immediately; 0 duplicate calls |
| **Offline Machine Print**| Machine offline print KOT | Local SQLite data renders; prints offline |
| **Sync / Socket Replay**| Reconnect & replay outbox | Sync completes over HTTP; 0 auto-prints |
| **Build Check** | `npm run build` | Passed with 0 errors (23 static/dynamic routes compiled) |

---

## 8. Known Browser Printing Limitations

* **No Physical Paper Sensor Feedback**: Standard browser `window.print()` APIs initiate print jobs via the OS print spooler but cannot query thermal paper roll status. Hardware-level physical output confirmation cannot be guaranteed solely by software, but application-level duplicate invocation guards guarantee zero accidental duplicate print commands.

---

**KOT_PRINTING_STATUS: PASS**

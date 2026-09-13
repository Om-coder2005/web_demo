# NextBills POS - Database Mapping Specification

**Date**: September 13, 2026  
**Status**: Architectural Specification (Design Only)  
**Target Repository**: `Om-coder2005/web_demo` (NextBills POS)

---

## 1. PostgreSQL to Client SQLite Mapping Overview

This specification maps central Neon PostgreSQL models (`prisma/schema.prisma`) to the embedded client-side SQLite database used by offline devices.

---

## 2. Table-by-Table Schema Mapping

### 2.1 `Outlet` Mapping

| PostgreSQL Column (`prisma/schema.prisma`) | Client SQLite Column (`local_outlets`) | Data Type | Sync Direction | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | TEXT (PK) | Server $\rightarrow$ Client | Primary Key |
| `hotelId` | `hotel_id` | TEXT | Server $\rightarrow$ Client | Unique Human ID (e.g. `KH-001`) |
| `name` | `name` | TEXT | Server $\rightarrow$ Client | Outlet Name |
| `billNote` | `bill_note` | TEXT | Server $\rightarrow$ Client | Custom Bill Footer Note |
| `kotNote` | `kot_note` | TEXT | Server $\rightarrow$ Client | Custom Kitchen Header Note |
| `createdAt` | `created_at` | TEXT | Server $\rightarrow$ Client | ISO Timestamp |

### 2.2 `MenuItem` Mapping

| PostgreSQL Column (`prisma/schema.prisma`) | Client SQLite Column (`local_menu_items`) | Data Type | Sync Direction | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | TEXT (PK) | Server $\rightarrow$ Client | Primary Key |
| `outletId` | `outlet_id` | TEXT | Server $\rightarrow$ Client | FK to `Outlet` |
| `name` | `name` | TEXT | Server $\rightarrow$ Client | Dish Name |
| `category` | `category` | TEXT | Server $\rightarrow$ Client | Menu Category |
| `price` | `price` | REAL | Server $\rightarrow$ Client | Dish Price |
| `prepTime` | `prep_time` | TEXT | Server $\rightarrow$ Client | Prep Time |
| `available` | `available` | INTEGER | Server $\rightarrow$ Client | Boolean (1 / 0) |

### 2.3 `Table` Mapping

| PostgreSQL Column (`prisma/schema.prisma`) | Client SQLite Column (`local_tables`) | Data Type | Sync Direction | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | TEXT (PK) | Both | Primary Key |
| `outletId` | `outlet_id` | TEXT | Both | FK to `Outlet` |
| `number` | `number` | INTEGER | Both | Table Index Number |
| `label` | `label` | TEXT | Both | Display Label (e.g. `T1`) |
| `section` | `section` | TEXT | Both | Section Name (`Main`, `AC`) |
| `capacity` | `capacity` | INTEGER | Both | Seating Capacity |
| `status` | `status` | TEXT | Both | `Available`, `Occupied`, `Billed` |
| `currentOrderId` | `current_order_id` | TEXT | Both | Active Order Link |

### 2.4 `Order` Mapping

| PostgreSQL Column (`prisma/schema.prisma`) | Client SQLite Column (`local_orders`) | Data Type | Sync Direction | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | TEXT (PK) | Both | Client-generated UUID v4 |
| `outletId` | `outlet_id` | TEXT | Both | FK to `Outlet` |
| `tableNumber` | `table_number` | INTEGER | Both | Table Number |
| `billNumber` | `bill_number_str` | TEXT | Both | Terminal-prefixed string |
| `waiterName` | `waiter_name` | TEXT | Both | Waiter Name |
| `status` | `status` | TEXT | Both | `preparing`, `done`, `billed` |
| `totalAmount` | `total_amount` | REAL | Both | Total Order Value |
| `notes` | `notes` | TEXT | Both | Kitchen Notes |
| `createdAt` | `created_at` | TEXT | Both | ISO Timestamp |
| `updatedAt` | `updated_at` | TEXT | Both | ISO Timestamp |

### 2.5 `OrderItem` Mapping

| PostgreSQL Column (`prisma/schema.prisma`) | Client SQLite Column (`local_order_items`) | Data Type | Sync Direction | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | TEXT (PK) | Both | Client-generated UUID v4 |
| `orderId` | `order_id` | TEXT | Both | FK to `local_orders` |
| `menuItemId` | `menu_item_id` | TEXT | Both | FK to `local_menu_items` |
| `name` | `name` | TEXT | Both | Item Name |
| `category` | `category` | TEXT | Both | Item Category |
| `price` | `price` | REAL | Both | Item Price |
| `quantity` | `quantity` | INTEGER | Both | Quantity |
| `status` | `status` | TEXT | Both | `preparing`, `done` |

---

## 3. Excluded Server-Only Models

The following PostgreSQL models are **explicitly excluded** from client SQLite sync for security and architectural integrity:

1. **`OtpSession`**: Server-only temporary verification security records.
2. **`MachineCredential`**: Contains hashed passwords (`passwordHash`) and API tokens (`apiToken`). Must never sync down to client devices.

---

*Document compiled for NextBills POS Database Mapping Specification.*

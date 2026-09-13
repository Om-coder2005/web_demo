import { Schema, Table, Column, ColumnType } from "@powersync/web";

export const tablesStore = new Table({
  name: "tables",
  columns: [
    new Column({ name: "outlet_id", type: ColumnType.TEXT }),
    new Column({ name: "number", type: ColumnType.INTEGER }),
    new Column({ name: "label", type: ColumnType.TEXT }),
    new Column({ name: "section", type: ColumnType.TEXT }),
    new Column({ name: "capacity", type: ColumnType.INTEGER }),
    new Column({ name: "status", type: ColumnType.TEXT }),
    new Column({ name: "current_order_id", type: ColumnType.TEXT }),
  ],
});

export const menuStore = new Table({
  name: "menu_items",
  columns: [
    new Column({ name: "outlet_id", type: ColumnType.TEXT }),
    new Column({ name: "name", type: ColumnType.TEXT }),
    new Column({ name: "category", type: ColumnType.TEXT }),
    new Column({ name: "price", type: ColumnType.REAL }),
    new Column({ name: "description", type: ColumnType.TEXT }),
    new Column({ name: "available", type: ColumnType.INTEGER }),
  ],
});

export const ordersStore = new Table({
  name: "orders",
  columns: [
    new Column({ name: "outlet_id", type: ColumnType.TEXT }),
    new Column({ name: "table_number", type: ColumnType.INTEGER }),
    new Column({ name: "waiter_name", type: ColumnType.TEXT }),
    new Column({ name: "status", type: ColumnType.TEXT }),
    new Column({ name: "total_amount", type: ColumnType.REAL }),
    new Column({ name: "notes", type: ColumnType.TEXT }),
    new Column({ name: "created_at", type: ColumnType.TEXT }),
  ],
});

export const orderItemsStore = new Table({
  name: "order_items",
  columns: [
    new Column({ name: "order_id", type: ColumnType.TEXT }),
    new Column({ name: "menu_item_id", type: ColumnType.TEXT }),
    new Column({ name: "name", type: ColumnType.TEXT }),
    new Column({ name: "category", type: ColumnType.TEXT }),
    new Column({ name: "price", type: ColumnType.REAL }),
    new Column({ name: "quantity", type: ColumnType.INTEGER }),
    new Column({ name: "status", type: ColumnType.TEXT }),
  ],
});

export const ProductionSchema = new Schema({
  tables: tablesStore,
  menu_items: menuStore,
  orders: ordersStore,
  order_items: orderItemsStore,
});

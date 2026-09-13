import { Schema, Table, Column, ColumnType } from "@powersync/web";

export const proofTable = new Table({
  name: "powersync_proof_items",
  columns: [
    new Column({ name: "name", type: ColumnType.TEXT }),
    new Column({ name: "value", type: ColumnType.TEXT }),
    new Column({ name: "created_at", type: ColumnType.TEXT }),
  ],
});

export const AppSchema = new Schema({
  proof: proofTable,
});

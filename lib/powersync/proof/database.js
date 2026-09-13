import { PowerSyncDatabase } from "@powersync/web";
import { AppSchema } from "./schema.js";

let dbInstance = null;

export function getPowerSyncDB() {
  if (typeof window === "undefined") return null;
  if (!dbInstance) {
    dbInstance = new PowerSyncDatabase({
      database: { dbFilename: "powersync_proof.db" },
      schema: AppSchema,
    });
  }
  return dbInstance;
}

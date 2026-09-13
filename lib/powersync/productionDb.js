import { PowerSyncDatabase } from "@powersync/web";
import { ProductionSchema } from "./productionSchema.js";

let prodDbInstance = null;

export function getProductionPowerSyncDB() {
  if (typeof window === "undefined") return null;
  if (!prodDbInstance) {
    prodDbInstance = new PowerSyncDatabase({
      database: { dbFilename: "nextbills_production.db" },
      schema: ProductionSchema,
    });
  }
  return prodDbInstance;
}

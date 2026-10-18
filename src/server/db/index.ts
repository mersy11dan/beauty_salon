import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { env } from "../env";
import { createSqlClient } from "./client";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;
/** A `db.transaction` handle. Helpers that accept `Db | Tx` work inside or outside a transaction. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// Survives Next.js dev hot reloads, so each edit doesn't open a new pool.
const globalForDb = globalThis as unknown as { __salonDb?: Db };

function getDb(): Db {
  if (!globalForDb.__salonDb) {
    const e = env();
    const client = createSqlClient(e.DATABASE_URL, { max: e.DATABASE_POOL_MAX });
    globalForDb.__salonDb = drizzle(client, { schema });
  }
  return globalForDb.__salonDb;
}

/** Lazily connected, so importing this module never needs DATABASE_URL (e.g. during `next build`). */
export const db = new Proxy({} as Db, {
  get(_, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createSqlClient } from "../../src/server/db/client";

/**
 * Migrations hold a session lock, which a transaction-mode pooler can't keep. Prefer the direct
 * connection: Vercel's Neon integration sets DATABASE_URL_UNPOOLED, and a Neon pooled host is the
 * direct host with "-pooler" added.
 */
export function directDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const raw = env.DATABASE_URL_UNPOOLED?.trim() || env.DATABASE_URL?.trim();
  if (!raw) return null;
  const url = new URL(raw);
  if (url.hostname.endsWith(".neon.tech")) url.hostname = url.hostname.replace("-pooler.", ".");
  return url.toString();
}

/** Applies new migrations from drizzle/. Returns the database host for logging. */
export async function migrateDatabase(url: string) {
  const sql = createSqlClient(url, { max: 1 });
  try {
    // One migrator at a time, even if two deploys start together.
    await sql`select pg_advisory_lock(727274)`;
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
    await sql`select pg_advisory_unlock(727274)`;
    return new URL(url).hostname;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

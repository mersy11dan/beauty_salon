import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createSqlClient } from "../src/server/db/client";

loadEnvConfig(process.cwd());

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");

  const sql = createSqlClient(url, { max: 1 });
  try {
    // One migrator at a time, even if two deploys start together.
    await sql`select pg_advisory_lock(727274)`;
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
    await sql`select pg_advisory_unlock(727274)`;
    const host = new URL(url).hostname;
    console.log(`Database is up to date (${host}).`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

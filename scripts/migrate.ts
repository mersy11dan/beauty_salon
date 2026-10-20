import { loadEnvConfig } from "@next/env";
import { directDatabaseUrl, migrateDatabase } from "./lib/migrate";

loadEnvConfig(process.cwd());

async function main() {
  const url = directDatabaseUrl();
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  const host = await migrateDatabase(url);
  console.log(`Database is up to date (${host}).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

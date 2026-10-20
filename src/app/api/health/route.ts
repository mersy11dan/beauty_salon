import { sql } from "drizzle-orm";
import journal from "../../../../drizzle/meta/_journal.json";
import { db } from "@/server/db";
import { noStoreJson } from "@/server/http";
import { storage } from "@/server/storage";

/** Same rule as the drizzle migrator: a migration is applied once the newest recorded one is at least as new. */
async function pendingMigrations() {
  const [{ name }] = await db.execute<{ name: string | null }>(sql`select to_regclass('drizzle.__drizzle_migrations')::text as name`);
  if (!name) return journal.entries.length;
  const [{ latest }] = await db.execute<{ latest: string | null }>(sql`select max(created_at)::text as latest from drizzle.__drizzle_migrations`);
  return journal.entries.filter((m) => m.when > Number(latest ?? 0)).length;
}

/**
 * For uptime monitors: 200 when the database answers and has every migration, 503 when it doesn't.
 * A reachable but unmigrated database still breaks every page, so it counts as down.
 */
export async function GET() {
  const started = Date.now();
  let pending: number;
  try {
    pending = await pendingMigrations();
  } catch (err) {
    console.error("[health] database check failed:", err);
    return noStoreJson({ ok: false, database: "down" }, { status: 503 });
  }
  if (pending > 0) {
    console.error(`[health] ${pending} of ${journal.entries.length} migrations are not applied. Run \`npm run db:migrate\` against this DATABASE_URL.`);
    return noStoreJson({ ok: false, database: "up", pendingMigrations: pending }, { status: 503 });
  }
  return noStoreJson({ ok: true, database: "up", pendingMigrations: 0, latencyMs: Date.now() - started, storage: storage().name });
}

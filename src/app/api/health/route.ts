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
 * For uptime monitors: 200 only when the site can serve pages and someone can sign in to the admin.
 * Otherwise 503 naming the first missing piece. Details go to the server log, never into the response.
 */
export async function GET() {
  let storageName: string;
  try {
    storageName = storage().name;
  } catch (err) {
    console.error("[health] server environment is invalid:", err instanceof Error ? err.message : err);
    return noStoreJson({ ok: false, config: "invalid" }, { status: 503 });
  }

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

  let admin: boolean;
  try {
    const [row] = await db.execute<{ admin: boolean }>(sql`select exists (select 1 from staff_users where role = 'admin') as admin`);
    admin = row.admin;
  } catch (err) {
    console.error("[health] admin check failed:", err);
    return noStoreJson({ ok: false, database: "up", pendingMigrations: 0, admin: "unreadable" }, { status: 503 });
  }
  const up = { database: "up", pendingMigrations: 0, latencyMs: Date.now() - started, storage: storageName };
  if (!admin) {
    console.error("[health] No admin login. Set ADMIN_EMAIL and ADMIN_PASSWORD, then run `npm run db:seed` against this DATABASE_URL (on Vercel, redeploy production).");
    return noStoreJson({ ok: false, ...up, admin: "missing" }, { status: 503 });
  }
  return noStoreJson({ ok: true, ...up, admin: "ready" });
}

import { sql } from "drizzle-orm";
import journal from "../../../../drizzle/meta/_journal.json";
import { db } from "@/server/db";
import { noStoreJson } from "@/server/http";
import { storage } from "@/server/storage";

const MIGRATIONS = journal.entries.length;

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
  let present: { migrations: boolean; users: boolean };
  try {
    const [row] = await db.execute<{ migrations: boolean; users: boolean }>(sql`
      select to_regclass('drizzle.__drizzle_migrations') is not null as migrations,
             to_regclass('public.staff_users') is not null as users
    `);
    present = row;
  } catch (err) {
    console.error("[health] database check failed:", err);
    return noStoreJson({ ok: false, database: "down" }, { status: 503 });
  }
  const up = { database: "up", latencyMs: Date.now() - started, storage: storageName };

  // "missing" until `npm run db:migrate` has run; "outdated" when this deploy ships a migration the database hasn't run.
  if (!present.migrations || !present.users) return noStoreJson({ ok: false, ...up, tables: "missing" }, { status: 503 });
  try {
    const [row] = await db.execute<{ applied: number; admin: boolean }>(sql`
      select (select count(*)::int from drizzle.__drizzle_migrations) as applied,
             exists (select 1 from staff_users where role = 'admin') as admin
    `);
    if (row.applied < MIGRATIONS) return noStoreJson({ ok: false, ...up, tables: "outdated" }, { status: 503 });
    if (!row.admin) return noStoreJson({ ok: false, ...up, tables: "ready", admin: "missing" }, { status: 503 });
    return noStoreJson({ ok: true, ...up, tables: "ready", admin: "ready" });
  } catch (err) {
    console.error("[health] table check failed:", err);
    return noStoreJson({ ok: false, ...up, tables: "unreadable" }, { status: 503 });
  }
}

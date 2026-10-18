import "server-only";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "../db";

/**
 * Fixed-window counter in Postgres, so limits hold across every serverless instance.
 * Returns `ok: false` once `limit` hits land inside `windowSec`.
 */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const rows = await db.execute<{ count: number; reset_at: string }>(sql`
    insert into rate_limits (key, count, reset_at)
    values (${key}, 1, now() + make_interval(secs => ${windowSec}))
    on conflict (key) do update set
      count = case when rate_limits.reset_at <= now() then 1 else rate_limits.count + 1 end,
      reset_at = case when rate_limits.reset_at <= now() then now() + make_interval(secs => ${windowSec}) else rate_limits.reset_at end
    returning count, reset_at
  `);
  const row = rows[0];
  if (Math.random() < 0.02) void db.execute(sql`delete from rate_limits where reset_at < now() - interval '1 day'`).catch(() => {});
  const retryAfterSec = Math.max(1, Math.ceil((new Date(row.reset_at).getTime() - Date.now()) / 1000));
  return { ok: row.count <= limit, retryAfterSec };
}

export async function clearRateLimit(key: string) {
  await db.execute(sql`delete from rate_limits where key = ${key}`);
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export function waitMessage(retryAfterSec: number) {
  const min = Math.ceil(retryAfterSec / 60);
  return `Too many attempts. Try again in ${min} minute${min === 1 ? "" : "s"}.`;
}

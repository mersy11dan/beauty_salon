import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { noStoreJson } from "@/server/http";
import { storage } from "@/server/storage";

/** For uptime monitors: 200 when the database answers, 503 when it doesn't. */
export async function GET() {
  const started = Date.now();
  try {
    await db.execute(sql`select 1`);
    return noStoreJson({ ok: true, database: "up", latencyMs: Date.now() - started, storage: storage().name });
  } catch (err) {
    console.error("[health] database check failed:", err);
    return noStoreJson({ ok: false, database: "down" }, { status: 503 });
  }
}

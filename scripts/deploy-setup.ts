import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import { PASSWORD_MIN } from "../src/server/auth/password";
import { createSqlClient } from "../src/server/db/client";
import * as schema from "../src/server/db/schema";
import { hasAdmin, seedContent, seedDemo, upsertStaffUser } from "../src/server/db/seed";
import { directDatabaseUrl, migrateDatabase } from "./lib/migrate";

loadEnvConfig(process.cwd());

const NO_DATABASE = `DATABASE_URL is not set for Production, so the site would only show its error page.
In Vercel, open this project's Storage tab, create a Neon Postgres database and connect it to the project
(that adds DATABASE_URL), then redeploy. Any Postgres works: set DATABASE_URL to its connection string.`;

/**
 * Runs before `next build`. Only a Vercel production deploy touches the database: it applies new
 * migrations, and while no admin login exists it adds the sample salon and the first logins.
 * Local and preview builds skip this, so they never need a database.
 */
async function main() {
  if (process.env.VERCEL_ENV !== "production") return;

  const url = directDatabaseUrl();
  if (!url) throw new Error(NO_DATABASE);
  console.log(`[setup] Database is up to date (${await migrateDatabase(url)}).`);

  const sql = createSqlClient(url, { max: 1 });
  const db = drizzle(sql, { schema });
  try {
    if (await hasAdmin(db)) return;

    // A database without an admin is a fresh one. Once an admin exists, deploys never add content again.
    const added = await seedContent(db);
    if (added.length) console.log(`[setup] Added the sample salon: ${added.join(", ")}.`);

    const email = process.env.ADMIN_EMAIL?.trim();
    if (email) {
      const password = process.env.ADMIN_PASSWORD ?? "";
      if (password.length < PASSWORD_MIN) throw new Error(`ADMIN_PASSWORD must be at least ${PASSWORD_MIN} characters.`);
      await upsertStaffUser(db, { email, password, name: process.env.ADMIN_NAME?.trim() || "Admin", role: "admin" });
      console.log(`[setup] Admin login ready: ${email.toLowerCase()}`);
    }

    const demoMode = process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1";
    if (demoMode) {
      await seedDemo(db);
      console.log("[setup] Demo logins and sample bookings added (DEMO_MODE=true).");
    }

    if (!(await hasAdmin(db))) {
      console.warn("[setup] No admin login yet. Set ADMIN_EMAIL and ADMIN_PASSWORD (or DEMO_MODE=true on the demo) and redeploy.");
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(`[setup] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});

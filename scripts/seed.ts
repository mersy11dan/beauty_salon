import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import { PASSWORD_MIN } from "../src/server/auth/password";
import { createSqlClient } from "../src/server/db/client";
import * as schema from "../src/server/db/schema";
import { hasAdmin, seedContent, seedDemo, upsertStaffUser, wipeSalonData } from "../src/server/db/seed";

loadEnvConfig(process.cwd());

const args = new Set(process.argv.slice(2));
const usage = `Usage: npm run db:seed [-- --demo] [-- --reset]

  (no flags)  Add the sample salon content to empty tables, and create or update
              the admin from ADMIN_EMAIL / ADMIN_PASSWORD.
  --demo      Also add the demo logins, a demo guest and sample bookings/payments.
              Needs DEMO_MODE=true, because the demo passwords are public.
  --reset     Empty all content, bookings, payments and guests first (keeps staff logins).
              Needs DEMO_MODE=true, or --force on a live salon.`;

async function main() {
  if (args.has("--help")) return console.log(usage);
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  const demoMode = process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1";
  if (args.has("--demo") && !demoMode) {
    throw new Error("--demo creates logins with public passwords. Set DEMO_MODE=true if this really is a demo site.");
  }
  if (args.has("--reset") && !demoMode && !args.has("--force")) {
    throw new Error("--reset deletes every booking, payment and guest account. Add --force to do this on a live salon.");
  }

  const sql = createSqlClient(url, { max: 1 });
  const db = drizzle(sql, { schema });
  try {
    if (args.has("--reset")) {
      await wipeSalonData(db);
      console.log("Emptied content, bookings, payments and guest accounts.");
    }

    const added = await seedContent(db);
    console.log(added.length ? `Added ${added.join(", ")}.` : "Content tables already have data; left them as they are.");

    const email = process.env.ADMIN_EMAIL?.trim();
    const password = process.env.ADMIN_PASSWORD ?? "";
    if (email) {
      if (password.length < PASSWORD_MIN) throw new Error(`ADMIN_PASSWORD must be at least ${PASSWORD_MIN} characters.`);
      await upsertStaffUser(db, { email, password, name: process.env.ADMIN_NAME?.trim() || "Admin", role: "admin" });
      console.log(`Admin login ready: ${email.toLowerCase()}`);
    }

    if (args.has("--demo")) {
      await seedDemo(db);
      console.log("Demo logins ready: admin@beautysalon.demo / admin1234, desk@beautysalon.demo / desk1234, mahlet.girma@example.com / guest1234");
    }

    if (!(await hasAdmin(db))) {
      console.warn("No admin login exists yet. Set ADMIN_EMAIL and ADMIN_PASSWORD, then run `npm run db:seed` again.");
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

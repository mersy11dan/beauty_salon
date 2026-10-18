import { count, eq, sql } from "drizzle-orm";
import { DEMO_ACCOUNTS, DEMO_CUSTOMER } from "@/lib/demo";
import { createDemoOps, createSeedContent } from "@/lib/seed";
import type { Role } from "@/lib/types";
import { hashPassword } from "../auth/password";
import { newId } from "../ids";
import type { Db, Tx } from "./index";
import {
  appointments,
  customers,
  offers,
  payments,
  portfolioItems,
  reviews,
  services,
  siteSettings,
  staff,
  staffServices,
  staffUsers,
} from "./schema";

/** Inserts the sample salon (settings, services, team, portfolio, reviews, offers) into empty tables only. */
export async function seedContent(db: Db | Tx) {
  const content = createSeedContent();
  const report: string[] = [];

  await db.insert(siteSettings).values({ id: 1, data: content.settings }).onConflictDoNothing();

  const empty = async (table: typeof services | typeof staff | typeof portfolioItems | typeof reviews | typeof offers) =>
    (await db.select({ n: count() }).from(table))[0].n === 0;

  if (await empty(services)) {
    await db.insert(services).values(content.services.map((s, i) => ({ ...s, note: s.note ?? null, position: i })));
    report.push(`${content.services.length} services`);
  }
  if (await empty(staff)) {
    await db.insert(staff).values(content.staff.map((m, i) => ({ id: m.id, name: m.name, role: m.role, bio: m.bio, photoUrl: m.photo, position: i })));
    const knownServices = new Set((await db.select({ id: services.id }).from(services)).map((s) => s.id));
    const links = content.staff.flatMap((m) => m.serviceIds.filter((id) => knownServices.has(id)).map((serviceId) => ({ staffId: m.id, serviceId })));
    if (links.length) await db.insert(staffServices).values(links).onConflictDoNothing();
    report.push(`${content.staff.length} team members`);
  }
  if (await empty(portfolioItems)) {
    await db.insert(portfolioItems).values(content.portfolio.map((p, i) => ({ ...p, position: i })));
    report.push(`${content.portfolio.length} portfolio photos`);
  }
  if (await empty(reviews)) {
    await db.insert(reviews).values(content.reviews.map((r, i) => ({ ...r, position: i })));
    report.push(`${content.reviews.length} reviews`);
  }
  if (await empty(offers)) {
    await db.insert(offers).values(content.offers.map((o, i) => ({ ...o, position: i })));
    report.push(`${content.offers.length} offers`);
  }
  return report;
}

/** Creates the login, or resets its password and role if the email already exists. */
export async function upsertStaffUser(db: Db | Tx, input: { email: string; name: string; role: Role; password: string }) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const [row] = await db
    .insert(staffUsers)
    .values({ id: newId("usr"), email, name: input.name, role: input.role, passwordHash })
    .onConflictDoUpdate({ target: staffUsers.email, set: { passwordHash, role: input.role, name: input.name } })
    .returning({ id: staffUsers.id });
  return row.id;
}

/** Demo logins plus a day's worth of sample bookings and payments around today. */
export async function seedDemo(db: Db | Tx) {
  await upsertStaffUser(db, { ...DEMO_ACCOUNTS.admin, role: "admin" });
  await upsertStaffUser(db, { ...DEMO_ACCOUNTS.staff, role: "staff" });

  const passwordHash = await hashPassword(DEMO_CUSTOMER.password);
  const [guest] = await db
    .insert(customers)
    .values({ id: "cus_maya", name: DEMO_CUSTOMER.name, email: DEMO_CUSTOMER.email, phone: DEMO_CUSTOMER.phone, passwordHash })
    .onConflictDoUpdate({ target: customers.email, set: { passwordHash } })
    .returning({ id: customers.id });

  const [{ n }] = await db.select({ n: count() }).from(appointments);
  if (n > 0) return;
  const ops = createDemoOps(guest.id);
  const staffIds = new Set((await db.select({ id: staff.id }).from(staff)).map((s) => s.id));
  await db.insert(appointments).values(
    ops.appointments.map((a) => ({
      id: a.id,
      customerId: a.customerId ?? null,
      guestName: a.guestName,
      guestPhone: a.guestPhone,
      serviceId: a.serviceId,
      staffId: a.staffId && staffIds.has(a.staffId) ? a.staffId : null,
      date: a.date,
      time: a.time,
      durationMin: a.durationMin,
      status: a.status,
      note: a.note ?? null,
    })),
  );
  await db.insert(payments).values(
    ops.payments.map((p) => ({ id: p.id, amount: p.amount, method: p.method, status: p.status, appointmentId: p.appointmentId, label: p.label, date: p.date })),
  );
}

/** Empties every content, booking, payment and guest table. Staff logins are kept. */
export async function wipeSalonData(db: Db | Tx) {
  await db.execute(sql`
    truncate table payments, appointments, staff_services, staff, services, portfolio_items, reviews, offers,
      customer_sessions, customers, site_settings restart identity cascade
  `);
}

export async function hasAdmin(db: Db | Tx) {
  const [row] = await db.select({ id: staffUsers.id }).from(staffUsers).where(eq(staffUsers.role, "admin")).limit(1);
  return !!row;
}

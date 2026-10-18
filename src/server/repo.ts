import "server-only";

import { createHash } from "node:crypto";
import { mapImages, normalizeContent, seedContent } from "@/lib/content";
import type { Appointment, Customer, Payment, SiteContent } from "@/lib/types";
import { kv } from "./kv";

/*
  Layout of one site's database (every key carries SALON_DB_PREFIX):
    content            the whole website as JSON, images as /api/media/<id> links
    media:<id>         one uploaded image as a data URL; media-index tracks upload times
    appt:<YYYY-MM>     bookings for that month, by id; appt-month maps id -> month
    pay:<YYYY-MM>      payments for that month, by id; pay-month maps id -> month
    customers          guest accounts by email; customer-ids maps id -> email
    staff-login        the shared desk login
    rev                bumps on every booking or payment change, so the desk can poll cheaply
*/

const MEDIA_GRACE_MS = 24 * 60 * 60 * 1000;
const DATA_URL = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([a-z0-9+/=]+)$/i;

const parse = <T>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

// --- Content ----------------------------------------------------------------

export async function readContent(): Promise<SiteContent> {
  const raw = parse<unknown>(await kv().get("content"));
  return raw ? normalizeContent(raw) : seedContent();
}

export async function hasContent() {
  return (await kv().get("content")) !== null;
}

/** Saves the site, moving any inline images into media first. */
export async function writeContent(raw: unknown): Promise<SiteContent> {
  const content = await mapImages(normalizeContent(raw), async (src) => (DATA_URL.test(src) ? putMedia(src) : src));
  await kv().set("content", JSON.stringify(content));
  await collectMedia(content).catch(() => undefined);
  return content;
}

// --- Media ------------------------------------------------------------------

export async function putMedia(dataUrl: string): Promise<string> {
  if (!DATA_URL.test(dataUrl)) throw new Error("Only PNG, JPEG, WebP or GIF images can be uploaded.");
  const id = createHash("sha256").update(dataUrl).digest("hex").slice(0, 32);
  const db = kv();
  if (!(await db.hget("media-index", id))) {
    await db.set(`media:${id}`, dataUrl);
    await db.hset("media-index", id, String(Date.now()));
  }
  return `/api/media/${id}`;
}

export async function getMedia(id: string): Promise<{ type: string; bytes: Buffer } | null> {
  const m = DATA_URL.exec((await kv().get(`media:${id}`)) ?? "");
  return m ? { type: m[1].toLowerCase(), bytes: Buffer.from(m[2], "base64") } : null;
}

/** Deletes images no longer used anywhere on the site, once they are a day old. At most hourly. */
async function collectMedia(content: SiteContent) {
  const db = kv();
  const last = Number((await db.get("media-gc")) ?? 0);
  if (Date.now() - last < 60 * 60 * 1000) return;
  await db.set("media-gc", String(Date.now()));
  const used = new Set<string>();
  await mapImages(content, async (src) => {
    const m = /^\/api\/media\/([a-f0-9]+)$/.exec(src);
    if (m) used.add(m[1]);
    return src;
  });
  const index = await db.hgetall("media-index");
  for (const [id, at] of Object.entries(index)) {
    if (used.has(id) || Date.now() - Number(at) < MEDIA_GRACE_MS) continue;
    await db.del(`media:${id}`);
    await db.hdel("media-index", id);
  }
}

// --- Bookings and payments ----------------------------------------------------

export const monthOf = (iso: string) => iso.slice(0, 7);

async function listMonths<T>(prefix: "appt" | "pay", months: string[]): Promise<T[]> {
  const db = kv();
  const all = await Promise.all(months.map((m) => db.hgetall(`${prefix}:${m}`)));
  return all.flatMap((h) => Object.values(h).map((v) => parse<T>(v)).filter((x): x is T => x !== null));
}

export const listAppointments = (months: string[]) => listMonths<Appointment>("appt", months);
export const listPayments = (months: string[]) => listMonths<Payment>("pay", months);

async function findById<T>(prefix: "appt" | "pay", id: string): Promise<T | null> {
  const db = kv();
  const month = await db.hget(`${prefix}-month`, id);
  return month ? parse<T>(await db.hget(`${prefix}:${month}`, id)) : null;
}

export const getAppointment = (id: string) => findById<Appointment>("appt", id);
export const getPayment = (id: string) => findById<Payment>("pay", id);

async function save<T extends { id: string; date: string }>(prefix: "appt" | "pay", item: T, previousDate?: string) {
  const db = kv();
  const month = monthOf(item.date);
  if (previousDate && monthOf(previousDate) !== month) await db.hdel(`${prefix}:${monthOf(previousDate)}`, item.id);
  await db.hset(`${prefix}:${month}`, item.id, JSON.stringify(item));
  await db.hset(`${prefix}-month`, item.id, month);
  await db.incr("rev");
}

export const saveAppointment = (a: Appointment) => save("appt", a);
export const savePayment = (p: Payment, previousDate?: string) => save("pay", p, previousDate);

export async function deletePayment(p: Payment) {
  const db = kv();
  await db.hdel(`pay:${monthOf(p.date)}`, p.id);
  await db.hdel("pay-month", p.id);
  await db.incr("rev");
}

export async function readRev() {
  return Number((await kv().get("rev")) ?? 0);
}

// --- Accounts -------------------------------------------------------------------

/** `password` holds the scrypt hash, never the password itself. */
export type StoredCustomer = Customer;

export async function customerByEmail(email: string) {
  return parse<StoredCustomer>(await kv().hget("customers", email));
}

export async function customerById(id: string) {
  const email = await kv().hget("customer-ids", id);
  return email ? customerByEmail(email) : null;
}

/** False when the email already has an account. */
export async function insertCustomer(c: StoredCustomer) {
  const db = kv();
  if (!(await db.hsetnx("customers", c.email, JSON.stringify(c)))) return false;
  await db.hset("customer-ids", c.id, c.email);
  return true;
}

export type StaffLogin = { email: string; hash: string };

export async function readStaffLogin() {
  return parse<StaffLogin>(await kv().get("staff-login"));
}

export async function writeStaffLogin(login: StaffLogin) {
  await kv().set("staff-login", JSON.stringify(login));
}

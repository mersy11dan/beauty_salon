import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Customer, Session } from "@/lib/types";
import { db } from "../db";
import { customerSessions, customers, staffSessions, staffUsers } from "../db/schema";

type Kind = "staff" | "customer";

const DAY = 24 * 60 * 60 * 1000;
const LIFETIME: Record<Kind, number> = { staff: 14 * DAY, customer: 60 * DAY };
const COOKIE: Record<Kind, string> = { staff: "salon_staff_session", customer: "salon_guest_session" };

/**
 * The database expiry is the real limit and slides forward with use. The cookie just needs to outlive it,
 * because cookies can't be re-set while a Server Component renders.
 */
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");

async function setCookie(kind: Kind, token: string) {
  (await cookies()).set(COOKIE[kind], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

async function readToken(kind: Kind) {
  const value = (await cookies()).get(COOKIE[kind])?.value;
  return value && value.length >= 32 && value.length <= 128 ? value : null;
}

export async function startStaffSession(staffUserId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  await db.delete(staffSessions).where(and(eq(staffSessions.staffUserId, staffUserId), lt(staffSessions.expiresAt, new Date(now))));
  await db.insert(staffSessions).values({ id: hashToken(token), staffUserId, expiresAt: new Date(now + LIFETIME.staff) });
  await setCookie("staff", token);
}

export async function startCustomerSession(customerId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  await db.delete(customerSessions).where(and(eq(customerSessions.customerId, customerId), lt(customerSessions.expiresAt, new Date(now))));
  await db.insert(customerSessions).values({ id: hashToken(token), customerId, expiresAt: new Date(now + LIFETIME.customer) });
  await setCookie("customer", token);
}

export async function endSession(kind: Kind) {
  const token = await readToken(kind);
  if (token) {
    const table = kind === "staff" ? staffSessions : customerSessions;
    await db.delete(table).where(eq(table.id, hashToken(token)));
  }
  (await cookies()).delete(COOKIE[kind]);
}

/** Pushes the expiry forward once less than half the lifetime is left, so active users stay signed in. */
function shouldExtend(kind: Kind, expiresAt: Date) {
  return expiresAt.getTime() - Date.now() < LIFETIME[kind] / 2;
}

/** The signed-in desk or admin user, checked against the database. Memoized per request. */
export const getStaffSession = cache(async (): Promise<Session> => {
  const token = await readToken("staff");
  if (!token) return null;
  const id = hashToken(token);
  const [row] = await db
    .select({ expiresAt: staffSessions.expiresAt, userId: staffUsers.id, email: staffUsers.email, name: staffUsers.name, role: staffUsers.role })
    .from(staffSessions)
    .innerJoin(staffUsers, eq(staffUsers.id, staffSessions.staffUserId))
    .where(and(eq(staffSessions.id, id), gt(staffSessions.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  if (shouldExtend("staff", row.expiresAt)) {
    await db.update(staffSessions).set({ expiresAt: new Date(Date.now() + LIFETIME.staff) }).where(eq(staffSessions.id, id));
  }
  return { id: row.userId, email: row.email, name: row.name, role: row.role };
});

/** The signed-in guest, checked against the database. Memoized per request. */
export const getCustomer = cache(async (): Promise<Customer | null> => {
  const token = await readToken("customer");
  if (!token) return null;
  const id = hashToken(token);
  const [row] = await db
    .select({
      expiresAt: customerSessions.expiresAt,
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
    })
    .from(customerSessions)
    .innerJoin(customers, eq(customers.id, customerSessions.customerId))
    .where(and(eq(customerSessions.id, id), gt(customerSessions.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  if (shouldExtend("customer", row.expiresAt)) {
    await db.update(customerSessions).set({ expiresAt: new Date(Date.now() + LIFETIME.customer) }).where(eq(customerSessions.id, id));
  }
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, createdAt: row.createdAt.toISOString() };
});

/** Signs out every device of a staff user, e.g. after a password reset or role change. */
export async function revokeStaffSessions(staffUserId: string) {
  await db.delete(staffSessions).where(eq(staffSessions.staffUserId, staffUserId));
}

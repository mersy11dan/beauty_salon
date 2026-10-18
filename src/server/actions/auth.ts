"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult, Customer, Session } from "@/lib/types";
import { burnPasswordCheck, hashPassword, PASSWORD_MAX, PASSWORD_MIN, verifyPassword } from "../auth/password";
import { clearRateLimit, clientIp, rateLimit, waitMessage } from "../auth/rate-limit";
import { endSession, getStaffSession, revokeStaffSessions, startCustomerSession, startStaffSession } from "../auth/session";
import { db } from "../db";
import { customers, staffUsers } from "../db/schema";
import { newId } from "../ids";
import { emailSchema, firstIssue, phoneSchema } from "../validation";
import { fail, guarded, isUniqueViolation, NOT_SIGNED_IN, ok } from "./util";

const MISMATCH = "That email and password do not match.";
const credentials = z.object({ email: z.string().trim().toLowerCase().max(254), password: z.string().max(PASSWORD_MAX) });
const newPassword = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Keep it under ${PASSWORD_MAX} characters.`);

/** Per-email and per-IP limits on sign-in attempts. Returns an error sentence when either is exceeded. */
async function throttleSignIn(kind: "staff" | "guest", email: string) {
  const [byEmail, byIp] = await Promise.all([
    rateLimit(`signin:${kind}:${email}`, 8, 15 * 60),
    rateLimit(`signin:ip:${await clientIp()}`, 60, 15 * 60),
  ]);
  if (!byEmail.ok) return waitMessage(byEmail.retryAfterSec);
  if (!byIp.ok) return waitMessage(byIp.retryAfterSec);
  return null;
}

export async function signInStaff(input: { email: string; password: string }): Promise<ActionResult<NonNullable<Session>>> {
  return guarded("signInStaff", async () => {
    const parsed = credentials.safeParse(input);
    if (!parsed.success || !parsed.data.email || !parsed.data.password) return fail(MISMATCH, "password");
    const { email, password } = parsed.data;

    const limited = await throttleSignIn("staff", email);
    if (limited) return fail(limited, "password");

    const [user] = await db.select().from(staffUsers).where(eq(staffUsers.email, email)).limit(1);
    if (!user) {
      await burnPasswordCheck(password);
      return fail(MISMATCH, "password");
    }
    if (!(await verifyPassword(password, user.passwordHash))) return fail(MISMATCH, "password");

    await startStaffSession(user.id);
    await clearRateLimit(`signin:staff:${email}`);
    return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
  });
}

export async function signOutStaff(): Promise<ActionResult> {
  return guarded("signOutStaff", async () => {
    await endSession("staff");
    return ok(null);
  });
}

export async function changeOwnPassword(input: { current: string; next: string }): Promise<ActionResult> {
  return guarded("changeOwnPassword", async () => {
    const session = await getStaffSession();
    if (!session) return fail(NOT_SIGNED_IN);
    const next = newPassword.safeParse(input.next);
    if (!next.success) return fail(firstIssue(next.error).error, "next");

    const limited = await rateLimit(`password:${session.id}`, 8, 15 * 60);
    if (!limited.ok) return fail(waitMessage(limited.retryAfterSec), "current");

    const [user] = await db.select().from(staffUsers).where(eq(staffUsers.id, session.id)).limit(1);
    if (!user || !(await verifyPassword(String(input.current ?? ""), user.passwordHash))) {
      return fail("That isn't your current password.", "current");
    }
    await db.update(staffUsers).set({ passwordHash: await hashPassword(next.data) }).where(eq(staffUsers.id, user.id));
    // Sign out every other device, then keep this one signed in.
    await revokeStaffSessions(user.id);
    await startStaffSession(user.id);
    return ok(null);
  });
}

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Add the name we should ask for.").max(120),
  phone: phoneSchema,
  email: emailSchema,
  password: newPassword,
});

export async function signUpCustomer(input: { name: string; phone: string; email: string; password: string }): Promise<ActionResult<Customer>> {
  return guarded("signUpCustomer", async () => {
    const parsed = signUpSchema.safeParse(input);
    if (!parsed.success) {
      const { error, field } = firstIssue(parsed.error);
      return fail(error, field);
    }
    const { name, phone, email, password } = parsed.data;

    const limited = await rateLimit(`signup:ip:${await clientIp()}`, 10, 60 * 60);
    if (!limited.ok) return fail(waitMessage(limited.retryAfterSec), "email");

    const taken = "There is already an account with this email. Sign in instead.";
    const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, email)).limit(1);
    if (existing) return fail(taken, "email");

    let row: typeof customers.$inferSelect;
    try {
      [row] = await db
        .insert(customers)
        .values({ id: newId("cus"), name, phone, email, passwordHash: await hashPassword(password) })
        .returning();
    } catch (err) {
      if (isUniqueViolation(err)) return fail(taken, "email");
      throw err;
    }
    await startCustomerSession(row.id);
    return ok({ id: row.id, name: row.name, email: row.email, phone: row.phone, createdAt: row.createdAt.toISOString() });
  });
}

export async function signInCustomer(input: { email: string; password: string }): Promise<ActionResult<Customer>> {
  return guarded("signInCustomer", async () => {
    const parsed = credentials.safeParse(input);
    if (!parsed.success || !parsed.data.email || !parsed.data.password) return fail(MISMATCH, "password");
    const { email, password } = parsed.data;

    const limited = await throttleSignIn("guest", email);
    if (limited) return fail(limited, "password");

    const [row] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
    if (!row) {
      await burnPasswordCheck(password);
      return fail(MISMATCH, "password");
    }
    if (!(await verifyPassword(password, row.passwordHash))) return fail(MISMATCH, "password");

    await startCustomerSession(row.id);
    await clearRateLimit(`signin:guest:${email}`);
    return ok({ id: row.id, name: row.name, email: row.email, phone: row.phone, createdAt: row.createdAt.toISOString() });
  });
}

export async function signOutCustomer(): Promise<ActionResult> {
  return guarded("signOutCustomer", async () => {
    await endSession("customer");
    return ok(null);
  });
}

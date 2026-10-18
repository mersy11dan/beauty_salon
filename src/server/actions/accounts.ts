"use server";

import { and, count, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult, Role, StaffAccount } from "@/lib/types";
import { hashPassword, PASSWORD_MAX, PASSWORD_MIN } from "../auth/password";
import { revokeStaffSessions } from "../auth/session";
import { loadStaffAccounts, toStaffAccount as toAccount } from "../data/accounts";
import { db, type Tx } from "../db";
import { staffUsers } from "../db/schema";
import { newId } from "../ids";
import { emailSchema, entityId } from "../validation";
import { asStaff, fail, isUniqueViolation, ok, parseInput } from "./util";

const TAKEN = "Another login already uses this email.";
const LAST_ADMIN = "Keep at least one admin, or nobody could change the site.";

const password = z.string().min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`).max(PASSWORD_MAX);
const role = z.enum(["admin", "staff"]);
const name = z.string().trim().min(1, "Add a name so you can tell logins apart.").max(120);

/** Serialises admin-count checks, so two admins can't demote each other at the same moment. */
async function otherAdmins(tx: Tx, exceptId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('staff-admins'))`);
  const [{ n }] = await tx
    .select({ n: count() })
    .from(staffUsers)
    .where(and(eq(staffUsers.role, "admin"), ne(staffUsers.id, exceptId)));
  return n;
}

export async function listStaffAccounts(): Promise<ActionResult<StaffAccount[]>> {
  return asStaff("listStaffAccounts", ["admin"], async () => {
    return ok(await loadStaffAccounts());
  });
}

export async function createStaffAccount(input: { email: string; name: string; role: Role; password: string }): Promise<ActionResult<StaffAccount>> {
  return asStaff("createStaffAccount", ["admin"], async () => {
    const parsed = parseInput(z.object({ email: emailSchema, name, role, password }), input);
    if ("failure" in parsed) return parsed.failure;
    const v = parsed.data;
    try {
      const [row] = await db
        .insert(staffUsers)
        .values({ id: newId("usr"), email: v.email, name: v.name, role: v.role, passwordHash: await hashPassword(v.password) })
        .returning();
      return ok(toAccount(row));
    } catch (err) {
      if (isUniqueViolation(err)) return fail(TAKEN, "email");
      throw err;
    }
  });
}

/** Leave `password` empty to keep the current one. A new password signs that person out everywhere. */
export async function updateStaffAccount(input: {
  id: string;
  email: string;
  name: string;
  role: Role;
  password?: string;
}): Promise<ActionResult<StaffAccount>> {
  return asStaff("updateStaffAccount", ["admin"], async (session) => {
    const parsed = parseInput(
      z.object({ id: entityId, email: emailSchema, name, role, password: z.union([z.literal(""), password]).optional() }),
      input,
    );
    if ("failure" in parsed) return parsed.failure;
    const v = parsed.data;
    if (v.id === session.id && v.role !== "admin") return fail("You can't remove your own admin access. Ask another admin.", "role");

    try {
      const result = await db.transaction(async (tx) => {
        if (v.role !== "admin" && (await otherAdmins(tx, v.id)) === 0) return { error: LAST_ADMIN } as const;
        const [row] = await tx
          .update(staffUsers)
          .set({ email: v.email, name: v.name, role: v.role, ...(v.password ? { passwordHash: await hashPassword(v.password) } : {}) })
          .where(eq(staffUsers.id, v.id))
          .returning();
        return row ? ({ row } as const) : ({ error: "That login was removed. Refresh the page." } as const);
      });
      if (result.error) return fail(result.error, "role");
      if (v.password && v.id !== session.id) await revokeStaffSessions(v.id);
      return ok(toAccount(result.row));
    } catch (err) {
      if (isUniqueViolation(err)) return fail(TAKEN, "email");
      throw err;
    }
  });
}

export async function deleteStaffAccount(id: string): Promise<ActionResult> {
  return asStaff("deleteStaffAccount", ["admin"], async (session) => {
    const parsed = parseInput(entityId, id);
    if ("failure" in parsed) return parsed.failure;
    if (parsed.data === session.id) return fail("You can't remove your own login while you are using it.");
    const result = await db.transaction(async (tx) => {
      const [target] = await tx.select({ role: staffUsers.role }).from(staffUsers).where(eq(staffUsers.id, parsed.data)).limit(1);
      if (!target) return null;
      if (target.role === "admin" && (await otherAdmins(tx, parsed.data)) === 0) return LAST_ADMIN;
      await tx.delete(staffUsers).where(eq(staffUsers.id, parsed.data));
      return null;
    });
    return result ? fail(result) : ok(null);
  });
}

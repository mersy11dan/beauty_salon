import "server-only";
import { asc } from "drizzle-orm";
import type { StaffAccount } from "@/lib/types";
import { db } from "../db";
import { staffUsers } from "../db/schema";

export const toStaffAccount = (r: typeof staffUsers.$inferSelect): StaffAccount => ({
  id: r.id,
  email: r.email,
  name: r.name,
  role: r.role,
  createdAt: r.createdAt.toISOString(),
});

export async function loadStaffAccounts(): Promise<StaffAccount[]> {
  const rows = await db.select().from(staffUsers).orderBy(asc(staffUsers.createdAt));
  return rows.map(toStaffAccount);
}

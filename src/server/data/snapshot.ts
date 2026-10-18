import "server-only";
import { connection } from "next/server";
import type { Customer, PublicData, Session } from "@/lib/types";
import { getCustomer, getStaffSession } from "../auth/session";
import { env } from "../env";
import { getPublicData } from "./public";

export type InitialSnapshot = PublicData & { session: Session; customer: Customer | null; demoMode: boolean };

/** What every page starts with: the public site plus who is signed in. Bookings and payments load only inside the desk and admin. */
export async function getInitialSnapshot(): Promise<InitialSnapshot> {
  await connection();
  const [data, session, customer] = await Promise.all([getPublicData(), getStaffSession(), getCustomer()]);
  return { ...data, session, customer, demoMode: env().DEMO_MODE };
}

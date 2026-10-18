import "server-only";
import { redirect } from "next/navigation";
import { nowInZone } from "@/lib/dates";
import type { Role } from "@/lib/types";
import { getStaffSession } from "../auth/session";
import { loadOpsData } from "./ops";
import { getPublicData } from "./public";

/** Signs the visitor in first, sends desk staff away from admin, then loads bookings and payments. */
export async function enterOpsArea(area: "/desk" | "/admin", roles: Role[]) {
  const session = await getStaffSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(area)}`);
  if (!roles.includes(session.role)) redirect(session.role === "admin" ? "/admin" : "/desk");
  const { settings } = await getPublicData();
  const ops = await loadOpsData(nowInZone(settings.timeZone).date);
  return { session, ops };
}

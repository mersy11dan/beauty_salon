import { nowInZone } from "@/lib/dates";
import { getStaffSession } from "@/server/auth/session";
import { loadOpsData } from "@/server/data/ops";
import { getPublicData } from "@/server/data/public";
import { noStoreJson } from "@/server/http";

/** Latest bookings and payments, polled by the desk so new online requests show up without a reload. */
export async function GET() {
  const session = await getStaffSession();
  if (!session) return noStoreJson({ error: "signed-out" }, { status: 401 });
  try {
    const { settings } = await getPublicData();
    return noStoreJson(await loadOpsData(nowInZone(settings.timeZone).date));
  } catch (err) {
    console.error("[ops/snapshot] failed:", err);
    return noStoreJson({ error: "unavailable" }, { status: 503 });
  }
}

import { z } from "zod";
import { freeSlots, resolveChoice } from "@/server/booking";
import { loadBusyBlocks } from "@/server/data/ops";
import { getPublicData } from "@/server/data/public";
import { noStoreJson } from "@/server/http";
import { entityId, isoDate } from "@/server/validation";

const query = z.object({ serviceId: entityId, staffId: entityId.nullable(), date: isoDate });

/** Free start times for one service on one day. Returns times only, never who booked the rest. */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const parsed = query.safeParse({ serviceId: sp.get("serviceId"), staffId: sp.get("staffId") || null, date: sp.get("date") });
  if (!parsed.success) return noStoreJson({ error: "Pick a service and a day." }, { status: 400 });

  try {
    const data = await getPublicData();
    const resolved = resolveChoice(data, parsed.data);
    if (resolved.error) return noStoreJson({ slots: [], reason: resolved.error });
    const busy = await loadBusyBlocks(parsed.data.date);
    return noStoreJson({ slots: freeSlots(data, resolved, parsed.data.date, busy) });
  } catch (err) {
    console.error("[availability] failed:", err);
    return noStoreJson({ error: "Free times couldn't be loaded. Try again in a moment." }, { status: 503 });
  }
}

"use server";

import type { ActionResult } from "@/lib/types";
import { db } from "../db";
import { seedContent, seedDemo, wipeSalonData } from "../db/seed";
import { env } from "../env";
import { asStaff, fail, ok, publicContentChanged } from "./util";

/** Puts the sample salon back. Only available when DEMO_MODE is on, so a live salon can never be wiped from the UI. */
export async function resetDemoData(): Promise<ActionResult> {
  return asStaff("resetDemoData", ["admin"], async () => {
    if (!env().DEMO_MODE) return fail("Resetting is only available on the demo site.");
    await db.transaction(async (tx) => {
      await wipeSalonData(tx);
      await seedContent(tx);
      await seedDemo(tx);
    });
    publicContentChanged();
    return ok(null);
  });
}

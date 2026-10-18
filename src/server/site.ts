import "server-only";

import { connection } from "next/server";
import { cache } from "react";
import type { DataMode, SiteContent } from "@/lib/types";
import { isLive } from "./env";
import { readContent } from "./repo";

export type SiteState = { mode: DataMode; content: SiteContent | null };

/**
 * What the root layout renders with. Demo sites stay fully static and fill in
 * from the browser; live sites read their own database on every request so
 * an admin's edit shows up on the next page load.
 */
export const getSiteState = cache(async (): Promise<SiteState> => {
  if (!isLive()) return { mode: "demo", content: null };
  await connection();
  return { mode: "live", content: await readContent() };
});

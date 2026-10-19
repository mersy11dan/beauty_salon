import { OFFLINE } from "./messages";
import type { ActionResult } from "./types";

/** Runs a Server Action and turns a dropped connection or a server crash into an ordinary error result. */
export async function call<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    const result = await fn();
    return result ?? { ok: false, error: OFFLINE };
  } catch (err) {
    console.error("[action]", err);
    return { ok: false, error: OFFLINE };
  }
}

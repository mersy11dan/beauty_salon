import "server-only";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import type { ActionResult, Role } from "@/lib/types";
import { getCustomer, getStaffSession } from "../auth/session";
import { PUBLIC_TAG } from "../data/public";
import { pruneUnusedMedia } from "../media";

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string, field?: string): ActionResult<never> => ({ ok: false, error, ...(field ? { field } : {}) });

export const NOT_SIGNED_IN = "Your session has ended. Sign in again to continue.";
export const NOT_ALLOWED = "Your login doesn't have access to this.";

/** Runs an action body, turning unexpected errors into a polite message instead of a crashed page. */
export async function guarded<T>(name: string, fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[action:${name}]`, err);
    return fail("Something went wrong on our side. Please try again in a moment.");
  }
}

export async function staffWith(roles: Role[]) {
  const session = await getStaffSession();
  if (!session) return { error: NOT_SIGNED_IN } as const;
  if (!roles.includes(session.role)) return { error: NOT_ALLOWED } as const;
  return { session } as const;
}

export async function signedInCustomer() {
  return getCustomer();
}

/** Expires the cached public site straight away and tidies unused photos after the response is sent. */
export function publicContentChanged() {
  revalidateTag(PUBLIC_TAG, { expire: 0 });
  after(() => pruneUnusedMedia().catch((err) => console.error("[media] prune failed:", err)));
}

/** Postgres unique-violation, e.g. two sign-ups racing for the same email. Drizzle wraps driver errors in `cause`. */
export function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: string; cause?: unknown };
  return e.code === "23505" || isUniqueViolation(e.cause);
}

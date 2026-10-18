import "server-only";
import { updateTag } from "next/cache";
import { after } from "next/server";
import type { z } from "zod";
import { NOT_ALLOWED, NOT_SIGNED_IN } from "@/lib/messages";
import type { ActionResult, Role, Session } from "@/lib/types";
import { getCustomer, getStaffSession } from "../auth/session";
import { PUBLIC_TAG } from "../data/public";
import { pruneUnusedMedia } from "../media";
import { firstIssue } from "../validation";

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string, field?: string): ActionResult<never> => ({ ok: false, error, ...(field ? { field } : {}) });

export { NOT_ALLOWED, NOT_SIGNED_IN };

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

/** `guarded`, plus a role check before the body runs. */
export function asStaff<T>(name: string, roles: Role[], fn: (session: NonNullable<Session>) => Promise<ActionResult<T>>) {
  return guarded(name, async () => {
    const auth = await staffWith(roles);
    if (auth.error) return fail(auth.error);
    return fn(auth.session);
  });
}

/** Parses untrusted input, or returns the first problem as a field-tagged failure. */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): { data: z.output<S> } | { failure: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { data: parsed.data };
  const { error, field } = firstIssue(parsed.error);
  return { failure: fail(error, field) };
}

/** Expires the cached public site straight away and tidies unused photos after the response is sent. Server Actions only. */
export function publicContentChanged() {
  updateTag(PUBLIC_TAG);
  after(() => pruneUnusedMedia().catch((err) => console.error("[media] prune failed:", err)));
}

/** Postgres unique-violation, e.g. two sign-ups racing for the same email. Drizzle wraps driver errors in `cause`. */
export function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: string; cause?: unknown };
  return e.code === "23505" || isUniqueViolation(e.cause);
}

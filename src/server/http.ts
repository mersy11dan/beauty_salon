import "server-only";

/** JSON that browsers and CDNs must never cache, for anything that depends on who is asking or on live bookings. */
export function noStoreJson(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  return Response.json(data, { ...init, headers });
}

/**
 * Route Handlers don't get the Server Action CSRF check, so writes must come from this site.
 * Cookies are SameSite=Lax already; this also stops same-site subdomains and old browsers.
 */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

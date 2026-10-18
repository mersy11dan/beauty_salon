import "server-only";

export type DbConfig = { kind: "upstash"; url: string; token: string } | { kind: "file"; path: string };

/**
 * A site is "live" once it has its own database. On Vercel that is an Upstash
 * Redis store added under Storage, which sets the KV_REST_API_* variables.
 * `SALON_LOCAL_DB` points at a JSON file instead, for trying live mode locally.
 * With neither, the site is the browser-only demo.
 */
export function dbConfig(): DbConfig | null {
  const env = process.env;
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { kind: "upstash", url: url.replace(/\/+$/, ""), token };
  if (env.SALON_LOCAL_DB) return { kind: "file", path: env.SALON_LOCAL_DB };
  return null;
}

export const isLive = () => dbConfig() !== null;

/** Lets several sites share one database without seeing each other's data. */
export const dbPrefix = () => process.env.SALON_DB_PREFIX || "salon:";

export function adminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  return email && password ? { email, password } : null;
}

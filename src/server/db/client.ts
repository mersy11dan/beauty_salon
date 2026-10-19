import postgres from "postgres";

/** libpq/Prisma-only options that postgres.js would otherwise send to the server as unknown settings. */
const DROP_PARAMS = ["channel_binding", "pgbouncer", "connection_limit", "pool_timeout", "schema"];

export function normalizeDatabaseUrl(raw: string) {
  const url = new URL(raw);
  for (const p of DROP_PARAMS) url.searchParams.delete(p);
  return url;
}

/** Transaction-mode poolers (Neon "-pooler" hosts, Supabase on 6543) can't keep prepared statements. */
function behindPooler(url: URL) {
  return url.hostname.includes("pooler") || url.port === "6543";
}

export function createSqlClient(raw: string, options: { max?: number } = {}) {
  const url = normalizeDatabaseUrl(raw);
  const opts: postgres.Options<Record<string, postgres.PostgresType>> = {
    max: options.max ?? 5,
    idle_timeout: 20,
    connect_timeout: 15,
    max_lifetime: 60 * 30,
    prepare: !behindPooler(url),
    onnotice: () => {},
  };
  // postgres.js treats a present-but-undefined `ssl` key as "off", so only set it when the URL is silent.
  if (!url.searchParams.has("sslmode") && !url.searchParams.has("ssl")) {
    const plainHost = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !url.hostname.includes(".");
    opts.ssl = plainHost ? false : "require";
  }
  return postgres(url.toString(), opts);
}

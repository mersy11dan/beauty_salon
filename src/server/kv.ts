import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { dbConfig, dbPrefix, type DbConfig } from "./env";

/** The handful of Redis commands the site needs. Keys are prefixed per site. */
export type Kv = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hset(key: string, field: string, value: string): Promise<void>;
  /** Returns false when the field already existed. */
  hsetnx(key: string, field: string, value: string): Promise<boolean>;
  hdel(key: string, field: string): Promise<void>;
};

type Cmd = (string | number)[];

function upstash(cfg: Extract<DbConfig, { kind: "upstash" }>, prefix: string): Kv {
  async function run<T>(cmd: Cmd): Promise<T> {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as { result?: T; error?: string } | null;
    if (!res.ok || !body || body.error) throw new Error(`Database error: ${body?.error ?? res.status}`);
    return body.result as T;
  }
  const k = (key: string) => prefix + key;
  return {
    get: (key) => run<string | null>(["GET", k(key)]),
    set: async (key, value) => void (await run(["SET", k(key), value])),
    del: async (key) => void (await run(["DEL", k(key)])),
    incr: (key) => run<number>(["INCR", k(key)]),
    hget: (key, field) => run<string | null>(["HGET", k(key), field]),
    hgetall: async (key) => {
      const flat = (await run<string[] | null>(["HGETALL", k(key)])) ?? [];
      const out: Record<string, string> = {};
      for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
      return out;
    },
    hset: async (key, field, value) => void (await run(["HSET", k(key), field, value])),
    hsetnx: async (key, field, value) => (await run<number>(["HSETNX", k(key), field, value])) === 1,
    hdel: async (key, field) => void (await run(["HDEL", k(key), field])),
  };
}

type FileData = { strings: Record<string, string>; hashes: Record<string, Record<string, string>> };

/** One JSON file, rewritten on every change. For local use only; Vercel's disk is read-only. */
function file(cfg: Extract<DbConfig, { kind: "file" }>, prefix: string): Kv {
  let queue: Promise<unknown> = Promise.resolve();
  const load = async (): Promise<FileData> => {
    try {
      return JSON.parse(await readFile(cfg.path, "utf8")) as FileData;
    } catch {
      return { strings: {}, hashes: {} };
    }
  };
  const save = async (data: FileData) => {
    await mkdir(dirname(cfg.path), { recursive: true });
    const tmp = `${cfg.path}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(data));
    await rename(tmp, cfg.path);
  };
  /** Serialises writes so two requests can't interleave read-modify-write. */
  const change = <T>(fn: (d: FileData) => T): Promise<T> => {
    const next = queue.then(async () => {
      const d = await load();
      const out = fn(d);
      await save(d);
      return out;
    });
    queue = next.catch(() => undefined);
    return next;
  };
  const k = (key: string) => prefix + key;
  return {
    get: async (key) => (await load()).strings[k(key)] ?? null,
    set: (key, value) => change((d) => void (d.strings[k(key)] = value)),
    del: (key) =>
      change((d) => {
        delete d.strings[k(key)];
        delete d.hashes[k(key)];
      }),
    incr: (key) =>
      change((d) => {
        const n = Number(d.strings[k(key)] ?? 0) + 1;
        d.strings[k(key)] = String(n);
        return n;
      }),
    hget: async (key, field) => (await load()).hashes[k(key)]?.[field] ?? null,
    hgetall: async (key) => ({ ...(await load()).hashes[k(key)] }),
    hset: (key, field, value) => change((d) => void ((d.hashes[k(key)] ??= {})[field] = value)),
    hsetnx: (key, field, value) =>
      change((d) => {
        const h = (d.hashes[k(key)] ??= {});
        if (field in h) return false;
        h[field] = value;
        return true;
      }),
    hdel: (key, field) => change((d) => void delete d.hashes[k(key)]?.[field]),
  };
}

let cached: { sig: string; kv: Kv } | null = null;

export function kv(): Kv {
  const cfg = dbConfig();
  if (!cfg) throw new Error("No database is configured for this site.");
  const prefix = dbPrefix();
  const sig = JSON.stringify([cfg, prefix]);
  if (cached?.sig !== sig) cached = { sig, kv: cfg.kind === "upstash" ? upstash(cfg, prefix) : file(cfg, prefix) };
  return cached.kv;
}

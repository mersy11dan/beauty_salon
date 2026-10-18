import "server-only";

import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import type { Role } from "@/lib/types";
import { adminCredentials, dbConfig } from "./env";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function checkPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = await scrypt(password, Buffer.from(saltHex, "hex"), 32);
  const want = Buffer.from(hashHex, "hex");
  return want.length === hash.length && timingSafeEqual(hash, want);
}

export function sameText(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Signs session cookies. Uses SESSION_SECRET when set; otherwise derives one
 * from secrets the site already has, so a missing variable can't leave
 * cookies unsigned.
 */
function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const cfg = dbConfig();
  const seed = [process.env.ADMIN_PASSWORD ?? "", cfg?.kind === "upstash" ? cfg.token : (cfg?.path ?? "")].join("|");
  return createHash("sha256").update(`salon-session|${seed}`).digest("hex");
}

/** Short fingerprint of a password hash; changing the password signs everyone out. */
export const fingerprint = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

function sign(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const want = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(want);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { exp: number };
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

const OPS_COOKIE = "salon_ops";
const GUEST_COOKIE = "salon_guest";
const DAY = 24 * 60 * 60;

type OpsToken = { role: Role; email: string; v: string; exp: number };
type GuestToken = { id: string; exp: number };

async function setCookie(name: string, value: string, maxAgeSec: number) {
  (await cookies()).set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export const adminVersion = () => fingerprint(`admin|${adminCredentials()?.email}|${adminCredentials()?.password}`);

export async function startOpsSession(role: Role, email: string, version: string) {
  const days = role === "admin" ? 7 : 30;
  await setCookie(OPS_COOKIE, sign({ role, email, v: version, exp: Date.now() + days * DAY * 1000 }), days * DAY);
}

export async function readOpsToken() {
  return verify<OpsToken>((await cookies()).get(OPS_COOKIE)?.value);
}

export async function endOpsSession() {
  (await cookies()).delete(OPS_COOKIE);
}

export async function startGuestSession(id: string) {
  await setCookie(GUEST_COOKIE, sign({ id, exp: Date.now() + 180 * DAY * 1000 }), 180 * DAY);
}

export async function readGuestId() {
  return verify<GuestToken>((await cookies()).get(GUEST_COOKIE)?.value)?.id ?? null;
}

export async function endGuestSession() {
  (await cookies()).delete(GUEST_COOKIE);
}

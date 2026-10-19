import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scrypt = (password: string, salt: Buffer, keylen: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );

// N = 2^15, r = 8 uses 32 MiB per hash and takes ~50-100 ms: slow for attackers, fine for a sign-in.
const LOG_N = 15;
const R = 8;
const P = 1;
const KEYLEN = 64;
const maxmem = (logN: number, r: number) => 256 * 2 ** logN * r;

/** Stored as `scrypt$logN$r$p$salt$hash` so the cost can be raised later without breaking old hashes. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN, { N: 2 ** LOG_N, r: R, p: P, maxmem: maxmem(LOG_N, R) });
  return ["scrypt", LOG_N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, logN, r, p, saltB64, keyB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64url");
  const nLog = Number(logN);
  const nR = Number(r);
  const key = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64url"), expected.length, {
    N: 2 ** nLog,
    r: nR,
    p: Number(p),
    maxmem: maxmem(nLog, nR),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

let dummy: Promise<string> | null = null;

/** Spend the same time as a real check when the email is unknown, so timing doesn't reveal which emails exist. */
export async function burnPasswordCheck(password: string) {
  dummy ??= hashPassword("not-a-real-password");
  await verifyPassword(password, await dummy);
}

export { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validation";

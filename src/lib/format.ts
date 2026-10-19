import type { PaymentMethod } from "./types";

/**
 * Birr is written the way salon price boards in Addis do: "1,200 Br".
 * Other ISO 4217 codes use the browser's currency format, and unknown codes fall back to birr.
 */
export function formatMoney(amount: number, currency = "ETB") {
  const digits = amount % 1 === 0 ? 0 : 2;
  if (currency !== "ETB") {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: digits }).format(amount);
    } catch {}
  }
  const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(amount);
  return `${n}\u00a0Br`;
}

/** The code itself when the browser knows it as a currency, otherwise null. */
export function validCurrency(code: unknown): string | null {
  if (typeof code !== "string" || !/^[A-Z]{3}$/.test(code)) return null;
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: code });
    return code;
  } catch {
    return null;
  }
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "telebirr", label: "telebirr" },
  { value: "mpesa", label: "M-PESA" },
  { value: "transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
];

export const METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label])) as Record<PaymentMethod, string>;

export const PAYMENT_NOTE = "Cash, telebirr, M-PESA or bank transfer (CBE, Awash, Dashen).";

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** `prefix_` plus 16 random characters. Uses getRandomValues, which works outside secure contexts too. */
export function uid(prefix = "id") {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ID_ALPHABET[b % ID_ALPHABET.length];
  return `${prefix}_${out}`;
}

/** Same-site paths only, so `?next=` can't send anyone to another origin or a `javascript:` URL. */
export function safeNext(raw: string | null | undefined, fallback: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

/** Photos are either our own paths ("/media/...", "/uploads/...") or https URLs from the photo host. */
export function isSafeImageSrc(value: string) {
  if (value.startsWith("/")) return !value.startsWith("//") && !value.startsWith("/\\");
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidUrl(value: string) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

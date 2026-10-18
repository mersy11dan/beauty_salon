export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

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

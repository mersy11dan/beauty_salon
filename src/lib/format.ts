import type { PaymentMethod } from "./types";

/** Ethiopian birr, written the way salon price boards in Addis do: "1,200 Br". */
export function formatMoney(amount: number) {
  const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount);
  return `${n}\u00a0Br`;
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

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
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

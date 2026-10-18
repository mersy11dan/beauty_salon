export function formatMoney(amount: number, currency = "USD") {
  const opts = { style: "currency", maximumFractionDigits: amount % 1 === 0 ? 0 : 2 } as const;
  try {
    return new Intl.NumberFormat("en-US", { ...opts, currency }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-US", { ...opts, currency: "USD" }).format(amount);
  }
}

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

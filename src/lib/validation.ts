const EMAIL_RE =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

/** Returns what is wrong with an email address, or undefined when it looks right. */
export function checkEmail(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return "Add your email address.";
  if (/\s/.test(v)) return "Email addresses can't contain spaces.";
  const parts = v.split("@");
  if (parts.length === 1) return "Add the @ and the part after it, like name@gmail.com.";
  if (parts.length > 2) return "Use only one @ in your email address.";
  const [local, domain] = parts;
  if (!local) return "Add the part before the @, like name@gmail.com.";
  if (!domain) return "Add the part after the @, like gmail.com.";
  if (!domain.includes(".")) return `Finish the part after the @, like ${domain}.com.`;
  if (/^\.|\.$|\.\./.test(local) || /^\.|\.$|\.\./.test(domain)) return "Check the dots in your email address.";
  if (local.length > 64 || v.length > 254) return "That email address is too long.";
  if (!EMAIL_RE.test(v)) return "Check your email address. It should look like name@gmail.com.";
  return undefined;
}

const COMMON_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "ethionet.et"];

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = temp;
    }
  }
  return row[b.length];
}

/** "selam@gmial.com" → "selam@gmail.com". Only for near-misses of the big providers. */
export function suggestEmail(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  const at = v.lastIndexOf("@");
  if (at < 1) return null;
  const domain = v.slice(at + 1);
  if (!domain || COMMON_DOMAINS.includes(domain)) return null;
  const match = COMMON_DOMAINS.find((d) => distance(domain, d) <= 2);
  return match ? `${raw.trim().slice(0, at)}@${match}` : null;
}

export function checkName(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return "Add the name we should ask for.";
  if (!/\p{L}/u.test(v)) return "Use letters for your name.";
  if (v.length < 2) return "Add at least 2 letters.";
  if (v.length > 80) return "Keep the name under 80 characters.";
  return undefined;
}

/** Shared with the server, which enforces the same limits. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;

export function checkNewPassword(raw: string): string | undefined {
  if (!raw) return "Choose a password.";
  if (raw.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (raw.length > PASSWORD_MAX) return `Keep it under ${PASSWORD_MAX} characters.`;
  return undefined;
}

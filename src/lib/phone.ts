/**
 * Phone numbers are stored in E.164 ("+251911234567") and shown the way people
 * dial them at home: Ethiopian numbers as "0911 234 567", anything else with
 * its country code.
 */

export type Country = {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  /** Used in sentences: "Mobile numbers in the United Kingdom …". */
  inName?: string;
  dial: string;
  /**
   * How the national "0" prefix behaves. `dialled`: locals type it, so it
   * counts towards the digits we ask for. `optional`: accepted and dropped.
   * `none`: there is no such prefix.
   */
  zero: "dialled" | "optional" | "none";
  /** Length of the national significant number (without the 0 prefix). */
  nsn: [min: number, max: number];
  /** Tested against the national significant number. */
  mobile: RegExp;
  /** Landlines too, when a business number is allowed. Defaults to any digits of the right length. */
  fixed?: RegExp;
  /** How mobile numbers start, as typed locally. */
  starts: string;
  /** A local-format example, also the placeholder. */
  example: string;
  /** Digit groups for display, applied to the national significant number. */
  group: number[];
};

const ETHIOPIA: Country = {
  code: "ET",
  name: "Ethiopia",
  dial: "251",
  zero: "dialled",
  nsn: [9, 9],
  mobile: /^[79]/,
  fixed: /^(11|22|25|33|34|46|47|57|58)/,
  starts: "09 or 07",
  example: "0911 234 567",
  group: [3, 3, 3],
};

const OTHERS: Country[] = [
  { code: "AU", name: "Australia", dial: "61", zero: "dialled", nsn: [9, 9], mobile: /^4/, starts: "04", example: "0412 345 678", group: [3, 3, 3] },
  { code: "CA", name: "Canada", dial: "1", zero: "none", nsn: [10, 10], mobile: /^[2-9]/, starts: "an area code, like 416", example: "416 555 0143", group: [3, 3, 4] },
  { code: "CN", name: "China", dial: "86", zero: "none", nsn: [11, 11], mobile: /^1/, starts: "1", example: "131 2345 6789", group: [3, 4, 4] },
  { code: "DJ", name: "Djibouti", dial: "253", zero: "none", nsn: [8, 8], mobile: /^77/, starts: "77", example: "77 12 34 56", group: [2, 2, 2, 2] },
  { code: "EG", name: "Egypt", dial: "20", zero: "dialled", nsn: [10, 10], mobile: /^1/, starts: "01", example: "0100 123 4567", group: [3, 3, 4] },
  { code: "ER", name: "Eritrea", dial: "291", zero: "dialled", nsn: [7, 7], mobile: /^7/, starts: "07", example: "07 123 456", group: [1, 3, 3] },
  { code: "FR", name: "France", dial: "33", zero: "dialled", nsn: [9, 9], mobile: /^[67]/, starts: "06 or 07", example: "06 12 34 56 78", group: [1, 2, 2, 2, 2] },
  { code: "DE", name: "Germany", dial: "49", zero: "dialled", nsn: [10, 11], mobile: /^1[5-7]/, starts: "015, 016 or 017", example: "01512 3456789", group: [4, 7] },
  { code: "IN", name: "India", dial: "91", zero: "optional", nsn: [10, 10], mobile: /^[6-9]/, starts: "6, 7, 8 or 9", example: "98765 43210", group: [5, 5] },
  { code: "IL", name: "Israel", dial: "972", zero: "dialled", nsn: [9, 9], mobile: /^5/, starts: "05", example: "050 234 5678", group: [2, 3, 4] },
  { code: "IT", name: "Italy", dial: "39", zero: "none", nsn: [9, 10], mobile: /^3/, starts: "3", example: "312 345 6789", group: [3, 3, 4] },
  { code: "KE", name: "Kenya", dial: "254", zero: "dialled", nsn: [9, 9], mobile: /^[17]/, starts: "07 or 01", example: "0712 345 678", group: [3, 3, 3] },
  { code: "KW", name: "Kuwait", dial: "965", zero: "none", nsn: [8, 8], mobile: /^[569]/, starts: "5, 6 or 9", example: "5001 2345", group: [4, 4] },
  { code: "NL", name: "Netherlands", inName: "the Netherlands", dial: "31", zero: "dialled", nsn: [9, 9], mobile: /^6/, starts: "06", example: "06 12345678", group: [1, 8] },
  { code: "NG", name: "Nigeria", dial: "234", zero: "dialled", nsn: [10, 10], mobile: /^[789]/, starts: "07, 08 or 09", example: "0802 123 4567", group: [3, 3, 4] },
  { code: "NO", name: "Norway", dial: "47", zero: "none", nsn: [8, 8], mobile: /^[49]/, starts: "4 or 9", example: "412 34 567", group: [3, 2, 3] },
  { code: "QA", name: "Qatar", dial: "974", zero: "none", nsn: [8, 8], mobile: /^[3567]/, starts: "3, 5, 6 or 7", example: "3312 3456", group: [4, 4] },
  { code: "RW", name: "Rwanda", dial: "250", zero: "dialled", nsn: [9, 9], mobile: /^7/, starts: "07", example: "0781 234 567", group: [3, 3, 3] },
  { code: "SA", name: "Saudi Arabia", dial: "966", zero: "dialled", nsn: [9, 9], mobile: /^5/, starts: "05", example: "051 234 5678", group: [2, 3, 4] },
  { code: "ZA", name: "South Africa", dial: "27", zero: "dialled", nsn: [9, 9], mobile: /^[6-8]/, starts: "06, 07 or 08", example: "071 123 4567", group: [2, 3, 4] },
  { code: "SS", name: "South Sudan", dial: "211", zero: "dialled", nsn: [9, 9], mobile: /^9/, starts: "09", example: "0912 345 678", group: [3, 3, 3] },
  { code: "SD", name: "Sudan", dial: "249", zero: "dialled", nsn: [9, 9], mobile: /^[19]/, starts: "09 or 01", example: "091 234 5678", group: [2, 3, 4] },
  { code: "SE", name: "Sweden", dial: "46", zero: "dialled", nsn: [9, 9], mobile: /^7/, starts: "07", example: "070 123 45 67", group: [2, 3, 2, 2] },
  { code: "TZ", name: "Tanzania", dial: "255", zero: "dialled", nsn: [9, 9], mobile: /^[67]/, starts: "06 or 07", example: "0712 345 678", group: [3, 3, 3] },
  { code: "TR", name: "Türkiye", dial: "90", zero: "dialled", nsn: [10, 10], mobile: /^5/, starts: "05", example: "0501 234 5678", group: [3, 3, 4] },
  { code: "UG", name: "Uganda", dial: "256", zero: "dialled", nsn: [9, 9], mobile: /^7/, starts: "07", example: "0712 345 678", group: [3, 3, 3] },
  { code: "AE", name: "United Arab Emirates", inName: "the UAE", dial: "971", zero: "dialled", nsn: [9, 9], mobile: /^5/, starts: "05", example: "050 123 4567", group: [2, 3, 4] },
  { code: "GB", name: "United Kingdom", inName: "the UK", dial: "44", zero: "dialled", nsn: [10, 10], mobile: /^7/, starts: "07", example: "07400 123456", group: [4, 6] },
  { code: "US", name: "United States", inName: "the US", dial: "1", zero: "none", nsn: [10, 10], mobile: /^[2-9]/, starts: "an area code, like 202", example: "202 555 0143", group: [3, 3, 4] },
];

/** Ethiopia first, as the default; the rest alphabetically. */
export const COUNTRIES: Country[] = [ETHIOPIA, ...OTHERS];

export const DEFAULT_COUNTRY = ETHIOPIA.code;

export function countryByCode(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? ETHIOPIA;
}

/** Country codes are prefix-free, so at most one dial code can lead a string of digits. */
function countryByDialPrefix(digits: string, prefer?: string): Country | null {
  const preferred = prefer ? countryByCode(prefer) : null;
  if (preferred && digits.startsWith(preferred.dial)) return preferred;
  const matches = COUNTRIES.filter((c) => digits.startsWith(c.dial));
  return matches.find((c) => c.code === "US") ?? matches[0] ?? null;
}

export type PhoneValue = { country: string; number: string };

export type PhoneKind = "mobile" | "any";

export type PhoneCheck = { ok: true; e164: string; nsn: string } | { ok: false; error: string };

function digitWord(n: number) {
  return n === 1 ? "digit" : "digits";
}

function lengthLabel(c: Country) {
  const extra = c.zero === "dialled" ? 1 : 0;
  const [min, max] = [c.nsn[0] + extra, c.nsn[1] + extra];
  return min === max ? `${min} digits` : `${min} or ${max} digits`;
}

/** "10 digits, starting with 09 or 07." */
export function phoneHint(country: string, kind: PhoneKind = "mobile") {
  const c = countryByCode(country);
  return kind === "mobile" ? `${lengthLabel(c)}, starting with ${c.starts}.` : `${lengthLabel(c)}, like ${c.example}.`;
}

function where(c: Country) {
  return c.inName ?? c.name;
}

export function checkPhone(value: PhoneValue, kind: PhoneKind = "mobile"): PhoneCheck {
  const c = countryByCode(value.country);
  const raw = value.number.trim();
  const noun = kind === "mobile" ? "mobile number" : "phone number";

  if (!raw) return { ok: false, error: `Add a ${noun} we can reach you on.` };
  if (/[^\d\s().+-]/.test(raw)) return { ok: false, error: "Use digits only. Spaces and dashes are fine." };

  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") || digits.startsWith("00")) {
    digits = digits.replace(/^00/, "");
    if (!digits.startsWith(c.dial)) {
      const other = countryByDialPrefix(digits);
      return {
        ok: false,
        error: other
          ? `+${other.dial} is the code for ${where(other)}. Choose ${other.name} in the list, or remove the code.`
          : `Choose the country in the list and type the number without the +${digits.slice(0, 3)}.`,
      };
    }
    digits = digits.slice(c.dial.length);
  }

  const typed = digits.length;
  let nsn = digits;
  if (c.zero !== "none" && nsn.startsWith("0")) nsn = nsn.slice(1);
  if (c.dial === "1" && nsn.length === 11 && nsn.startsWith("1")) nsn = nsn.slice(1);

  const [min, max] = c.nsn;
  const startsOk = kind === "mobile" ? c.mobile.test(nsn) : c.fixed ? c.fixed.test(nsn) || c.mobile.test(nsn) : true;

  if (nsn.length >= 2 && !startsOk) {
    return {
      ok: false,
      error:
        kind === "mobile"
          ? `Mobile numbers in ${where(c)} start with ${c.starts}, like ${c.example}.`
          : `That doesn't look like a number in ${where(c)}. Try the format ${c.example}.`,
    };
  }
  if (nsn.length < min || nsn.length > max) {
    const label = kind === "mobile" ? "Mobile numbers" : "Numbers";
    return {
      ok: false,
      error: `${label} in ${where(c)} have ${lengthLabel(c)}, like ${c.example}. You've entered ${typed} ${digitWord(typed)}.`,
    };
  }
  return { ok: true, e164: `+${c.dial}${nsn}`, nsn };
}

function groupDigits(digits: string, groups: number[]) {
  const out: string[] = [];
  let i = 0;
  for (let g = 0; g < groups.length && i < digits.length; g++) {
    const size = g === groups.length - 1 ? digits.length - i : groups[g];
    out.push(digits.slice(i, i + size));
    i += size;
  }
  return out.join(" ");
}

/** The national number laid out the way it is dialled locally: "0911 234 567". */
export function formatNational(country: string, nsn: string) {
  const c = countryByCode(country);
  const grouped = groupDigits(nsn, c.group);
  return c.zero === "dialled" ? `0${grouped}` : grouped;
}

/** Splits a stored number back into the country picker and the local digits. */
export function parsePhone(stored: string | null | undefined, fallbackCountry = DEFAULT_COUNTRY): PhoneValue {
  const raw = (stored ?? "").trim();
  if (!raw) return { country: fallbackCountry, number: "" };
  if (raw.startsWith("+")) {
    const digits = raw.replace(/\D/g, "");
    const c = countryByDialPrefix(digits, fallbackCountry);
    if (c) {
      const nsn = digits.slice(c.dial.length);
      return { country: c.code, number: formatNational(c.code, nsn) };
    }
  }
  return { country: fallbackCountry, number: raw };
}

/** For display. Ethiopian numbers in local form, others with their country code. */
export function formatPhone(stored: string | null | undefined) {
  const raw = (stored ?? "").trim();
  if (!raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  const c = countryByDialPrefix(digits);
  if (!c) return raw;
  const nsn = digits.slice(c.dial.length);
  if (nsn.length < c.nsn[0] || nsn.length > c.nsn[1]) return raw;
  return c.code === ETHIOPIA.code ? formatNational(c.code, nsn) : `+${c.dial} ${groupDigits(nsn, c.group)}`;
}

export function telHref(stored: string | null | undefined) {
  return `tel:${(stored ?? "").replace(/[^+\d]/g, "")}`;
}

/**
 * When someone types or pastes a number with its country code ("+251 911…" or
 * "00251…"), returns the matching country and the rest of the number, so the
 * picker can follow along. Waits for one digit past the code.
 */
export function detectCountry(input: string, current: string): PhoneValue | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("+") && !trimmed.startsWith("00")) return null;
  const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
  const c = countryByDialPrefix(digits, current);
  if (!c || digits.length <= c.dial.length) return null;
  return { country: c.code, number: digits.slice(c.dial.length) };
}

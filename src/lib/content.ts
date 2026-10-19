import { isValidTimeZone } from "./dates";
import { BODY_FONTS, DISPLAY_FONTS, SCRIPT_FONTS } from "./fonts";
import { copyField } from "./copy";
import { uid, validCurrency } from "./format";
import { createSeedContent } from "./seed";
import type {
  DayHours,
  HeroSlide,
  Hours,
  Offer,
  PortfolioItem,
  Review,
  Service,
  Settings,
  SiteContent,
  StaffMember,
  Weekday,
} from "./types";

export function pickContent(s: SiteContent): SiteContent {
  return {
    settings: s.settings,
    services: s.services,
    staff: s.staff,
    portfolio: s.portfolio,
    reviews: s.reviews,
    offers: s.offers,
  };
}

export function seedContent(): SiteContent {
  return createSeedContent();
}

/** Fills in settings that older site files were created without. */
export function mergeSettings(base: Settings, partial: Partial<Settings> | undefined): Settings {
  const p = partial ?? {};
  return {
    ...base,
    ...p,
    theme: { ...base.theme, ...p.theme },
    fonts: { ...base.fonts, ...p.fonts },
    modules: { ...base.modules, ...p.modules },
    hero: { ...base.hero, ...p.hero },
    about: { ...base.about, ...p.about },
    contact: { ...base.contact, ...p.contact },
    socials: { ...base.socials, ...p.socials },
    hours: { ...base.hours, ...p.hours },
    seo: { ...base.seo, ...p.seo },
    copy: { ...base.copy, ...p.copy },
    checklist: { ...base.checklist, ...p.checklist },
  };
}

// --- Sanitising untrusted site files ----------------------------------------
// Limits match `server/validation.ts`, so a cleaned file always passes the server's checks.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = "", max = 4000) => (typeof v === "string" ? v.trim().slice(0, max) : fallback);
const num = (v: unknown, fallback: number, min: number, max: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const ID = /^[a-z]{2,8}_[A-Za-z0-9_-]{1,48}$/;
const HEX = /^#[0-9a-f]{6}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const validDate = (v: unknown) => {
  const s = str(v);
  if (!DATE.test(s)) return "";
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : "";
};

/** Keeps ids that are well formed and unused, otherwise makes a new one. */
function idMaker(prefix: string) {
  const used = new Set<string>();
  return (v: unknown) => {
    const s = str(v, "", 60);
    const next = ID.test(s) && !used.has(s) ? s : uid(prefix);
    used.add(next);
    return next;
  };
}

/** Images may be uploaded data, files shipped with the site, uploads on this site, or https links. */
export function safeImage(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i.test(s)) return s;
  if (/^\/(media|uploads)\/[\w./-]+$/.test(s) && !s.includes("..")) return s;
  if (s.length <= 2000 && /^https:\/\/[^\s"'<>]+$/i.test(s)) return s;
  return "";
}

/** Links shown to visitors: only http(s), so a site file can't smuggle in `javascript:`. */
export function safeLink(v: unknown): string {
  const s = str(v, "", 500);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? s : "";
  } catch {
    return "";
  }
}

function sanitizeHours(raw: unknown, base: Hours): Hours {
  const out = { ...base };
  if (!isObj(raw)) return out;
  for (const d of [0, 1, 2, 3, 4, 5, 6] as Weekday[]) {
    if (!(d in raw)) continue;
    const h = raw[d];
    let next: DayHours = null;
    if (isObj(h) && TIME.test(str(h.open)) && TIME.test(str(h.close)) && str(h.open) < str(h.close)) {
      next = { open: str(h.open), close: str(h.close) };
    }
    out[d] = next;
  }
  return out;
}

function sanitizeSettings(raw: unknown): Settings {
  const base = createSeedContent().settings;
  const r = isObj(raw) ? raw : {};
  const merged = mergeSettings(base, r as Partial<Settings>);
  const theme = { ...base.theme };
  for (const k of ["background", "ink", "accent", "surface"] as const) {
    if (HEX.test(str(merged.theme[k]))) theme[k] = merged.theme[k].toUpperCase();
  }
  const pickFont = (list: { id: string }[], v: unknown, fallback: string) => (list.some((f) => f.id === v) ? (v as string) : fallback);
  const slideId = idMaker("slide");
  const slides: HeroSlide[] = (Array.isArray(isObj(r.hero) ? r.hero.slides : null) ? ((r.hero as Obj).slides as unknown[]) : base.hero.slides)
    .filter(isObj)
    .slice(0, 5)
    .map((s) => ({ id: slideId(s.id), label: str(s.label, "", 40), src: safeImage(s.src), alt: str(s.alt, "", 300) }));
  const modules = { ...base.modules };
  for (const k of Object.keys(modules) as (keyof typeof modules)[]) modules[k] = Boolean(merged.modules[k]);
  const copy: Record<string, string> = {};
  for (const [k, v] of Object.entries(isObj(merged.copy) ? merged.copy : {})) if (typeof v === "string" && copyField(k)) copy[k] = v.slice(0, 2000);
  const checklist: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(isObj(merged.checklist) ? merged.checklist : {}).slice(0, 50)) if (/^\w{1,40}$/.test(k)) checklist[k] = Boolean(v);
  const timeZone = str(merged.timeZone, "", 64);

  return {
    name: str(merged.name, base.name, 80),
    tagline: str(merged.tagline, "", 120),
    logoUrl: safeImage(merged.logoUrl) || null,
    faviconUrl: safeImage(merged.faviconUrl) || null,
    timeZone: timeZone && isValidTimeZone(timeZone) ? timeZone : base.timeZone,
    theme,
    fonts: {
      display: pickFont(DISPLAY_FONTS, merged.fonts.display, base.fonts.display),
      script: pickFont(SCRIPT_FONTS, merged.fonts.script, base.fonts.script),
      body: pickFont(BODY_FONTS, merged.fonts.body, base.fonts.body),
    },
    modules,
    hero: {
      headline: str(merged.hero.headline, base.hero.headline, 160),
      paragraph: str(merged.hero.paragraph, "", 600),
      slides,
    },
    about: {
      heading: str(merged.about.heading, "", 160),
      body: str(merged.about.body, "", 3000),
      photos: (Array.isArray(merged.about.photos) ? merged.about.photos : []).map(safeImage).filter(Boolean).slice(0, 2),
    },
    copy,
    seo: { title: str(merged.seo.title, "", 120), description: str(merged.seo.description, "", 300) },
    currency: validCurrency(merged.currency) ?? base.currency,
    clock: merged.clock === "24h" ? "24h" : "12h",
    demoHints: typeof merged.demoHints === "boolean" ? merged.demoHints : base.demoHints,
    checklist,
    contact: {
      phone: str(merged.contact.phone, "", 40),
      email: str(merged.contact.email, "", 120),
      address: str(merged.contact.address, "", 200),
      mapUrl: safeLink(merged.contact.mapUrl),
    },
    hours: sanitizeHours(r.hours, base.hours),
    capacity: Math.round(num(merged.capacity, base.capacity, 1, 50)),
    socials: {
      facebook: safeLink(merged.socials.facebook),
      instagram: safeLink(merged.socials.instagram),
      x: safeLink(merged.socials.x),
      tiktok: safeLink(merged.socials.tiktok),
    },
  };
}

const list = (v: unknown, max: number) => (Array.isArray(v) ? v.filter(isObj).slice(0, max) : []);

/** Makes any parsed JSON safe to load as a site: wrong types are fixed, and items missing their essentials are dropped. */
export function normalizeContent(raw: unknown): SiteContent {
  const r = isObj(raw) ? raw : {};

  const serviceId = idMaker("svc");
  const renamed = new Map<string, string>();
  const services: Service[] = list(r.services, 500)
    .map((s) => {
      const id = serviceId(s.id);
      if (typeof s.id === "string") renamed.set(s.id, id);
      const note = str(s.note, "", 200);
      return {
        id,
        name: str(s.name, "", 120),
        category: str(s.category, "", 60) || "Other",
        durationMin: Math.round(num(s.durationMin, 60, 5, 720)),
        price: Math.round(num(s.price, 0, 0, 100_000) * 100) / 100,
        ...(note ? { note } : {}),
      };
    })
    .filter((s) => s.name);
  const serviceIds = new Set(services.map((s) => s.id));

  const staffId = idMaker("stf");
  const staff: StaffMember[] = list(r.staff, 100)
    .map((m) => ({
      id: staffId(m.id),
      name: str(m.name, "", 120),
      role: str(m.role, "", 120) || "Stylist",
      bio: str(m.bio, "", 2000),
      photo: safeImage(m.photo) || null,
      serviceIds: [
        ...new Set(
          (Array.isArray(m.serviceIds) ? m.serviceIds : [])
            .map((x) => (typeof x === "string" ? renamed.get(x) : undefined))
            .filter((x): x is string => !!x && serviceIds.has(x)),
        ),
      ],
    }))
    .filter((m) => m.name);

  const portfolioId = idMaker("pf");
  const portfolio: PortfolioItem[] = list(r.portfolio, 500)
    .map((p) => {
      const category = str(p.category, "", 60) || "Work";
      return {
        id: portfolioId(p.id),
        src: safeImage(p.src),
        alt: str(p.alt, "", 300),
        caption: str(p.caption, "", 120) || category,
        category,
      };
    })
    .filter((p) => p.src);

  const reviewId = idMaker("rv");
  const reviews: Review[] = list(r.reviews, 500)
    .map((v) => ({
      id: reviewId(v.id),
      author: str(v.author, "", 80) || "Guest",
      text: str(v.text, "", 2000),
      rating: Math.round(num(v.rating, 5, 1, 5)) as Review["rating"],
      date: validDate(v.date),
    }))
    .filter((v) => v.text);

  const offerId = idMaker("of");
  const offers: Offer[] = list(r.offers, 100)
    .map((o) => ({
      id: offerId(o.id),
      title: str(o.title, "", 160),
      detail: str(o.detail, "", 1000),
      until: validDate(o.until),
      active: Boolean(o.active),
    }))
    .filter((o) => o.title && o.detail);

  return { settings: sanitizeSettings(r.settings), services, staff, portfolio, reviews, offers };
}

// --- Site files --------------------------------------------------------------

export const PACKAGE_KIND = "salon-site";

export type SitePackage = {
  kind: typeof PACKAGE_KIND;
  version: 1;
  exportedAt: string;
  name: string;
  content: SiteContent;
};

export function makePackage(content: SiteContent): SitePackage {
  return { kind: PACKAGE_KIND, version: 1, exportedAt: new Date().toISOString(), name: content.settings.name, content: pickContent(content) };
}

export function readPackage(text: string): { ok: true; content: SiteContent; name: string } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file is not a site file. Choose the .json file you saved from Launch." };
  }
  if (!isObj(parsed) || parsed.kind !== PACKAGE_KIND || !isObj(parsed.content)) {
    return { ok: false, error: "That file is not a site file. Choose the .json file you saved from Launch." };
  }
  const content = normalizeContent(parsed.content);
  return { ok: true, content, name: content.settings.name };
}

export function packageFileName(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "salon";
  return `${slug}-site.json`;
}

/** Runs `fn` once per distinct image in the content and swaps in its result. */
export async function mapImages(content: SiteContent, fn: (src: string) => Promise<string>): Promise<SiteContent> {
  const seen = new Map<string, string>();
  const swap = async (src: string | null) => {
    if (!src) return src;
    if (!seen.has(src)) seen.set(src, await fn(src));
    return seen.get(src)!;
  };
  const s = content.settings;
  const slides: HeroSlide[] = [];
  for (const slide of s.hero.slides) slides.push({ ...slide, src: (await swap(slide.src)) ?? "" });
  const photos: string[] = [];
  for (const ph of s.about.photos) photos.push((await swap(ph)) ?? "");
  const staff: StaffMember[] = [];
  for (const m of content.staff) staff.push({ ...m, photo: await swap(m.photo) });
  const portfolio: PortfolioItem[] = [];
  for (const p of content.portfolio) portfolio.push({ ...p, src: (await swap(p.src)) ?? "" });
  return {
    ...content,
    settings: {
      ...s,
      logoUrl: await swap(s.logoUrl),
      faviconUrl: await swap(s.faviconUrl),
      hero: { ...s.hero, slides },
      about: { ...s.about, photos },
    },
    staff,
    portfolio,
  };
}

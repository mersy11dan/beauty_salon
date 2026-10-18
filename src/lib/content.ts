import { BODY_FONTS, DISPLAY_FONTS, SCRIPT_FONTS } from "./fonts";
import { uid } from "./format";
import { createSeed } from "./seed";
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

export const CONTENT_KEYS = ["settings", "services", "staff", "portfolio", "reviews", "offers"] as const;

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
  return pickContent(createSeed());
}

/** Fills in settings that older saves and site files were created without. */
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

// --- Sanitising untrusted content (site files, server writes) ---------------

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = "", max = 4000) => (typeof v === "string" ? v.slice(0, max) : fallback);
const num = (v: unknown, fallback: number, min: number, max: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const id = (v: unknown, prefix: string) => {
  const s = str(v, "", 80);
  return /^[\w-]+$/.test(s) ? s : uid(prefix);
};
const HEX = /^#[0-9a-f]{6}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

/** Images may be uploaded data, files shipped with the site, or https links. */
export function safeImage(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(s)) return s;
  if (/^\/(media|api\/media)\/[\w./-]+$/.test(s) && !s.includes("..")) return s;
  if (/^https:\/\/[^\s"'<>]+$/i.test(s)) return s;
  return "";
}

/** Links shown to visitors: only http(s), so a site file can't smuggle in `javascript:`. */
export function safeLink(v: unknown): string {
  const s = str(v, "", 2000).trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? s : "";
  } catch {
    return "";
  }
}

export function validCurrency(code: unknown): string | null {
  if (typeof code !== "string" || !/^[A-Z]{3}$/.test(code)) return null;
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: code });
    return code;
  } catch {
    return null;
  }
}

function sanitizeHours(raw: unknown, base: Hours): Hours {
  const out = { ...base };
  if (!isObj(raw)) return out;
  for (const d of [0, 1, 2, 3, 4, 5, 6] as Weekday[]) {
    if (!(d in raw)) continue;
    const h = raw[d];
    let next: DayHours = null;
    if (isObj(h) && TIME.test(str(h.open)) && TIME.test(str(h.close))) next = { open: str(h.open), close: str(h.close) };
    out[d] = next;
  }
  return out;
}

function sanitizeSettings(raw: unknown): Settings {
  const base = createSeed().settings;
  const r = isObj(raw) ? raw : {};
  const merged = mergeSettings(base, r as Partial<Settings>);
  const theme = { ...base.theme };
  for (const k of ["background", "ink", "accent", "surface"] as const) {
    if (HEX.test(str(merged.theme[k]))) theme[k] = merged.theme[k].toUpperCase();
  }
  const pickFont = (list: { id: string }[], v: unknown, fallback: string) => (list.some((f) => f.id === v) ? (v as string) : fallback);
  const slides: HeroSlide[] = (Array.isArray(isObj(r.hero) ? r.hero.slides : null) ? ((r.hero as Obj).slides as unknown[]) : base.hero.slides)
    .filter(isObj)
    .slice(0, 5)
    .map((s) => ({ id: id(s.id, "slide"), label: str(s.label, "", 60), src: safeImage(s.src), alt: str(s.alt, "", 300) }));
  const modules = { ...base.modules };
  for (const k of Object.keys(modules) as (keyof typeof modules)[]) modules[k] = Boolean(merged.modules[k]);
  const copy: Record<string, string> = {};
  for (const [k, v] of Object.entries(isObj(merged.copy) ? merged.copy : {})) if (typeof v === "string" && /^\w{1,60}$/.test(k)) copy[k] = v.slice(0, 2000);
  const checklist: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(isObj(merged.checklist) ? merged.checklist : {})) if (/^\w{1,40}$/.test(k)) checklist[k] = Boolean(v);

  return {
    name: str(merged.name, base.name, 120),
    tagline: str(merged.tagline, "", 200),
    logoDataUrl: safeImage(merged.logoDataUrl) || null,
    faviconDataUrl: safeImage(merged.faviconDataUrl) || null,
    theme,
    fonts: {
      display: pickFont(DISPLAY_FONTS, merged.fonts.display, base.fonts.display),
      script: pickFont(SCRIPT_FONTS, merged.fonts.script, base.fonts.script),
      body: pickFont(BODY_FONTS, merged.fonts.body, base.fonts.body),
    },
    modules,
    hero: {
      headline: str(merged.hero.headline, base.hero.headline, 300),
      paragraph: str(merged.hero.paragraph, "", 1200),
      slides: slides.length ? slides : base.hero.slides,
    },
    about: {
      heading: str(merged.about.heading, "", 300),
      body: str(merged.about.body, "", 4000),
      photos: (Array.isArray(merged.about.photos) ? merged.about.photos : []).map(safeImage).filter(Boolean).slice(0, 2),
    },
    copy,
    seo: { title: str(merged.seo.title, "", 120), description: str(merged.seo.description, "", 300) },
    currency: validCurrency(merged.currency) ?? base.currency,
    clock: merged.clock === "24h" ? "24h" : "12h",
    demoHints: typeof merged.demoHints === "boolean" ? merged.demoHints : base.demoHints,
    checklist,
    contact: {
      phone: str(merged.contact.phone, "", 60),
      email: str(merged.contact.email, "", 200),
      address: str(merged.contact.address, "", 300),
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

const list = (v: unknown, max = 500) => (Array.isArray(v) ? v.filter(isObj).slice(0, max) : []);

/** Makes any parsed JSON safe to load as a site: wrong types are fixed or dropped. */
export function normalizeContent(raw: unknown): SiteContent {
  const r = isObj(raw) ? raw : {};
  const services: Service[] = list(r.services).map((s) => {
    const note = str(s.note, "", 300);
    return {
      id: id(s.id, "svc"),
      name: str(s.name, "", 120),
      category: str(s.category, "", 60) || "Other",
      durationMin: Math.round(num(s.durationMin, 60, 5, 720)),
      price: Math.round(num(s.price, 0, 0, 1_000_000) * 100) / 100,
      ...(note ? { note } : {}),
    };
  });
  const serviceIds = new Set(services.map((s) => s.id));
  const staff: StaffMember[] = list(r.staff, 100).map((m) => ({
    id: id(m.id, "stf"),
    name: str(m.name, "", 120),
    role: str(m.role, "", 120),
    bio: str(m.bio, "", 2000),
    photo: safeImage(m.photo) || null,
    serviceIds: (Array.isArray(m.serviceIds) ? m.serviceIds : []).filter((x): x is string => typeof x === "string" && serviceIds.has(x)),
  }));
  const portfolio: PortfolioItem[] = list(r.portfolio)
    .map((p) => ({
      id: id(p.id, "pf"),
      src: safeImage(p.src),
      alt: str(p.alt, "", 300),
      caption: str(p.caption, "", 160),
      category: str(p.category, "", 60) || "Work",
    }))
    .filter((p) => p.src);
  const reviews: Review[] = list(r.reviews).map((v) => ({
    id: id(v.id, "rv"),
    author: str(v.author, "", 120),
    text: str(v.text, "", 2000),
    rating: Math.round(num(v.rating, 5, 1, 5)) as Review["rating"],
    date: DATE.test(str(v.date)) ? str(v.date) : "",
  }));
  const offers: Offer[] = list(r.offers, 100).map((o) => ({
    id: id(o.id, "of"),
    title: str(o.title, "", 200),
    detail: str(o.detail, "", 1000),
    until: DATE.test(str(o.until)) ? str(o.until) : "",
    active: Boolean(o.active),
  }));
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
  return { kind: PACKAGE_KIND, version: 1, exportedAt: new Date().toISOString(), name: content.settings.name, content };
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
      logoDataUrl: await swap(s.logoDataUrl),
      faviconDataUrl: await swap(s.faviconDataUrl),
      hero: { ...s.hero, slides },
      about: { ...s.about, photos },
    },
    staff,
    portfolio,
  };
}

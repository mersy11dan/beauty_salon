import { z } from "zod";
import { copyField } from "@/lib/copy";
import { isValidTimeZone } from "@/lib/dates";
import { BODY_FONTS, DISPLAY_FONTS, SCRIPT_FONTS } from "@/lib/fonts";
import { isSafeImageSrc, validCurrency } from "@/lib/format";
import { checkPhone, parsePhone, type PhoneKind } from "@/lib/phone";

const text = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters.`);
const required = (label: string, max: number) => text(max).min(1, `${label} is required.`);

export const entityId = z.string().regex(/^[a-z]{2,8}_[A-Za-z0-9_-]{1,48}$/, "Invalid id.");
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-18.")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "That date doesn't exist.");
/** Blank means no date; stored as null. */
const optionalDate = z.union([z.literal(""), isoDate]);
export const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 09:30.");
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit colour like #6E2B3F.");
const imageSrc = z.string().max(2000).refine((v) => v === "" || isSafeImageSrc(v), "Upload the photo again.");
/** Links may be mid-edit; the site only renders the ones that parse as http(s). */
const link = text(500);

const dayHours = z
  .object({ open: hhmm, close: hhmm })
  .nullable()
  .refine((h) => !h || h.open < h.close, "Closing time must be after opening time.");

const moduleFlags = z.object({
  services: z.boolean(),
  portfolio: z.boolean(),
  staff: z.boolean(),
  booking: z.boolean(),
  ledger: z.boolean(),
  reviews: z.boolean(),
  offers: z.boolean(),
});

const fontId = (list: { id: string }[]) =>
  z.string().refine((v) => list.some((f) => f.id === v), "Pick a font from the list.");

/** Only known phrases are kept; see `lib/copy.ts`. */
const copyOverrides = z
  .record(z.string().max(60), z.string().max(2000, "Keep it under 2000 characters."))
  .transform((o) => Object.fromEntries(Object.entries(o).filter(([k]) => copyField(k))));

const checklist = z
  .record(z.string().regex(/^\w{1,40}$/), z.boolean())
  .refine((o) => Object.keys(o).length <= 50, "Too many checklist items.");

export const settingsSchema = z.object({
  name: text(80),
  tagline: text(120),
  logoUrl: imageSrc.nullable().transform((v) => v || null),
  faviconUrl: imageSrc.nullable().transform((v) => v || null),
  timeZone: z.string().max(64).refine(isValidTimeZone, "Pick a time zone from the list."),
  theme: z.object({ background: color, ink: color, accent: color, surface: color }),
  fonts: z.object({ display: fontId(DISPLAY_FONTS), script: fontId(SCRIPT_FONTS), body: fontId(BODY_FONTS) }),
  modules: moduleFlags,
  hero: z.object({
    headline: text(160),
    paragraph: text(600),
    slides: z
      .array(z.object({ id: z.string().max(60), label: text(40), src: imageSrc, alt: text(300) }))
      .max(5, "Up to five photos."),
  }),
  about: z.object({
    heading: text(160),
    body: text(3000),
    photos: z.array(imageSrc).max(2, "Up to two photos."),
  }),
  copy: copyOverrides,
  seo: z.object({ title: text(120), description: text(300) }),
  currency: z.string().refine((v) => validCurrency(v) !== null, "Pick a currency from the list."),
  clock: z.enum(["12h", "24h"]),
  demoHints: z.boolean(),
  checklist,
  contact: z.object({ phone: text(40), email: text(120), address: text(200), mapUrl: link }),
  hours: z.object({ 0: dayHours, 1: dayHours, 2: dayHours, 3: dayHours, 4: dayHours, 5: dayHours, 6: dayHours }),
  capacity: z.coerce.number().int().min(1).max(50),
  socials: z.object({ facebook: link, instagram: link, x: link, tiktok: link }),
});

export const serviceSchema = z.object({
  id: entityId,
  name: required("Name", 120),
  category: required("Category", 60),
  durationMin: z.coerce.number().int("Duration must be whole minutes.").min(5, "At least 5 minutes.").max(720, "At most 12 hours."),
  price: z.coerce.number().min(0, "Price can't be negative.").max(100000),
  note: text(200)
    .optional()
    .transform((v) => v || undefined),
});

export const staffMemberSchema = z.object({
  id: entityId,
  name: required("Name", 120),
  role: required("Role", 120),
  bio: text(2000).default(""),
  photo: imageSrc.nullable().transform((v) => v || null),
  serviceIds: z.array(entityId).max(200).default([]),
});

export const portfolioItemSchema = z.object({
  id: entityId,
  src: imageSrc.refine((v) => v !== "", "Photo is required."),
  caption: required("Caption", 120),
  category: required("Category", 60),
  alt: text(300).default(""),
});

export const reviewSchema = z.object({
  id: entityId,
  author: required("Name", 80),
  text: required("Quote", 2000),
  rating: z.coerce.number().int().min(1).max(5),
  date: optionalDate,
});

export const offerSchema = z.object({
  id: entityId,
  title: required("Title", 160),
  detail: required("Detail", 1000),
  until: optionalDate,
  active: z.boolean(),
});

/** A whole site, as loaded from a site file on the Launch page. */
export const siteSchema = z.object({
  settings: settingsSchema,
  services: z.array(serviceSchema).max(500, "Up to 500 services."),
  staff: z.array(staffMemberSchema).max(100, "Up to 100 team members."),
  portfolio: z.array(portfolioItemSchema).max(500, "Up to 500 photos."),
  reviews: z.array(reviewSchema).max(500, "Up to 500 reviews."),
  offers: z.array(offerSchema).max(100, "Up to 100 offers."),
});

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: "Add an email address, like name@example.com." }));

/** Same per-country rules as the phone field. Accepts "+251911…" or a local "0911…" number; stores E.164. */
const phoneOf = (kind: PhoneKind) =>
  z
    .string()
    .trim()
    .max(40)
    .transform((v, ctx) => {
      const check = checkPhone(parsePhone(v), kind);
      if (check.ok) return check.e164;
      ctx.addIssue({ code: "custom", message: check.error });
      return z.NEVER;
    });

export const phoneSchema = phoneOf("mobile");

export const bookingSchema = z.object({
  serviceId: entityId,
  staffId: entityId.nullable(),
  date: isoDate,
  time: hhmm,
  guestName: required("Name", 120),
  guestPhone: phoneSchema,
  note: text(1000)
    .optional()
    .transform((v) => v || undefined),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().gt(0, "Enter an amount above zero.").max(1_000_000),
  label: required("Label", 200),
  method: z.enum(["cash", "telebirr", "mpesa", "transfer", "card"]),
  status: z.enum(["paid", "unpaid"]),
  date: isoDate,
  appointmentId: entityId.nullable(),
});

/** First zod issue as a short sentence, plus the top-level field it belongs to. */
export function firstIssue(error: z.ZodError) {
  const issue = error.issues[0];
  return { error: issue?.message ?? "Check the form and try again.", field: issue?.path[0]?.toString() };
}

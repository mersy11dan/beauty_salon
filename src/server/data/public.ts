import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createSeedContent } from "@/lib/seed";
import type { PublicData, Settings, StaffMember } from "@/lib/types";
import { db } from "../db";
import { offers, portfolioItems, reviews, services, siteSettings, staff, staffServices } from "../db/schema";

export const PUBLIC_TAG = "salon-public";

/** Fills keys added after a salon was created, so older rows never crash the site. */
export function withSettingsDefaults(stored: Partial<Settings> | undefined): Settings {
  const d = createSeedContent().settings;
  const s = stored ?? {};
  return {
    ...d,
    ...s,
    theme: { ...d.theme, ...s.theme },
    fonts: { ...d.fonts, ...s.fonts },
    modules: { ...d.modules, ...s.modules },
    hero: { ...d.hero, ...s.hero },
    about: { ...d.about, ...s.about, photos: s.about?.photos ?? d.about.photos },
    seo: { ...d.seo, ...s.seo },
    copy: { ...d.copy, ...s.copy },
    checklist: { ...d.checklist, ...s.checklist },
    contact: { ...d.contact, ...s.contact },
    socials: { ...d.socials, ...s.socials },
    hours: { ...d.hours, ...s.hours },
  };
}

export async function loadSettings(): Promise<Settings> {
  const [row] = await db.select({ data: siteSettings.data }).from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return withSettingsDefaults(row?.data);
}

async function loadPublicData(): Promise<PublicData> {
  const [settings, serviceRows, staffRows, links, portfolioRows, reviewRows, offerRows] = await Promise.all([
    loadSettings(),
    db.select().from(services).orderBy(asc(services.position), asc(services.createdAt)),
    db.select().from(staff).orderBy(asc(staff.position), asc(staff.createdAt)),
    db.select().from(staffServices),
    db.select().from(portfolioItems).orderBy(asc(portfolioItems.position), asc(portfolioItems.createdAt)),
    db.select().from(reviews).orderBy(asc(reviews.position), asc(reviews.createdAt)),
    db.select().from(offers).orderBy(asc(offers.position), asc(offers.createdAt)),
  ]);

  const serviceIdsByStaff = new Map<string, string[]>();
  for (const l of links) serviceIdsByStaff.set(l.staffId, [...(serviceIdsByStaff.get(l.staffId) ?? []), l.serviceId]);
  const serviceOrder = new Map(serviceRows.map((s, i) => [s.id, i]));

  return {
    settings,
    services: serviceRows.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      durationMin: s.durationMin,
      price: s.price,
      ...(s.note ? { note: s.note } : {}),
    })),
    staff: staffRows.map(
      (m): StaffMember => ({
        id: m.id,
        name: m.name,
        role: m.role,
        bio: m.bio,
        photo: m.photoUrl,
        serviceIds: (serviceIdsByStaff.get(m.id) ?? []).sort((a, b) => (serviceOrder.get(a) ?? 0) - (serviceOrder.get(b) ?? 0)),
      }),
    ),
    portfolio: portfolioRows.map((p) => ({ id: p.id, src: p.src, alt: p.alt, caption: p.caption, category: p.category })),
    reviews: reviewRows.map((r) => ({ id: r.id, author: r.author, text: r.text, rating: r.rating as 1 | 2 | 3 | 4 | 5, date: r.date ?? "" })),
    offers: offerRows.map((o) => ({ id: o.id, title: o.title, detail: o.detail, until: o.until ?? "", active: o.active })),
  };
}

/**
 * The whole public site in one cached read. Admin edits call `revalidateTag(PUBLIC_TAG)`,
 * so visitors almost never wait on the database.
 */
export const getPublicData = cache(
  unstable_cache(loadPublicData, ["salon-public-v2"], { tags: [PUBLIC_TAG], revalidate: 3600 }),
);

"use server";

import { eq, inArray, notInArray, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import type { ActionResult, ContentList, Offer, PortfolioItem, Review, Service, Settings, SiteContent, StaffMember } from "@/lib/types";
import { db } from "../db";
import { offers, portfolioItems, reviews, services, siteSettings, staff, staffServices } from "../db/schema";
import {
  entityId,
  offerSchema,
  portfolioItemSchema,
  reviewSchema,
  serviceSchema,
  settingsSchema,
  siteSchema,
  staffMemberSchema,
} from "../validation";
import { asStaff, fail, ok, parseInput, publicContentChanged } from "./util";

type Result<T> = Promise<ActionResult<T>>;

/** New rows go to the end of their list. */
const nextPosition = (table: PgTable, position: PgColumn) => sql`(select coalesce(max(${position}), -1) + 1 from ${table})`;

function adminEdit<T>(name: string, fn: () => Result<T>): Result<T> {
  return asStaff(name, ["admin"], async () => {
    const result = await fn();
    if (result.ok) publicContentChanged();
    return result;
  });
}

function removeBy(name: string, table: PgTable & { id: PgColumn }, id: string): Result<null> {
  return adminEdit(name, async () => {
    const parsed = parseInput(entityId, id);
    if ("failure" in parsed) return parsed.failure;
    await db.delete(table).where(eq(table.id, parsed.data));
    return ok(null);
  });
}

export async function saveSettings(input: Settings): Result<Settings> {
  return adminEdit("saveSettings", async () => {
    const parsed = parseInput(settingsSchema, input);
    if ("failure" in parsed) return parsed.failure;
    const data = parsed.data as Settings;
    await db.insert(siteSettings).values({ id: 1, data }).onConflictDoUpdate({ target: siteSettings.id, set: { data } });
    return ok(data);
  });
}

export async function saveService(input: Service): Result<Service> {
  return adminEdit("saveService", async () => {
    const parsed = parseInput(serviceSchema, input);
    if ("failure" in parsed) return parsed.failure;
    const { id, ...fields } = parsed.data;
    const row = { ...fields, note: fields.note ?? null };
    await db
      .insert(services)
      .values({ id, ...row, position: nextPosition(services, services.position) })
      .onConflictDoUpdate({ target: services.id, set: row });
    return ok(parsed.data);
  });
}

export async function deleteService(id: string): Result<null> {
  return removeBy("deleteService", services, id);
}

export async function saveStaffMember(input: StaffMember): Result<StaffMember> {
  return adminEdit("saveStaffMember", async () => {
    const parsed = parseInput(staffMemberSchema, input);
    if ("failure" in parsed) return parsed.failure;
    const { id, name, role, bio, photo, serviceIds } = parsed.data;
    const saved = await db.transaction(async (tx) => {
      const row = { name, role, bio, photoUrl: photo };
      await tx
        .insert(staff)
        .values({ id, ...row, position: nextPosition(staff, staff.position) })
        .onConflictDoUpdate({ target: staff.id, set: row });
      await tx.delete(staffServices).where(eq(staffServices.staffId, id));
      const wanted = [...new Set(serviceIds)];
      const known = wanted.length
        ? new Set((await tx.select({ id: services.id }).from(services).where(inArray(services.id, wanted))).map((s) => s.id))
        : new Set<string>();
      const kept = wanted.filter((s) => known.has(s));
      if (kept.length) await tx.insert(staffServices).values(kept.map((serviceId) => ({ staffId: id, serviceId })));
      return { id, name, role, bio, photo, serviceIds: kept };
    });
    return ok(saved);
  });
}

export async function deleteStaffMember(id: string): Result<null> {
  return removeBy("deleteStaffMember", staff, id);
}

export async function savePortfolioItem(input: PortfolioItem): Result<PortfolioItem> {
  return adminEdit("savePortfolioItem", async () => {
    const parsed = parseInput(portfolioItemSchema, input);
    if ("failure" in parsed) return parsed.failure;
    const { id, ...row } = parsed.data;
    await db
      .insert(portfolioItems)
      .values({ id, ...row, position: nextPosition(portfolioItems, portfolioItems.position) })
      .onConflictDoUpdate({ target: portfolioItems.id, set: row });
    return ok(parsed.data);
  });
}

export async function deletePortfolioItem(id: string): Result<null> {
  return removeBy("deletePortfolioItem", portfolioItems, id);
}

export async function saveReview(input: Review): Result<Review> {
  return adminEdit("saveReview", async () => {
    const parsed = parseInput(reviewSchema, input);
    if ("failure" in parsed) return parsed.failure;
    const { id, ...fields } = parsed.data;
    const row = { ...fields, date: fields.date || null };
    await db
      .insert(reviews)
      .values({ id, ...row, position: nextPosition(reviews, reviews.position) })
      .onConflictDoUpdate({ target: reviews.id, set: row });
    return ok({ ...parsed.data, rating: parsed.data.rating as Review["rating"] });
  });
}

export async function deleteReview(id: string): Result<null> {
  return removeBy("deleteReview", reviews, id);
}

export async function saveOffer(input: Offer): Result<Offer> {
  return adminEdit("saveOffer", async () => {
    const parsed = parseInput(offerSchema, input);
    if ("failure" in parsed) return parsed.failure;
    const { id, ...fields } = parsed.data;
    const row = { ...fields, until: fields.until || null };
    await db
      .insert(offers)
      .values({ id, ...row, position: nextPosition(offers, offers.position) })
      .onConflictDoUpdate({ target: offers.id, set: row });
    return ok(parsed.data);
  });
}

export async function deleteOffer(id: string): Result<null> {
  return removeBy("deleteOffer", offers, id);
}

const LIST_TABLES = {
  services,
  staff,
  portfolio: portfolioItems,
  reviews,
  offers,
} satisfies Record<ContentList, PgTable & { id: PgColumn; position: PgColumn }>;

/** Saves the order the admin arranged a list in. Ids missing from `ids` keep their place after the listed ones. */
export async function reorderContent(list: ContentList, ids: string[]): Result<null> {
  return adminEdit("reorderContent", async () => {
    const parsed = parseInput(z.object({ list: z.enum(Object.keys(LIST_TABLES) as [ContentList]), ids: z.array(entityId).max(1000) }), { list, ids });
    if ("failure" in parsed) return parsed.failure;
    const table = LIST_TABLES[parsed.data.list];
    const order = [...new Set(parsed.data.ids)];
    if (order.length === 0) return ok(null);
    const cases = sql.join(
      order.map((id, i) => sql`when ${id} then ${i}::int`),
      sql` `,
    );
    await db.execute(sql`
      update ${table} set ${sql.identifier(table.position.name)} = case ${table.id} ${cases}
        else ${order.length}::int + ${table.position} end
    `);
    return ok(null);
  });
}

/**
 * Replaces the whole site (settings and every list) with a loaded site file.
 * Rows with the same id are updated in place, so bookings keep pointing at the same people.
 */
export async function importSite(input: SiteContent): Result<SiteContent> {
  return adminEdit("importSite", async () => {
    const parsed = siteSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const where = issue?.path.join(" › ") ?? "";
      return fail(`This site file has a problem${where ? ` at ${where}` : ""}: ${issue?.message ?? "it could not be read."}`);
    }
    const site = parsed.data;
    await db.transaction(async (tx) => {
      const keep = async (table: PgTable & { id: PgColumn }, ids: string[]) => {
        await tx.delete(table).where(ids.length ? notInArray(table.id, ids) : sql`true`);
      };
      await keep(offers, site.offers.map((o) => o.id));
      await keep(reviews, site.reviews.map((r) => r.id));
      await keep(portfolioItems, site.portfolio.map((p) => p.id));
      await keep(staff, site.staff.map((m) => m.id));
      await keep(services, site.services.map((s) => s.id));

      for (const [position, { id, ...s }] of site.services.entries()) {
        const row = { ...s, note: s.note ?? null, position };
        await tx.insert(services).values({ id, ...row }).onConflictDoUpdate({ target: services.id, set: row });
      }
      const serviceIds = new Set(site.services.map((s) => s.id));
      await tx.delete(staffServices);
      for (const [position, m] of site.staff.entries()) {
        const row = { name: m.name, role: m.role, bio: m.bio, photoUrl: m.photo, position };
        await tx.insert(staff).values({ id: m.id, ...row }).onConflictDoUpdate({ target: staff.id, set: row });
        const links = [...new Set(m.serviceIds)].filter((s) => serviceIds.has(s)).map((serviceId) => ({ staffId: m.id, serviceId }));
        if (links.length) await tx.insert(staffServices).values(links);
      }
      for (const [position, { id, ...p }] of site.portfolio.entries()) {
        const row = { ...p, position };
        await tx.insert(portfolioItems).values({ id, ...row }).onConflictDoUpdate({ target: portfolioItems.id, set: row });
      }
      for (const [position, { id, ...r }] of site.reviews.entries()) {
        const row = { ...r, date: r.date || null, position };
        await tx.insert(reviews).values({ id, ...row }).onConflictDoUpdate({ target: reviews.id, set: row });
      }
      for (const [position, { id, ...o }] of site.offers.entries()) {
        const row = { ...o, until: o.until || null, position };
        await tx.insert(offers).values({ id, ...row }).onConflictDoUpdate({ target: offers.id, set: row });
      }
      const data = site.settings as Settings;
      await tx.insert(siteSettings).values({ id: 1, data }).onConflictDoUpdate({ target: siteSettings.id, set: { data } });
    });
    return ok(site as SiteContent);
  });
}

"use server";

import { eq, inArray, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { ActionResult, Offer, PortfolioItem, Review, Service, Settings, StaffMember } from "@/lib/types";
import { db } from "../db";
import { offers, portfolioItems, reviews, services, siteSettings, staff, staffServices } from "../db/schema";
import {
  entityId,
  offerSchema,
  portfolioItemSchema,
  reviewSchema,
  serviceSchema,
  settingsSchema,
  staffMemberSchema,
} from "../validation";
import { asStaff, ok, parseInput, publicContentChanged } from "./util";

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
    const { id, ...row } = parsed.data;
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
    const { id, ...row } = parsed.data;
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

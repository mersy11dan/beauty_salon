"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult, Appointment, AppointmentStatus } from "@/lib/types";
import { clientIp, rateLimit, waitMessage } from "../auth/rate-limit";
import { getCustomer } from "../auth/session";
import { freeSlots, resolveChoice } from "../booking";
import { getPublicData } from "../data/public";
import { loadAppointmentsOn, toAppointment } from "../data/ops";
import { db } from "../db";
import { appointments } from "../db/schema";
import { newId } from "../ids";
import { bookingSchema, entityId, isoDate } from "../validation";
import { asStaff, fail, guarded, ok, parseInput } from "./util";

export type BookingRequest = {
  serviceId: string;
  staffId: string | null;
  date: string;
  time: string;
  guestName: string;
  guestPhone: string;
  note?: string;
};

const TAKEN = "Someone just booked that time. Pick another one.";

export async function requestAppointment(input: BookingRequest): Promise<ActionResult<Appointment>> {
  return guarded("requestAppointment", async () => {
    const customer = await getCustomer();
    if (!customer) return fail("Your session has ended. Sign in again to send this request.");

    const parsed = parseInput(bookingSchema, input);
    if ("failure" in parsed) return parsed.failure;
    const req = parsed.data;

    const [byGuest, byIp] = await Promise.all([
      rateLimit(`booking:${customer.id}`, 12, 60 * 60),
      rateLimit(`booking:ip:${await clientIp()}`, 40, 60 * 60),
    ]);
    const limited = !byGuest.ok ? byGuest : !byIp.ok ? byIp : null;
    if (limited) return fail(waitMessage(limited.retryAfterSec), "time");

    const data = await getPublicData();
    const resolved = resolveChoice(data, req);
    if (resolved.error) return fail(resolved.error, "time");

    // One booking per salon day at a time, so two guests can't take the last chair together.
    const row = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`booking:${req.date}`}))`);
      const busy = await tx
        .select({ time: appointments.time, durationMin: appointments.durationMin, staffId: appointments.staffId })
        .from(appointments)
        .where(and(eq(appointments.date, req.date), ne(appointments.status, "cancelled")));
      if (!freeSlots(data, resolved, req.date, busy).includes(req.time)) return null;
      const [created] = await tx
        .insert(appointments)
        .values({
          id: newId("apt"),
          customerId: customer.id,
          guestName: req.guestName,
          guestPhone: req.guestPhone,
          serviceId: resolved.service.id,
          staffId: resolved.staffId,
          date: req.date,
          time: req.time,
          durationMin: resolved.service.durationMin,
          status: "requested",
          note: req.note ?? null,
        })
        .returning();
      return created;
    });
    if (!row) return fail(TAKEN, "time");
    return ok(toAppointment(row));
  });
}

const statusSchema = z.enum(["requested", "confirmed", "completed", "cancelled"]);

export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<ActionResult<Appointment>> {
  return asStaff("setAppointmentStatus", ["admin", "staff"], async () => {
    const parsed = parseInput(z.object({ id: entityId, status: statusSchema }), { id, status });
    if ("failure" in parsed) return parsed.failure;
    const [row] = await db
      .update(appointments)
      .set({ status: parsed.data.status })
      .where(eq(appointments.id, parsed.data.id))
      .returning();
    if (!row) return fail("That booking was removed. Refresh to see the latest list.");
    return ok(toAppointment(row));
  });
}

/** Every booking on one day, for desk days outside the preloaded window. */
export async function appointmentsOn(date: string): Promise<ActionResult<Appointment[]>> {
  return asStaff("appointmentsOn", ["admin", "staff"], async () => {
    const parsed = parseInput(isoDate, date);
    if ("failure" in parsed) return parsed.failure;
    return ok(await loadAppointmentsOn(parsed.data));
  });
}

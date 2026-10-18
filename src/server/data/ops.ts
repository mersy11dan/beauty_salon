import "server-only";
import { and, asc, desc, eq, gte, ne, or } from "drizzle-orm";
import { addDays } from "@/lib/dates";
import type { Appointment, OpsSnapshot, Payment } from "@/lib/types";
import { db } from "../db";
import { appointments, payments } from "../db/schema";

type AppointmentRow = typeof appointments.$inferSelect;
type PaymentRow = typeof payments.$inferSelect;

export function toAppointment(r: AppointmentRow): Appointment {
  return {
    id: r.id,
    ...(r.customerId ? { customerId: r.customerId } : {}),
    guestName: r.guestName,
    guestPhone: r.guestPhone,
    serviceId: r.serviceId,
    staffId: r.staffId,
    date: r.date,
    time: r.time,
    durationMin: r.durationMin,
    status: r.status,
    ...(r.note ? { note: r.note } : {}),
    createdAt: r.createdAt.toISOString(),
  };
}

export function toPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    amount: r.amount,
    method: r.method,
    status: r.status,
    appointmentId: r.appointmentId,
    label: r.label,
    date: r.date,
    createdAt: r.createdAt.toISOString(),
  };
}

/** How far back the desk loads on open. Older days are fetched when someone pages back to them. */
export const APPOINTMENT_HISTORY_DAYS = 45;
export const PAYMENT_HISTORY_DAYS = 120;

/** Recent and upcoming bookings plus recent and outstanding payments, for the desk and admin. */
export async function loadOpsData(today: string): Promise<OpsSnapshot> {
  const since = addDays(today, -APPOINTMENT_HISTORY_DAYS);
  const [apts, pays] = await Promise.all([
    db
      .select()
      .from(appointments)
      .where(gte(appointments.date, since))
      .orderBy(asc(appointments.date), asc(appointments.time)),
    db
      .select()
      .from(payments)
      .where(or(gte(payments.date, addDays(today, -PAYMENT_HISTORY_DAYS)), eq(payments.status, "unpaid")))
      .orderBy(desc(payments.date), desc(payments.createdAt)),
  ]);
  return { appointments: apts.map(toAppointment), payments: pays.map(toPayment), since };
}

export async function loadAppointmentsOn(date: string) {
  const rows = await db.select().from(appointments).where(eq(appointments.date, date)).orderBy(asc(appointments.time));
  return rows.map(toAppointment);
}

/** Bookings that still hold a chair on `date`, without any guest details. */
export async function loadBusyBlocks(date: string) {
  return db
    .select({ time: appointments.time, durationMin: appointments.durationMin, staffId: appointments.staffId })
    .from(appointments)
    .where(and(eq(appointments.date, date), ne(appointments.status, "cancelled")));
}

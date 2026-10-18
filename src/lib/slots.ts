import { fromISODate, hhmmOf, minutesOf, toISODate, weekdayOf } from "./dates";
import type { Appointment, Hours } from "./types";

const STEP_MIN = 30;

type SlotInput = {
  date: string;
  durationMin: number;
  hours: Hours;
  appointments: Appointment[];
  /** Chosen staff member, or null for "anyone". */
  staffId: string | null;
  /** All bookable staff ids (used when staffId is null and staff module is on). */
  staffPool: string[];
  /** Concurrent bookings when staff is not part of booking. */
  capacity: number;
  /** "HH:MM" earliest allowed start when the date is today. */
  notBefore?: string;
};

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Returns the list of start times ("HH:MM") that fit inside opening hours
 * and do not collide with existing non-cancelled appointments.
 */
export function availableSlots(input: SlotInput): string[] {
  const day = input.hours[weekdayOf(input.date)];
  if (!day) return [];

  const open = minutesOf(day.open);
  const close = minutesOf(day.close);
  const notBefore = input.notBefore ? minutesOf(input.notBefore) : -1;

  const sameDay = input.appointments.filter(
    (a) => a.date === input.date && a.status !== "cancelled",
  );

  const slots: string[] = [];
  for (let start = open; start + input.durationMin <= close; start += STEP_MIN) {
    if (start <= notBefore) continue;
    const end = start + input.durationMin;

    const busy = sameDay.filter((a) => {
      const aStart = minutesOf(a.time);
      return overlaps(start, end, aStart, aStart + a.durationMin);
    });

    let free: boolean;
    if (input.staffId) {
      free = !busy.some((a) => a.staffId === input.staffId);
    } else if (input.staffPool.length > 0) {
      const busyStaff = new Set(busy.map((a) => a.staffId).filter(Boolean));
      const unassigned = busy.filter((a) => !a.staffId).length;
      free = busyStaff.size + unassigned < input.staffPool.length;
    } else {
      free = busy.length < input.capacity;
    }

    if (free) slots.push(hhmmOf(start));
  }
  return slots;
}

/** Next `count` dates starting today, skipping closed days. */
export function upcomingOpenDates(hours: Hours, fromISO: string, count: number) {
  const out: string[] = [];
  const cursor = fromISODate(fromISO);
  let guard = 0;
  while (out.length < count && guard < 60) {
    if (hours[cursor.getDay() as keyof Hours]) out.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return out;
}

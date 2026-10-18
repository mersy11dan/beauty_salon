import "server-only";
import { hhmmOf, nowInZone } from "@/lib/dates";
import { availableSlots, type BusyBlock } from "@/lib/slots";
import type { PublicData } from "@/lib/types";

const BOOKING_HORIZON_DAYS = 120;

type Choice = { serviceId: string; staffId: string | null; date: string };

/** Resolves what the guest picked against the live menu. Returns an error sentence when it no longer fits. */
export function resolveChoice(data: PublicData, choice: Choice) {
  const { settings } = data;
  if (!settings.modules.booking) return { error: "Online booking is switched off. Please call us to book." } as const;

  const service = data.services.find((s) => s.id === choice.serviceId);
  if (!service) return { error: "That service is no longer on the menu. Pick another." } as const;

  const staffOn = settings.modules.staff && data.staff.length > 0;
  const eligible = data.staff.filter((m) => m.serviceIds.length === 0 || m.serviceIds.includes(service.id));
  let staffId: string | null = null;
  if (staffOn && choice.staffId) {
    if (!eligible.some((m) => m.id === choice.staffId)) return { error: "That person doesn't do this service. Pick someone else." } as const;
    staffId = choice.staffId;
  }

  const now = nowInZone(settings.timeZone);
  if (choice.date < now.date) return { error: "That day has passed. Pick another." } as const;
  const horizon = new Date(`${now.date}T00:00:00Z`);
  horizon.setUTCDate(horizon.getUTCDate() + BOOKING_HORIZON_DAYS);
  if (choice.date > horizon.toISOString().slice(0, 10)) return { error: "That day is too far ahead to book online." } as const;

  return {
    service,
    staffId,
    staffPool: staffOn ? eligible.map((m) => m.id) : [],
    notBefore: choice.date === now.date ? hhmmOf(Math.ceil(now.minutes / 30) * 30) : undefined,
  } as const;
}

export function freeSlots(data: PublicData, resolved: Exclude<ReturnType<typeof resolveChoice>, { error: string }>, date: string, busy: BusyBlock[]) {
  return availableSlots({
    date,
    durationMin: resolved.service.durationMin,
    hours: data.settings.hours,
    busy,
    staffId: resolved.staffId,
    staffPool: resolved.staffPool,
    capacity: data.settings.capacity,
    notBefore: resolved.notBefore,
  });
}

"use client";

import { useCallback, useMemo } from "react";
import { resolveCopy } from "./copy";
import { formatTime } from "./dates";
import { formatMoney } from "./format";
import { useSalonStore } from "./store";

/** Every fixed phrase on the public site, with the admin's changes applied. */
export function useCopy() {
  const overrides = useSalonStore((s) => s.settings.copy);
  return useMemo(() => resolveCopy(overrides), [overrides]);
}

/** Formats prices in the salon's currency. */
export function useMoney() {
  const currency = useSalonStore((s) => s.settings.currency);
  return useCallback((amount: number) => formatMoney(amount, currency), [currency]);
}

/** Formats "HH:MM" on the salon's 12- or 24-hour clock. */
export function useTime() {
  const clock = useSalonStore((s) => s.settings.clock);
  return useCallback((hhmm: string) => formatTime(hhmm, clock), [clock]);
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { appointmentsOn, setAppointmentStatus } from "@/server/actions/bookings";
import { addPayment, deletePayment, setPaymentStatus, type NewPayment } from "@/server/actions/payments";
import { call } from "./call";
import { NOT_SIGNED_IN } from "./messages";
import type { ActionResult, Appointment, AppointmentStatus, OpsSnapshot, Payment, PaymentStatus } from "./types";

type OpsState = OpsSnapshot & {
  /** Days before `since`, fetched when someone pages back to them. */
  extraDays: Record<string, "loading" | "loaded" | "error">;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<ActionResult<Appointment>>;
  addPayment: (input: NewPayment) => Promise<ActionResult<Payment>>;
  updatePayment: (id: string, patch: { status: PaymentStatus }) => Promise<ActionResult<Payment>>;
  removePayment: (id: string) => Promise<ActionResult>;
  ensureDay: (date: string) => Promise<void>;
  refresh: () => Promise<void>;
};

type Hooks = { notify: (text: string) => void; onSignedOut: () => void };

export type OpsStore = StoreApi<OpsState>;

const POLL_MS = 30_000;

function createOpsStore(initial: OpsSnapshot, hooks: Hooks): OpsStore {
  return createStore<OpsState>()((set, get) => {
    // A poll that started before an edit could carry the old value, so it is dropped.
    let pending = 0;
    let seq = 0;

    /** `inline` results are shown by the form that sent them, so the banner stays quiet. */
    async function mutate<T>(fn: () => Promise<ActionResult<T>>, { inline = false } = {}) {
      pending++;
      seq++;
      try {
        const result = await call(fn);
        if (!result.ok) {
          if (!inline) hooks.notify(result.error);
          if (result.error === NOT_SIGNED_IN) hooks.onSignedOut();
        }
        return result;
      } finally {
        pending--;
      }
    }

    const patchAppointment = (id: string, patch: Partial<Appointment>) =>
      set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
    const patchPayment = (id: string, patch: Partial<Payment>) =>
      set((s) => ({ payments: s.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

    return {
      ...initial,
      extraDays: {},

      setAppointmentStatus: async (id, status) => {
        const before = get().appointments.find((a) => a.id === id);
        patchAppointment(id, { status });
        const result = await mutate(() => setAppointmentStatus(id, status));
        if (result.ok) patchAppointment(id, result.data);
        else if (before) patchAppointment(id, { status: before.status });
        return result;
      },

      addPayment: async (input) => {
        const result = await mutate(() => addPayment(input), { inline: true });
        if (result.ok) set((s) => ({ payments: [result.data, ...s.payments.filter((p) => p.id !== result.data.id)] }));
        return result;
      },

      updatePayment: async (id, patch) => {
        const before = get().payments.find((p) => p.id === id);
        patchPayment(id, patch);
        const result = await mutate(() => setPaymentStatus(id, patch.status));
        if (result.ok) patchPayment(id, result.data);
        else if (before) patchPayment(id, { status: before.status });
        return result;
      },

      removePayment: async (id) => {
        const before = get().payments;
        set({ payments: before.filter((p) => p.id !== id) });
        const result = await mutate(() => deletePayment(id));
        if (!result.ok) {
          const removed = before.find((p) => p.id === id);
          if (removed) set((s) => ({ payments: s.payments.some((p) => p.id === id) ? s.payments : [...s.payments, removed] }));
        }
        return result;
      },

      ensureDay: async (date) => {
        const { since, extraDays } = get();
        if (date >= since || extraDays[date] === "loading" || extraDays[date] === "loaded") return;
        set((s) => ({ extraDays: { ...s.extraDays, [date]: "loading" } }));
        const result = await call(() => appointmentsOn(date));
        if (!result.ok) {
          set((s) => ({ extraDays: { ...s.extraDays, [date]: "error" } }));
          hooks.notify(result.error);
          return;
        }
        set((s) => ({
          appointments: [...s.appointments.filter((a) => a.date !== date), ...result.data],
          extraDays: { ...s.extraDays, [date]: "loaded" },
        }));
      },

      refresh: async () => {
        if (pending > 0) return;
        const startedAt = seq;
        let res: Response;
        try {
          res = await fetch("/api/ops/snapshot", { cache: "no-store" });
        } catch {
          return;
        }
        if (res.status === 401) return hooks.onSignedOut();
        if (!res.ok) return;
        const fresh = (await res.json().catch(() => null)) as OpsSnapshot | null;
        if (!fresh || pending > 0 || seq !== startedAt) return;
        set((s) => ({
          appointments: [...s.appointments.filter((a) => a.date < fresh.since), ...fresh.appointments],
          payments: fresh.payments,
          since: fresh.since,
        }));
      },
    };
  });
}

const OpsContext = createContext<OpsStore | null>(null);

/** Bookings and payments for signed-in staff. Re-reads the server every 30 seconds while the tab is visible. */
/** `hooks` is read once, so it must not close over values that change between renders. */
export function OpsProvider({ initial, hooks, children }: { initial: OpsSnapshot; hooks: Hooks; children: React.ReactNode }) {
  const [store] = useState(() => createOpsStore(initial, hooks));

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void store.getState().refresh();
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [store]);

  return <OpsContext.Provider value={store}>{children}</OpsContext.Provider>;
}

export function useOps<T>(selector: (s: OpsState) => T): T {
  const store = useContext(OpsContext);
  if (!store) throw new Error("useOps must be used inside <OpsProvider>");
  return useStore(store, selector);
}

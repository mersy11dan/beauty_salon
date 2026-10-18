"use client";

import { createContext, useContext } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as live from "@/server/actions";
import { CONTENT_KEYS, mergeSettings, pickContent } from "./content";
import { addDays, todayISO } from "./dates";
import { uid } from "./format";
import { createSeed, DEMO_ACCOUNTS } from "./seed";
import { availableSlots } from "./slots";
import type {
  Appointment,
  AppointmentStatus,
  Customer,
  DataMode,
  ModuleKey,
  Offer,
  Payment,
  PortfolioItem,
  Review,
  Role,
  SalonData,
  Service,
  Session,
  Settings,
  SiteContent,
  StaffMember,
  Theme,
} from "./types";

type Accounts = typeof DEMO_ACCOUNTS;

export type ListKey = "services" | "staff" | "portfolio" | "reviews" | "offers";

export type BookingInput = Omit<Appointment, "id" | "status" | "createdAt">;
export type BookingResult = { ok: true; appointment: Appointment } | { ok: false; error: "taken" | "auth" | "failed" };
export type SignUpResult = { ok: true; customer: Customer } | { ok: false; error: "exists" | "failed" };

/** Live mode only: whether the admin's latest edits have reached the database. */
export type Sync = { status: "idle" | "pending" | "saving" | "saved" | "error"; message?: string };

type Actions = {
  updateSettings: (patch: Partial<Settings>) => void;
  setTheme: (patch: Partial<Theme>) => void;
  setModule: (key: ModuleKey, on: boolean) => void;

  upsertService: (item: Service) => void;
  removeService: (id: string) => void;
  upsertStaff: (item: StaffMember) => void;
  removeStaff: (id: string) => void;
  upsertPortfolio: (item: PortfolioItem) => void;
  removePortfolio: (id: string) => void;
  upsertReview: (item: Review) => void;
  removeReview: (id: string) => void;
  upsertOffer: (item: Offer) => void;
  removeOffer: (id: string) => void;
  /** Swaps an item with its neighbour; the public site shows lists in this order. */
  moveItem: (list: ListKey, id: string, dir: -1 | 1) => void;
  /** Swaps in a whole website, e.g. from a site file. In live mode the caller has already saved it. */
  replaceContent: (content: SiteContent) => void;

  createAppointment: (input: BookingInput) => Promise<BookingResult>;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;

  addPayment: (input: Omit<Payment, "id" | "createdAt">) => Payment;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  removePayment: (id: string) => void;

  /** "setup" means the live site has no admin login configured yet. */
  signIn: (email: string, password: string) => Promise<Role | "setup" | null>;
  signOut: () => void;
  /** Resolves to an error message, or null when saved. */
  setStaffAccount: (email: string, password: string) => Promise<string | null>;

  createCustomer: (input: Pick<Customer, "name" | "email" | "phone" | "password">) => Promise<SignUpResult>;
  signInCustomer: (email: string, password: string) => Promise<Customer | null>;
  signOutCustomer: () => void;

  resetDemo: () => void;

  /** Live mode: makes sure bookings and payments for these "YYYY-MM" months are loaded. */
  loadMonths: (months: string[]) => Promise<void>;
  /** Live mode: reloads sign-in state, bookings and payments. */
  refreshLive: () => Promise<void>;
  /** Live mode: refreshes only if a booking or payment changed elsewhere. */
  pollLive: () => Promise<void>;
};

export type SalonState = SalonData & {
  mode: DataMode;
  session: Session;
  /** The guest signed in on the public site, if any. */
  customerId: string | null;
  accounts: Accounts;
  /** False until saved data (demo) or the first server load (live) has arrived. */
  ready: boolean;
  sync: Sync;
  months: string[];
  rev: number;
} & Actions;

type Set = StoreApi<SalonState>["setState"];
type Get = StoreApi<SalonState>["getState"];

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const monthOf = (iso: string) => iso.slice(0, 7);

function upsert<T extends { id: string }>(list: T[], item: T) {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}

/** Last month through two months ahead: the desk's week view and the booking horizon. */
function defaultMonths() {
  const today = todayISO();
  const first = `${monthOf(today)}-01`;
  return [addDays(first, -1), first, addDays(first, 32), addDays(first, 63)].map(monthOf);
}

/** The desk keeps at most this many months of bookings and payments in memory. */
export const MAX_MONTHS = 12;

const BLANK_ACCOUNTS: Accounts = { admin: { email: "", password: "" }, staff: { email: "", password: "" } };

function build(set: Set, get: Get, mode: DataMode, content: SiteContent | null): SalonState {
  const isLive = mode === "live";
  const seed = createSeed();
  const data: SalonData = isLive && content ? { ...content, appointments: [], payments: [], customers: [] } : seed;

  /** Runs a desk write against the server and reports failures in the sync badge. */
  const send = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    if (!isLive) return;
    set({ sync: { status: "saving" } });
    fn()
      .then((r) =>
        set({ sync: r.ok ? { status: "saved" } : { status: "error", message: r.error ?? "That change was not saved. Reload and try again." } }),
      )
      .catch(() => set({ sync: { status: "error", message: "No connection. That change was not saved." } }));
  };

  async function refresh(months: string[]) {
    const snap = await live.loadLive(months);
    set((s) => ({
      session: snap.session,
      customerId: snap.customer?.id ?? null,
      customers: snap.customer ? [snap.customer] : [],
      appointments: snap.appointments,
      payments: snap.payments,
      months: snap.months,
      rev: snap.rev,
      accounts: { admin: { email: snap.session?.role === "admin" ? snap.session.email : "", password: "" }, staff: { email: snap.staffEmail ?? s.accounts.staff.email, password: "" } },
      ready: true,
    }));
  }

  return {
    ...data,
    mode,
    session: null,
    customerId: null,
    accounts: isLive ? BLANK_ACCOUNTS : DEMO_ACCOUNTS,
    ready: false,
    sync: { status: "idle" },
    months: [],
    rev: 0,

    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    setTheme: (patch) => set((s) => ({ settings: { ...s.settings, theme: { ...s.settings.theme, ...patch } } })),
    setModule: (key, on) =>
      set((s) => ({ settings: { ...s.settings, modules: { ...s.settings.modules, [key]: on } } })),

    upsertService: (item) => set((s) => ({ services: upsert(s.services, item) })),
    removeService: (id) => set((s) => ({ services: s.services.filter((x) => x.id !== id) })),
    upsertStaff: (item) => set((s) => ({ staff: upsert(s.staff, item) })),
    removeStaff: (id) => set((s) => ({ staff: s.staff.filter((x) => x.id !== id) })),
    upsertPortfolio: (item) => set((s) => ({ portfolio: upsert(s.portfolio, item) })),
    removePortfolio: (id) => set((s) => ({ portfolio: s.portfolio.filter((x) => x.id !== id) })),
    upsertReview: (item) => set((s) => ({ reviews: upsert(s.reviews, item) })),
    removeReview: (id) => set((s) => ({ reviews: s.reviews.filter((x) => x.id !== id) })),
    upsertOffer: (item) => set((s) => ({ offers: upsert(s.offers, item) })),
    removeOffer: (id) => set((s) => ({ offers: s.offers.filter((x) => x.id !== id) })),
    moveItem: (list, id, dir) =>
      set((s) => {
        const items: { id: string }[] = s[list].slice();
        const i = items.findIndex((x) => x.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= items.length) return {};
        [items[i], items[j]] = [items[j], items[i]];
        return { [list]: items } as Partial<SalonState>;
      }),
    replaceContent: (c) => set({ ...pickContent(c), settings: mergeSettings(createSeed().settings, c.settings) }),

    createAppointment: async (input) => {
      if (isLive) {
        try {
          const r = await live.requestBooking(input);
          if (r.ok) {
            set((s) => ({ appointments: [...s.appointments, r.appointment] }));
            return r;
          }
          if (r.error === "auth") set({ customerId: null, customers: [] });
          if (r.error === "taken") void refresh(get().months.length ? get().months : defaultMonths()).catch(() => undefined);
          return { ok: false, error: r.error === "taken" || r.error === "auth" ? r.error : "failed" };
        } catch {
          return { ok: false, error: "failed" };
        }
      }
      const s = get();
      const staffOn = s.settings.modules.staff && s.staff.length > 0;
      const service = s.services.find((x) => x.id === input.serviceId);
      const pool = service ? s.staff.filter((m) => m.serviceIds.length === 0 || m.serviceIds.includes(service.id)) : [];
      const free = availableSlots({
        date: input.date,
        durationMin: input.durationMin,
        hours: s.settings.hours,
        appointments: s.appointments,
        staffId: input.staffId,
        staffPool: staffOn ? pool.map((m) => m.id) : [],
        capacity: s.settings.capacity,
      });
      if (!free.includes(input.time)) return { ok: false, error: "taken" };
      const appointment: Appointment = { ...input, id: uid("apt"), status: "requested", createdAt: new Date().toISOString() };
      set((st) => ({ appointments: [...st.appointments, appointment] }));
      return { ok: true, appointment };
    },
    setAppointmentStatus: (id, status) => {
      set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)) }));
      send(() => live.changeAppointmentStatus(id, status));
    },

    addPayment: (input) => {
      const p: Payment = { ...input, id: uid("pay"), createdAt: new Date().toISOString() };
      set((s) => ({ payments: [p, ...s.payments] }));
      send(() => live.addPaymentLive(p));
      return p;
    },
    updatePayment: (id, patch) => {
      set((s) => ({ payments: s.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
      send(() => live.updatePaymentLive(id, patch));
    },
    removePayment: (id) => {
      set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
      send(() => live.removePaymentLive(id));
    },

    signIn: async (email, password) => {
      if (isLive) {
        const r = await live.opsSignIn(email, password);
        if (!r.ok) return r.error === "setup" ? "setup" : null;
        set({ session: r.session });
        await refresh(defaultMonths()).catch(() => undefined);
        return r.session.role;
      }
      const { accounts } = get();
      const e = normalizeEmail(email);
      let role: Role | null = null;
      if (e === accounts.admin.email.toLowerCase() && password === accounts.admin.password) role = "admin";
      else if (e === accounts.staff.email.toLowerCase() && password === accounts.staff.password) role = "staff";
      if (role) set({ session: { role, email: e } });
      return role;
    },
    signOut: () => {
      set({ session: null });
      if (isLive) {
        set({ appointments: [], payments: [] });
        void live
          .opsSignOut()
          .then(() => refresh(defaultMonths()))
          .catch(() => undefined);
      }
    },
    setStaffAccount: async (email, password) => {
      if (isLive) {
        try {
          const r = await live.saveStaffLogin(email, password);
          if (!r.ok) return r.error;
          set((s) => ({ accounts: { ...s.accounts, staff: { email: normalizeEmail(email), password: "" } } }));
          return null;
        } catch {
          return "No connection. The login was not saved.";
        }
      }
      set((s) => ({ accounts: { ...s.accounts, staff: { email, password } } }));
      return null;
    },

    createCustomer: async (input) => {
      if (isLive) {
        try {
          const r = await live.guestSignUp(input);
          if (!r.ok) return { ok: false, error: r.error === "exists" ? "exists" : "failed" };
          set({ customers: [r.customer], customerId: r.customer.id });
          return r;
        } catch {
          return { ok: false, error: "failed" };
        }
      }
      const email = normalizeEmail(input.email);
      if (get().customers.some((c) => c.email === email)) return { ok: false, error: "exists" };
      const customer: Customer = {
        id: uid("cus"),
        name: input.name.trim(),
        email,
        phone: input.phone.trim(),
        password: input.password,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({ customers: [...s.customers, customer], customerId: customer.id }));
      return { ok: true, customer };
    },
    signInCustomer: async (email, password) => {
      if (isLive) {
        try {
          const r = await live.guestSignIn(email, password);
          if (!r.ok) return null;
          set({ customers: [r.customer], customerId: r.customer.id });
          return r.customer;
        } catch {
          return null;
        }
      }
      const e = normalizeEmail(email);
      const customer = get().customers.find((c) => c.email === e && c.password === password) ?? null;
      if (customer) set({ customerId: customer.id });
      return customer;
    },
    signOutCustomer: () => {
      set({ customerId: null });
      if (isLive) {
        set({ customers: [] });
        void live.guestSignOut().catch(() => undefined);
      }
    },

    resetDemo: () => {
      if (isLive) return;
      set({ ...createSeed(), accounts: DEMO_ACCOUNTS, session: get().session });
    },

    loadMonths: async (months) => {
      if (!isLive) return;
      const missing = months.filter((m) => !get().months.includes(m));
      if (missing.length === 0) return;
      const snap = await live.loadLive(missing);
      set((s) => ({
        appointments: [...s.appointments.filter((a) => !missing.includes(monthOf(a.date))), ...snap.appointments],
        payments: [...s.payments.filter((p) => !missing.includes(monthOf(p.date))), ...snap.payments],
        months: Array.from(new Set([...s.months, ...snap.months])),
      }));
    },
    refreshLive: async () => {
      if (!isLive) return;
      const months = Array.from(new Set([...defaultMonths(), ...get().months])).slice(0, MAX_MONTHS);
      await refresh(months).catch(() => set({ ready: true, sync: { status: "error", message: "Could not reach the database." } }));
    },
    pollLive: async () => {
      if (!isLive || !get().session) return;
      const rev = await live.readRevision().catch(() => null);
      if (rev !== null && rev !== get().rev) await get().refreshLive();
    },
  };
}

/** Saves the admin's content edits to the database, debounced, one request at a time. */
function autosave(store: StoreApi<SalonState>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let saving = false;
  let again = false;
  let skip = false;

  const flush = async () => {
    if (saving) {
      again = true;
      return;
    }
    saving = true;
    store.setState({ sync: { status: "saving" } });
    try {
      const sent = pickContent(store.getState());
      const r = await live.saveSite(sent);
      store.setState({ sync: r.ok ? { status: "saved" } : { status: "error", message: r.error } });
      // Inline images come back as media links; swap them in so later saves stay small.
      const now = store.getState();
      if (r.ok && !again && CONTENT_KEYS.every((k) => now[k] === sent[k]) && JSON.stringify(sent).includes('"data:image/')) {
        now.replaceContent(r.content);
      }
    } catch {
      store.setState({ sync: { status: "error", message: "Not saved. Check the connection; it will retry on your next change." } });
    } finally {
      saving = false;
      if (again) {
        again = false;
        void flush();
      }
    }
  };

  const original = store.getState().replaceContent;
  store.setState({
    replaceContent: (c) => {
      skip = true;
      original(c);
    },
  });

  store.subscribe((s, prev) => {
    if (CONTENT_KEYS.every((k) => s[k] === prev[k])) return;
    if (skip) {
      skip = false;
      return;
    }
    if (s.session?.role !== "admin") return;
    clearTimeout(timer);
    store.setState({ sync: { status: "pending" } });
    timer = setTimeout(flush, 700);
  });
}

export type SalonStore = { store: StoreApi<SalonState>; start: () => () => void };

export function createSalonStore(mode: DataMode, content: SiteContent | null): SalonStore {
  if (mode === "live") {
    const store = createStore<SalonState>()((set, get) => build(set, get, mode, content));
    autosave(store);
    return {
      store,
      start: () => {
        void store.getState().refreshLive();
        return () => undefined;
      },
    };
  }

  const store = createStore<SalonState>()(
    persist((set, get) => build(set, get, mode, null), {
      name: "beauty-salon-demo",
      version: 2,
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<SalonState>;
        // v2: the demo portfolio moved from the three hero cut-outs to the real photo sets.
        if (version < 2) return { ...p, portfolio: createSeed().portfolio };
        return p;
      },
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        settings: s.settings,
        services: s.services,
        staff: s.staff,
        portfolio: s.portfolio,
        reviews: s.reviews,
        offers: s.offers,
        appointments: s.appointments,
        payments: s.payments,
        customers: s.customers,
        session: s.session,
        customerId: s.customerId,
        accounts: s.accounts,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SalonState>;
        return {
          ...current,
          ...p,
          settings: mergeSettings(current.settings, p.settings),
          accounts: { ...current.accounts, ...p.accounts },
        };
      },
    }),
  );
  return {
    store,
    start: () => {
      const unsub = store.persist.onFinishHydration(() => store.setState({ ready: true }));
      void store.persist.rehydrate();
      return unsub;
    },
  };
}

export const StoreContext = createContext<StoreApi<SalonState> | null>(null);

export function useSalonStoreApi() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useSalonStore needs <SalonProvider> above it.");
  return store;
}

export function useSalonStore<T>(selector: (s: SalonState) => T): T {
  return useStore(useSalonStoreApi(), selector);
}

/** Convenience selectors */
export const useSettings = () => useSalonStore((s) => s.settings);
export const useModules = () => useSalonStore((s) => s.settings.modules);
export const useSession = () => useSalonStore((s) => s.session);
export const useDataMode = () => useSalonStore((s) => s.mode);
export const useCustomer = () =>
  useSalonStore((s) => (s.customerId ? (s.customers.find((c) => c.id === s.customerId) ?? null) : null));

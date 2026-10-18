"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { uid } from "./format";
import { createSeed, DEMO_ACCOUNTS } from "./seed";
import type {
  Appointment,
  AppointmentStatus,
  Customer,
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
  StaffMember,
  Theme,
} from "./types";

type Accounts = typeof DEMO_ACCOUNTS;

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

  createAppointment: (
    input: Omit<Appointment, "id" | "status" | "createdAt">,
  ) => Appointment;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;

  addPayment: (input: Omit<Payment, "id" | "createdAt">) => Payment;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  removePayment: (id: string) => void;

  signIn: (email: string, password: string) => Role | null;
  signOut: () => void;
  setStaffAccount: (email: string, password: string) => void;

  /** Returns null when the email already has an account. */
  createCustomer: (input: Pick<Customer, "name" | "email" | "phone" | "password">) => Customer | null;
  signInCustomer: (email: string, password: string) => Customer | null;
  signOutCustomer: () => void;

  resetDemo: () => void;
};

export type SalonState = SalonData & {
  session: Session;
  /** The guest signed in on the public site, if any. */
  customerId: string | null;
  accounts: Accounts;
} & Actions;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function upsert<T extends { id: string }>(list: T[], item: T) {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}

export const useSalonStore = create<SalonState>()(
  persist(
    (set, get) => ({
      ...createSeed(),
      session: null,
      customerId: null,
      accounts: DEMO_ACCOUNTS,

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      setTheme: (patch) =>
        set((s) => ({
          settings: { ...s.settings, theme: { ...s.settings.theme, ...patch } },
        })),
      setModule: (key, on) =>
        set((s) => ({
          settings: {
            ...s.settings,
            modules: { ...s.settings.modules, [key]: on },
          },
        })),

      upsertService: (item) => set((s) => ({ services: upsert(s.services, item) })),
      removeService: (id) =>
        set((s) => ({ services: s.services.filter((x) => x.id !== id) })),
      upsertStaff: (item) => set((s) => ({ staff: upsert(s.staff, item) })),
      removeStaff: (id) => set((s) => ({ staff: s.staff.filter((x) => x.id !== id) })),
      upsertPortfolio: (item) => set((s) => ({ portfolio: upsert(s.portfolio, item) })),
      removePortfolio: (id) =>
        set((s) => ({ portfolio: s.portfolio.filter((x) => x.id !== id) })),
      upsertReview: (item) => set((s) => ({ reviews: upsert(s.reviews, item) })),
      removeReview: (id) => set((s) => ({ reviews: s.reviews.filter((x) => x.id !== id) })),
      upsertOffer: (item) => set((s) => ({ offers: upsert(s.offers, item) })),
      removeOffer: (id) => set((s) => ({ offers: s.offers.filter((x) => x.id !== id) })),

      createAppointment: (input) => {
        const apt: Appointment = {
          ...input,
          id: uid("apt"),
          status: "requested",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ appointments: [...s.appointments, apt] }));
        return apt;
      },
      setAppointmentStatus: (id, status) =>
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

      addPayment: (input) => {
        const p: Payment = { ...input, id: uid("pay"), createdAt: new Date().toISOString() };
        set((s) => ({ payments: [p, ...s.payments] }));
        return p;
      },
      updatePayment: (id, patch) =>
        set((s) => ({
          payments: s.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removePayment: (id) =>
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),

      signIn: (email, password) => {
        const { accounts } = get();
        const e = email.trim().toLowerCase();
        let role: Role | null = null;
        if (e === accounts.admin.email.toLowerCase() && password === accounts.admin.password) role = "admin";
        else if (e === accounts.staff.email.toLowerCase() && password === accounts.staff.password) role = "staff";
        if (role) set({ session: { role, email: e } });
        return role;
      },
      signOut: () => set({ session: null }),
      setStaffAccount: (email, password) =>
        set((s) => ({ accounts: { ...s.accounts, staff: { email, password } } })),

      createCustomer: (input) => {
        const email = normalizeEmail(input.email);
        if (get().customers.some((c) => c.email === email)) return null;
        const customer: Customer = {
          id: uid("cus"),
          name: input.name.trim(),
          email,
          phone: input.phone.trim(),
          password: input.password,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ customers: [...s.customers, customer], customerId: customer.id }));
        return customer;
      },
      signInCustomer: (email, password) => {
        const e = normalizeEmail(email);
        const customer = get().customers.find((c) => c.email === e && c.password === password) ?? null;
        if (customer) set({ customerId: customer.id });
        return customer;
      },
      signOutCustomer: () => set({ customerId: null }),

      resetDemo: () => set({ ...createSeed(), accounts: DEMO_ACCOUNTS, session: get().session }),
    }),
    {
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
        const ps = p.settings ?? ({} as Partial<Settings>);
        return {
          ...current,
          ...p,
          settings: {
            ...current.settings,
            ...ps,
            theme: { ...current.settings.theme, ...ps.theme },
            modules: { ...current.settings.modules, ...ps.modules },
            hero: { ...current.settings.hero, ...ps.hero },
            about: { ...current.settings.about, ...ps.about },
            contact: { ...current.settings.contact, ...ps.contact },
            socials: { ...current.settings.socials, ...ps.socials },
            hours: { ...current.settings.hours, ...ps.hours },
          },
          accounts: { ...current.accounts, ...p.accounts },
        };
      },
    },
  ),
);

/** Convenience selectors */
export const useSettings = () => useSalonStore((s) => s.settings);
export const useModules = () => useSalonStore((s) => s.settings.modules);
export const useSession = () => useSalonStore((s) => s.session);
export const useCustomer = () =>
  useSalonStore((s) => (s.customerId ? (s.customers.find((c) => c.id === s.customerId) ?? null) : null));

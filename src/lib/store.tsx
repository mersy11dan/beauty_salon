"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { signInCustomer, signInStaff, signOutCustomer, signOutStaff, signUpCustomer } from "@/server/actions/auth";
import { requestAppointment, type BookingRequest } from "@/server/actions/bookings";
import {
  deleteOffer,
  deletePortfolioItem,
  deleteReview,
  deleteService,
  deleteStaffMember,
  importSite,
  reorderContent,
  saveOffer,
  savePortfolioItem,
  saveReview,
  saveService,
  saveSettings,
  saveStaffMember,
} from "@/server/actions/content";
import { resetDemoData } from "@/server/actions/demo";
import type { InitialSnapshot } from "@/server/data/snapshot";
import { call } from "./call";
import { pickContent } from "./content";
import { nowInZone } from "./dates";
import { NOT_SIGNED_IN } from "./messages";
import type {
  ActionResult,
  Appointment,
  ContentList,
  Customer,
  ModuleKey,
  Offer,
  PortfolioItem,
  PublicData,
  Review,
  Service,
  Session,
  Settings,
  SiteContent,
  StaffMember,
  Theme,
} from "./types";

/** "saved": nothing waiting. "pending": an edit is waiting for the typing pause. */
export type SaveState = "saved" | "pending" | "saving" | "error";

export type Notice = { id: number; tone: "error" | "success"; text: string; signIn?: boolean };

type Actions = {
  updateSettings: (patch: Partial<Settings>) => void;
  setTheme: (patch: Partial<Theme>) => void;
  setModule: (key: ModuleKey, on: boolean) => void;
  /** Saves pending settings edits now instead of after the typing pause. */
  flushSettings: () => Promise<boolean>;

  upsertService: (item: Service) => Promise<ActionResult<Service>>;
  removeService: (id: string) => Promise<ActionResult>;
  upsertStaff: (item: StaffMember) => Promise<ActionResult<StaffMember>>;
  removeStaff: (id: string) => Promise<ActionResult>;
  upsertPortfolio: (item: PortfolioItem) => Promise<ActionResult<PortfolioItem>>;
  removePortfolio: (id: string) => Promise<ActionResult>;
  upsertReview: (item: Review) => Promise<ActionResult<Review>>;
  removeReview: (id: string) => Promise<ActionResult>;
  upsertOffer: (item: Offer) => Promise<ActionResult<Offer>>;
  removeOffer: (id: string) => Promise<ActionResult>;
  /** Moves an item one place up (-1) or down (1). The site shows lists in this order. */
  moveItem: (list: ContentList, id: string, dir: -1 | 1) => Promise<ActionResult>;
  /** Replaces the whole site with a loaded site file. Photos must already be uploaded. */
  replaceContent: (content: SiteContent) => Promise<ActionResult<SiteContent>>;

  createAppointment: (input: BookingRequest) => Promise<ActionResult<Appointment>>;

  signIn: (email: string, password: string) => Promise<ActionResult<NonNullable<Session>>>;
  signOut: () => Promise<void>;
  /** For when the server says the staff session is gone. */
  forgetSession: () => void;
  signUpCustomer: (input: { name: string; phone: string; email: string; password: string }) => Promise<ActionResult<Customer>>;
  signInCustomer: (email: string, password: string) => Promise<ActionResult<Customer>>;
  signOutCustomer: () => Promise<void>;

  resetDemo: () => Promise<ActionResult>;

  notify: (text: string, tone?: Notice["tone"]) => void;
  dismissNotice: () => void;
};

export type SalonState = PublicData & {
  session: Session;
  customer: Customer | null;
  demoMode: boolean;
  settingsSave: { state: SaveState; error: string | null };
  notice: Notice | null;
} & Actions;

export type SalonStore = StoreApi<SalonState>;

const SETTINGS_PAUSE_MS = 700;

function upsert<T extends { id: string }>(list: T[], item: T) {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}

export function createSalonStore(initial: InitialSnapshot): SalonStore {
  return createStore<SalonState>()((set, get) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let dirty = false;
    let chain: Promise<unknown> = Promise.resolve();
    let noticeId = 0;

    const notify = (text: string, tone: Notice["tone"] = "error") =>
      set({ notice: { id: ++noticeId, tone, text, signIn: text === NOT_SIGNED_IN } });

    /** Reports a failed staff action in the banner and passes the result through. */
    const report = <T,>(result: ActionResult<T>) => {
      if (!result.ok) notify(result.error);
      return result;
    };

    function flushSettings(): Promise<boolean> {
      if (timer) clearTimeout(timer);
      timer = null;
      const run = chain.then(async () => {
        if (!dirty) return get().settingsSave.state !== "error";
        dirty = false;
        set({ settingsSave: { state: "saving", error: null } });
        const result = await call(() => saveSettings(get().settings));
        if (result.ok) {
          set({ settingsSave: { state: dirty ? "pending" : "saved", error: null } });
          return true;
        }
        dirty = true;
        set({ settingsSave: { state: "error", error: result.error } });
        if (result.error === NOT_SIGNED_IN) notify(result.error);
        return false;
      });
      chain = run.catch(() => false);
      return run;
    }

    function editSettings(next: (s: Settings) => Settings) {
      set((s) => ({ settings: next(s.settings), settingsSave: { state: "pending", error: null } }));
      dirty = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flushSettings(), SETTINGS_PAUSE_MS);
    }

    function content<K extends "services" | "staff" | "portfolio" | "reviews" | "offers", T extends PublicData[K][number]>(
      key: K,
      save: (item: T) => Promise<ActionResult<T>>,
      remove: (id: string) => Promise<ActionResult>,
    ) {
      return {
        upsert: async (item: T) => {
          const result = await call(() => save(item));
          if (result.ok) set((s) => ({ [key]: upsert(s[key] as T[], result.data) }) as Partial<SalonState>);
          return result;
        },
        remove: async (id: string) => {
          const result = report(await call(() => remove(id)));
          if (result.ok) set((s) => ({ [key]: (s[key] as T[]).filter((x) => x.id !== id) }) as Partial<SalonState>);
          return result;
        },
      };
    }

    const services = content("services", saveService, deleteService);
    const staff = content("staff", saveStaffMember, deleteStaffMember);
    const portfolio = content("portfolio", savePortfolioItem, deletePortfolioItem);
    const reviews = content("reviews", saveReview, deleteReview);
    const offers = content("offers", saveOffer, deleteOffer);

    return {
      settings: initial.settings,
      services: initial.services,
      staff: initial.staff,
      portfolio: initial.portfolio,
      reviews: initial.reviews,
      offers: initial.offers,
      session: initial.session,
      customer: initial.customer,
      demoMode: initial.demoMode,
      settingsSave: { state: "saved", error: null },
      notice: null,

      updateSettings: (patch) => editSettings((s) => ({ ...s, ...patch })),
      setTheme: (patch) => editSettings((s) => ({ ...s, theme: { ...s.theme, ...patch } })),
      setModule: (key, on) => editSettings((s) => ({ ...s, modules: { ...s.modules, [key]: on } })),
      flushSettings,

      upsertService: services.upsert,
      removeService: async (id) => {
        const result = await services.remove(id);
        // The database drops these links too; mirror it so the Team page stays honest.
        if (result.ok) set((s) => ({ staff: s.staff.map((m) => ({ ...m, serviceIds: m.serviceIds.filter((x) => x !== id) })) }));
        return result;
      },
      upsertStaff: staff.upsert,
      removeStaff: staff.remove,
      upsertPortfolio: portfolio.upsert,
      removePortfolio: portfolio.remove,
      upsertReview: reviews.upsert,
      removeReview: reviews.remove,
      upsertOffer: offers.upsert,
      removeOffer: offers.remove,

      moveItem: async (list, id, dir) => {
        const before = get()[list] as { id: string }[];
        const i = before.findIndex((x) => x.id === id);
        const j = i + dir;
        if (i === -1 || j < 0 || j >= before.length) return { ok: true, data: null };
        const next = before.slice();
        [next[i], next[j]] = [next[j], next[i]];
        set({ [list]: next } as Partial<SalonState>);
        const result = report(await call(() => reorderContent(list, next.map((x) => x.id))));
        if (!result.ok && get()[list] === next) set({ [list]: before } as Partial<SalonState>);
        return result;
      },
      replaceContent: async (content) => {
        if (timer) clearTimeout(timer);
        timer = null;
        dirty = false;
        await chain;
        const result = await call(() => importSite(content));
        if (result.ok) set({ ...pickContent(result.data), settingsSave: { state: "saved", error: null } });
        return result;
      },

      createAppointment: (input) => call(() => requestAppointment(input)),

      signIn: async (email, password) => {
        const result = await call(() => signInStaff({ email, password }));
        if (result.ok) set({ session: result.data });
        return result;
      },
      signOut: async () => {
        await call(() => signOutStaff());
        set({ session: null, notice: null });
      },
      forgetSession: () => set({ session: null }),
      signUpCustomer: async (input) => {
        const result = await call(() => signUpCustomer(input));
        if (result.ok) set({ customer: result.data });
        return result;
      },
      signInCustomer: async (email, password) => {
        const result = await call(() => signInCustomer({ email, password }));
        if (result.ok) set({ customer: result.data });
        return result;
      },
      signOutCustomer: async () => {
        await call(() => signOutCustomer());
        set({ customer: null });
      },

      resetDemo: async () => report(await call(() => resetDemoData())),

      notify,
      dismissNotice: () => set({ notice: null }),
    };
  });
}

const SalonContext = createContext<SalonStore | null>(null);

/** Holds the salon for the whole visit. Later server renders don't replace it; edits update it directly. */
export function SalonProvider({ initial, children }: { initial: InitialSnapshot; children: React.ReactNode }) {
  const [store] = useState(() => createSalonStore(initial));

  useEffect(() => {
    const unsaved = () => {
      const { state } = store.getState().settingsSave;
      return state === "pending" || state === "saving" || state === "error";
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!unsaved()) return;
      void store.getState().flushSettings();
      e.preventDefault();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden" && unsaved()) void store.getState().flushSettings();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [store]);

  return <SalonContext.Provider value={store}>{children}</SalonContext.Provider>;
}

export function useSalonApi(): SalonStore {
  const store = useContext(SalonContext);
  if (!store) throw new Error("useSalonStore must be used inside <SalonProvider>");
  return store;
}

export function useSalonStore<T>(selector: (s: SalonState) => T): T {
  return useStore(useSalonApi(), selector);
}

/** Convenience selectors */
export const useSettings = () => useSalonStore((s) => s.settings);
export const useModules = () => useSalonStore((s) => s.settings.modules);
export const useSession = () => useSalonStore((s) => s.session);
export const useCustomer = () => useSalonStore((s) => s.customer);

/** Today's date at the salon, whatever zone the visitor's device is in. */
export function useSalonToday() {
  const timeZone = useSalonStore((s) => s.settings.timeZone);
  return nowInZone(timeZone).date;
}

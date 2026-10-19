import { DEFAULT_COPY, type Copy } from "./copy";
import type { ModuleKey, Modules } from "./types";

export type NavItem = { href: string; label: string; module: ModuleKey | null };

const ALL: { href: string; label: keyof Copy; module: ModuleKey | null }[] = [
  { href: "/services", label: "navServices", module: "services" },
  { href: "/portfolio", label: "navPortfolio", module: "portfolio" },
  { href: "/team", label: "navTeam", module: "staff" },
  { href: "/offers", label: "navOffers", module: "offers" },
  { href: "/reviews", label: "navReviews", module: "reviews" },
  { href: "/#visit", label: "navVisit", module: null },
  { href: "/book", label: "navBook", module: "booking" },
];

export function navFor(modules: Modules, copy: Copy = DEFAULT_COPY): NavItem[] {
  return ALL.filter((i) => i.module === null || modules[i.module]).map((i) => ({ ...i, label: copy[i.label] }));
}

export const MODULE_META: Record<
  ModuleKey,
  { label: string; description: string; href: string | null }
> = {
  services: { label: "Services", description: "Public price list with durations.", href: "/services" },
  portfolio: { label: "Portfolio", description: "Gallery of past work.", href: "/portfolio" },
  staff: { label: "Team", description: "Staff profiles. Booking lets guests pick a person when this is on.", href: "/team" },
  booking: { label: "Booking", description: "Guests sign in or create an account, then request a time online. Off means the site is brochure only.", href: "/book" },
  ledger: { label: "Payment ledger", description: "Staff record cash, telebirr, M-PESA and bank transfer payments in the desk.", href: null },
  reviews: { label: "Reviews", description: "Customer quotes on the homepage and a reviews page.", href: "/reviews" },
  offers: { label: "Offers", description: "Promotions with an end date.", href: "/offers" },
};

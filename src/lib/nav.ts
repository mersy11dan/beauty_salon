import type { ModuleKey, Modules } from "./types";

export type NavItem = { href: string; label: string; module: ModuleKey | null };

const ALL: NavItem[] = [
  { href: "/services", label: "Services", module: "services" },
  { href: "/portfolio", label: "Portfolio", module: "portfolio" },
  { href: "/team", label: "Team", module: "staff" },
  { href: "/offers", label: "Offers", module: "offers" },
  { href: "/reviews", label: "Reviews", module: "reviews" },
  { href: "/#visit", label: "Visit", module: null },
  { href: "/book", label: "Book", module: "booking" },
];

export function navFor(modules: Modules): NavItem[] {
  return ALL.filter((i) => i.module === null || modules[i.module]);
}

export const MODULE_META: Record<
  ModuleKey,
  { label: string; description: string; href: string | null }
> = {
  services: { label: "Services", description: "Public price list with durations.", href: "/services" },
  portfolio: { label: "Portfolio", description: "Gallery of past work.", href: "/portfolio" },
  staff: { label: "Team", description: "Staff profiles. Booking lets guests pick a person when this is on.", href: "/team" },
  booking: { label: "Booking", description: "Guests sign in or create an account, then request a time online. Off means the site is brochure only.", href: "/book" },
  ledger: { label: "Payment ledger", description: "Staff record cash, card and transfer payments in the desk.", href: null },
  reviews: { label: "Reviews", description: "Customer quotes on the homepage and a reviews page.", href: "/reviews" },
  offers: { label: "Offers", description: "Promotions with an end date.", href: "/offers" },
};

import type { SiteContent } from "./types";

/** "demo" is the sample site you build on (DEMO_MODE=true); "live" is a client's own deployment. */
export type SiteMode = "demo" | "live";

export type BuilderPhase = { id: string; title: string; blurb: string };

export const BUILDER_PHASES: BuilderPhase[] = [
  { id: "brand", title: "Make it theirs", blurb: "Give the site the client's name, look and the pages they are paying for." },
  { id: "fill", title: "Fill it in", blurb: "Swap the sample salon for the client's real services, people, photos and details." },
  { id: "hand", title: "Hand it over", blurb: "Put the finished site on its own web address with its own database." },
];

export type BuilderStep = {
  id: string;
  phase: BuilderPhase["id"];
  title: string;
  blurb: string;
  href: string;
  /** False when the page is switched off, so the step doesn't count. */
  applies: boolean;
  optional: boolean;
  /** Differs from the sample salon. */
  changed: boolean;
  /** Ticked by hand, e.g. when the sample fonts already suit the client. */
  marked: boolean;
  done: boolean;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Sample reviews and offers are dated relative to today, so dates are left out of the comparison. */
const reviewText = (c: SiteContent) => c.reviews.map((r) => [r.author, r.text, r.rating]);
const offerText = (c: SiteContent) => c.offers.map((o) => [o.title, o.detail, o.active]);

export function builderSteps(
  content: SiteContent,
  seed: SiteContent,
  opts: { mode: SiteMode; staffLogin: boolean },
): BuilderStep[] {
  const s = content.settings;
  const d = seed.settings;
  const m = s.modules;
  const live = opts.mode === "live";

  const rows: Omit<BuilderStep, "marked" | "done">[] = [
    {
      id: "brand",
      phase: "brand",
      title: "Name and logo",
      blurb: "Salon name, tagline, logo, browser tab icon, search listing and social links.",
      href: "/admin/brand",
      applies: true,
      optional: false,
      changed:
        s.name !== d.name ||
        s.tagline !== d.tagline ||
        !!s.logoUrl ||
        !!s.faviconUrl ||
        !same(s.seo, d.seo) ||
        !same(s.socials, d.socials),
    },
    {
      id: "look",
      phase: "brand",
      title: "Colours and fonts",
      blurb: "Choose a palette and a font pairing that match the salon's style.",
      href: "/admin/look",
      applies: true,
      optional: false,
      changed: !same(s.theme, d.theme) || !same(s.fonts, d.fonts),
    },
    {
      id: "pages",
      phase: "brand",
      title: "Pages",
      blurb: "Switch off anything the client is not paying for: booking, team, portfolio, reviews, offers, payments.",
      href: "/admin/pages",
      applies: true,
      optional: false,
      changed: !same(m, d.modules),
    },
    {
      id: "homepage",
      phase: "fill",
      title: "Homepage",
      blurb: "Headline, intro, slideshow photos and the about section.",
      href: "/admin/content",
      applies: true,
      optional: false,
      changed: !same(s.hero, d.hero) || !same(s.about, d.about),
    },
    {
      id: "services",
      phase: "fill",
      title: "Services and prices",
      blurb: "What the salon offers, how long each takes and what it costs.",
      href: "/admin/services",
      applies: m.services || m.booking,
      optional: false,
      changed: !same(content.services, seed.services),
    },
    {
      id: "team",
      phase: "fill",
      title: "Team",
      blurb: "Photos, roles and short bios, and which services each person does.",
      href: "/admin/team",
      applies: m.staff,
      optional: false,
      changed: !same(content.staff, seed.staff),
    },
    {
      id: "portfolio",
      phase: "fill",
      title: "Portfolio",
      blurb: "Photos of the client's own work.",
      href: "/admin/portfolio",
      applies: m.portfolio,
      optional: false,
      changed: !same(content.portfolio, seed.portfolio),
    },
    {
      id: "reviews",
      phase: "fill",
      title: "Reviews",
      blurb: "Real quotes from the client's customers.",
      href: "/admin/reviews",
      applies: m.reviews,
      optional: false,
      changed: !same(reviewText(content), reviewText(seed)),
    },
    {
      id: "offers",
      phase: "fill",
      title: "Offers",
      blurb: "Current promotions, or none.",
      href: "/admin/offers",
      applies: m.offers,
      optional: false,
      changed: !same(offerText(content), offerText(seed)),
    },
    {
      id: "contact",
      phase: "fill",
      title: "Contact and hours",
      blurb: "Address, phone, email, map link, opening hours, time zone, currency and clock style.",
      href: "/admin/contact",
      applies: true,
      optional: false,
      changed:
        !same(s.contact, d.contact) ||
        !same(s.hours, d.hours) ||
        s.capacity !== d.capacity ||
        s.timeZone !== d.timeZone ||
        s.currency !== d.currency ||
        s.clock !== d.clock,
    },
    {
      id: "text",
      phase: "fill",
      title: "Site text",
      blurb: "Any heading, button, message or email line on the public site, in the client's own voice.",
      href: "/admin/text",
      applies: true,
      optional: true,
      changed: Object.keys(s.copy).length > 0,
    },
    {
      id: "launch",
      phase: "hand",
      title: live ? "Domain and hand-over" : "Launch on its own website",
      blurb: live
        ? "Connect the client's domain in Vercel and give them their login."
        : "Save the site file, create the client's own Vercel project and database, and load the file there.",
      href: "/admin/launch",
      applies: true,
      optional: false,
      changed: false,
    },
    {
      id: "access",
      phase: "hand",
      title: "Desk login",
      blurb: "Create the shared login the client's staff use for bookings and payments.",
      href: "/admin/access",
      applies: live,
      optional: false,
      changed: opts.staffLogin,
    },
  ];

  return rows.map((r) => {
    const marked = !!s.checklist[r.id];
    return { ...r, marked, done: r.changed || marked };
  });
}

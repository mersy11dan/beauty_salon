"use client";

import { OpsShell, type OpsNavItem } from "@/components/ops/ops-shell";

const NAV: OpsNavItem[] = [
  { href: "/admin", label: "Site builder", exact: true },
  { href: "/admin/brand", label: "Name and logo", group: "1 · Make it theirs" },
  { href: "/admin/look", label: "Colours and fonts", group: "1 · Make it theirs" },
  { href: "/admin/pages", label: "Pages", group: "1 · Make it theirs" },
  { href: "/admin/content", label: "Homepage", group: "2 · Fill it in" },
  { href: "/admin/services", label: "Services", group: "2 · Fill it in" },
  { href: "/admin/team", label: "Team", group: "2 · Fill it in" },
  { href: "/admin/portfolio", label: "Portfolio", group: "2 · Fill it in" },
  { href: "/admin/reviews", label: "Reviews", group: "2 · Fill it in" },
  { href: "/admin/offers", label: "Offers", group: "2 · Fill it in" },
  { href: "/admin/contact", label: "Contact and hours", group: "2 · Fill it in" },
  { href: "/admin/text", label: "Site text", group: "2 · Fill it in" },
  { href: "/admin/launch", label: "Launch", group: "3 · Hand it over" },
  { href: "/admin/access", label: "Access and data", group: "3 · Hand it over" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <OpsShell area="Admin" allow={["admin"]} nav={NAV}>
      {children}
    </OpsShell>
  );
}

"use client";

import { OpsShell } from "@/components/ops/ops-shell";

const NAV = [
  { href: "/admin", label: "Modules", exact: true },
  { href: "/admin/brand", label: "Name and logo" },
  { href: "/admin/look", label: "Colours and fonts" },
  { href: "/admin/content", label: "Homepage" },
  { href: "/admin/text", label: "Site text" },
  { href: "/admin/contact", label: "Contact and hours" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/portfolio", label: "Portfolio" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/access", label: "Access and data" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <OpsShell area="Admin" allow={["admin"]} nav={NAV}>
      {children}
    </OpsShell>
  );
}

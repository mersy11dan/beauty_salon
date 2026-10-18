"use client";

import { OpsShell } from "@/components/ops/ops-shell";

const NAV = [
  { href: "/admin", label: "Modules", exact: true },
  { href: "/admin/brand", label: "Brand and colours" },
  { href: "/admin/content", label: "Content and hours" },
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

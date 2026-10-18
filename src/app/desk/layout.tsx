"use client";

import { OpsShell } from "@/components/ops/ops-shell";
import { useModules } from "@/lib/store";

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  const modules = useModules();
  const nav = [
    { href: "/desk", label: "Appointments", exact: true },
    ...(modules.ledger ? [{ href: "/desk/ledger", label: "Payments" }] : []),
  ];
  return (
    <OpsShell area="Desk" allow={["staff", "admin"]} nav={nav}>
      {children}
    </OpsShell>
  );
}

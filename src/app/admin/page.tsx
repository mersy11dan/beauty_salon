"use client";

import Link from "next/link";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { Toggle } from "@/components/ui/field";
import { todayISO } from "@/lib/dates";
import { MODULE_META } from "@/lib/nav";
import { useSalonStore } from "@/lib/store";
import type { ModuleKey } from "@/lib/types";

const ORDER: ModuleKey[] = ["services", "booking", "staff", "portfolio", "reviews", "offers", "ledger"];

export default function AdminOverview() {
  const modules = useSalonStore((s) => s.settings.modules);
  const setModule = useSalonStore((s) => s.setModule);
  const appointments = useSalonStore((s) => s.appointments);
  const today = todayISO();
  const requested = appointments.filter((a) => a.status === "requested" && a.date >= today).length;
  const todayCount = appointments.filter((a) => a.date === today && a.status !== "cancelled").length;
  const onCount = ORDER.filter((k) => modules[k]).length;

  return (
    <>
      <OpsTitle
        title="Modules"
        intro="Switch off anything this salon is not paying for. The page, its menu link and its buttons disappear from the public site straight away."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Modules on" value={`${onCount} of ${ORDER.length}`} />
        <Stat label="Booked today" value={String(todayCount)} />
        <Stat label="Waiting for confirmation" value={String(requested)} href="/desk" />
      </div>

      <Card className="px-5">
        <div className="divide-y divide-ops-line">
          <div className="py-3.5">
            <p className="text-[15px] font-medium text-ops-ink">Homepage</p>
            <p className="text-[13px] text-ops-muted">Always on. Edit its words under Content and hours.</p>
          </div>
          {ORDER.map((key) => (
            <Toggle
              key={key}
              label={MODULE_META[key].label}
              description={MODULE_META[key].description}
              checked={modules[key]}
              onChange={(on) => setModule(key, on)}
            />
          ))}
        </div>
      </Card>

      <p className="mt-5 text-[13.5px] text-ops-muted">
        Booking works without the Team module: guests book the salon rather than a person. The ledger only shows inside the desk.
      </p>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <Card className="px-5 py-4 transition-colors hover:border-ops-accent/40">
      <p className="text-[12.5px] text-ops-muted">{label}</p>
      <p className="tabular mt-1 text-[22px] font-semibold tracking-[-0.01em] text-ops-ink">{value}</p>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

"use client";

import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { Toggle } from "@/components/ui/field";
import { MODULE_META } from "@/lib/nav";
import { useSalonStore } from "@/lib/store";
import type { ModuleKey } from "@/lib/types";

const ORDER: ModuleKey[] = ["services", "booking", "staff", "portfolio", "reviews", "offers", "ledger"];

export default function PagesPage() {
  const modules = useSalonStore((s) => s.settings.modules);
  const setModule = useSalonStore((s) => s.setModule);
  const onCount = ORDER.filter((k) => modules[k]).length;

  return (
    <>
      <OpsTitle
        title="Pages"
        intro="Switch off anything this client is not paying for. The page, its menu link and its buttons disappear from the public site straight away."
      />

      <Card className="px-5">
        <div className="divide-y divide-ops-line">
          <div className="py-3.5">
            <p className="text-[15px] font-medium text-ops-ink">Homepage</p>
            <p className="text-[13px] text-ops-muted">Always on. Edit it under Homepage and Site text.</p>
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
        {onCount} of {ORDER.length} switched on. Booking works without the Team page: guests book the salon rather than a person. The payment
        ledger only shows inside the desk.
      </p>
    </>
  );
}

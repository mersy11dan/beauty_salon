"use client";

import { ModuleGate } from "@/components/site/module-gate";
import { PageTitle } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { fill } from "@/lib/copy";
import { formatDateLong, todayISO } from "@/lib/dates";
import { useCopy } from "@/lib/site-hooks";
import { useSalonStore } from "@/lib/store";

export default function OffersPage() {
  const offers = useSalonStore((s) => s.offers);
  const modules = useSalonStore((s) => s.settings.modules);
  const copy = useCopy();
  const today = todayISO();
  const live = offers.filter((o) => o.active && (!o.until || o.until >= today));

  return (
    <ModuleGate module="offers">
      <PageTitle title={copy.offersTitle} intro={copy.offersIntro} />
      <div className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        <ul className="flex flex-col">
          {live.map((o) => (
            <li key={o.id} className="hairline-t grid gap-4 py-9 md:grid-cols-12 md:gap-10 md:py-12">
              <h2 className="font-display text-display-md text-balance text-ink md:col-span-6">{o.title}</h2>
              <div className="md:col-span-5 md:col-start-8">
                <p className="text-[16px] leading-[1.6] text-ink/85">{o.detail}</p>
                {o.until && <p className="mt-3 text-[13.5px] text-muted">{fill(copy.offersValid, { date: formatDateLong(o.until) })}</p>}
              </div>
            </li>
          ))}
        </ul>
        {live.length === 0 && (
          <p className="hairline-t pt-8 text-[16px] text-muted">{copy.offersEmpty}</p>
        )}
        {modules.booking && live.length > 0 && (
          <ButtonLink href="/book" size="lg" className="mt-14">
            {copy.offersBook}
          </ButtonLink>
        )}
      </div>
    </ModuleGate>
  );
}

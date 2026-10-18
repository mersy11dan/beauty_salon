"use client";

import { ModuleGate } from "@/components/site/module-gate";
import { PageTitle } from "@/components/site/section";
import { groupByCategory, ServiceRows } from "@/components/site/service-list";
import { ButtonLink } from "@/components/ui/button";
import { useSalonStore } from "@/lib/store";

export default function ServicesPage() {
  const services = useSalonStore((s) => s.services);
  const modules = useSalonStore((s) => s.settings.modules);
  const groups = groupByCategory(services);

  return (
    <ModuleGate module="services">
      <PageTitle
        title="Services and prices"
        intro={
          modules.booking
            ? "Choose anything on the list to book it. If you are not sure what you need, book the closest thing and we will adjust on the day."
            : "If you are not sure what you need, call and describe it. We will tell you what to book and how long to set aside."
        }
      />
      <div className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        <div className="flex flex-col gap-14 md:gap-20">
          {groups.map(([category, list]) => (
            <section key={category} className="grid gap-6 lg:grid-cols-12 lg:gap-16">
              <h2 className="font-display text-display-md text-ink lg:col-span-4">{category}</h2>
              <div className="lg:col-span-8">
                <ServiceRows services={list} bookable={modules.booking} />
              </div>
            </section>
          ))}
          {services.length === 0 && (
            <p className="text-[16px] text-muted">No services have been added yet.</p>
          )}
        </div>
        {modules.booking && services.length > 0 && (
          <div className="mt-16 flex flex-col items-start gap-4 md:mt-24">
            <p className="max-w-[40ch] text-[16px] text-muted">
              Prices are what you pay at the desk. Nothing is charged online.
            </p>
            <ButtonLink href="/book" size="lg">
              Book a time
            </ButtonLink>
          </div>
        )}
      </div>
    </ModuleGate>
  );
}

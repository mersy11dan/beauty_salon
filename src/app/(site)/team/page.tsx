"use client";

import { Avatar } from "@/components/site/home-sections";
import { ModuleGate } from "@/components/site/module-gate";
import { PageTitle } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { useSalonStore } from "@/lib/store";

export default function TeamPage() {
  const staff = useSalonStore((s) => s.staff);
  const services = useSalonStore((s) => s.services);
  const modules = useSalonStore((s) => s.settings.modules);

  return (
    <ModuleGate module="staff">
      <PageTitle title="The team" intro="Whoever you book with sees you through from start to finish." />
      <div className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        <ul className="flex flex-col">
          {staff.map((m) => {
            const does = services.filter((s) => m.serviceIds.includes(s.id)).map((s) => s.name);
            return (
              <li key={m.id} className="hairline-t grid gap-6 py-10 md:grid-cols-12 md:gap-10 md:py-14">
                <div className="flex items-center gap-5 md:col-span-4 md:items-start">
                  <Avatar name={m.name} photo={m.photo} size={72} />
                  <div>
                    <h2 className="font-display text-display-md text-ink">{m.name}</h2>
                    <p className="mt-1 text-[14.5px] text-muted">{m.role}</p>
                  </div>
                </div>
                <div className="md:col-span-8 md:col-start-6">
                  <p className="max-w-[56ch] text-[16.5px] leading-[1.6] text-ink/85">{m.bio}</p>
                  {does.length > 0 && (
                    <p className="mt-5 text-[14px] text-muted">
                      <span className="text-ink">Does: </span>
                      {does.join(", ")}
                    </p>
                  )}
                  {modules.booking && (
                    <ButtonLink href={`/book?staff=${m.id}`} variant="secondary" size="sm" className="mt-6">
                      Book with {m.name.split(" ")[0]}
                    </ButtonLink>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {staff.length === 0 && <p className="text-[16px] text-muted">No team members have been added yet.</p>}
      </div>
    </ModuleGate>
  );
}

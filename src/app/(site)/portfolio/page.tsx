"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { ModuleGate } from "@/components/site/module-gate";
import { PageTitle } from "@/components/site/section";
import { useSalonStore } from "@/lib/store";

export default function PortfolioPage() {
  const portfolio = useSalonStore((s) => s.portfolio);
  const [filter, setFilter] = useState<string>("All");
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(portfolio.map((p) => p.category)))],
    [portfolio],
  );
  const items = filter === "All" ? portfolio : portfolio.filter((p) => p.category === filter);

  return (
    <ModuleGate module="portfolio">
      <PageTitle title="Portfolio" intro="Work from the last few months. Every photo is a real client who said yes to being shown." />
      <div className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        {categories.length > 2 && (
          <div role="tablist" aria-label="Filter by category" className="mb-10 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={filter === c}
                onClick={() => setFilter(c)}
                className={clsx(
                  "h-9 rounded-full border px-4 text-[13.5px] transition-colors duration-300",
                  filter === c
                    ? "border-ink bg-ink text-bg"
                    : "border-line-strong text-ink hover:border-ink",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-7">
          {items.map((p, i) => (
            <li key={p.id} className={clsx(i % 3 === 1 && "md:mt-12")}>
              <figure>
                <div className="aspect-[3/4] overflow-hidden rounded-[14px] bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out-expo hover:scale-[1.03]"
                  />
                </div>
                <figcaption className="mt-3 flex items-baseline justify-between gap-3 text-[13.5px]">
                  <span className="text-ink">{p.caption}</span>
                  <span className="text-faint">{p.category}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        {items.length === 0 && <p className="text-[16px] text-muted">Nothing here yet.</p>}
      </div>
    </ModuleGate>
  );
}

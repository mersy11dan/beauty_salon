"use client";

import { ModuleGate } from "@/components/site/module-gate";
import { PageTitle } from "@/components/site/section";
import { Stars } from "@/components/site/stars";
import { fill } from "@/lib/copy";
import { formatDateShort } from "@/lib/dates";
import { useCopy } from "@/lib/site-hooks";
import { useSalonStore } from "@/lib/store";

export default function ReviewsPage() {
  const reviews = useSalonStore((s) => s.reviews);
  const copy = useCopy();
  const avg = reviews.length
    ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <ModuleGate module="reviews">
      <PageTitle
        title={copy.reviewsTitle}
        intro={reviews.length && copy.reviewsIntro ? fill(copy.reviewsIntro, { average: avg, count: reviews.length }) : undefined}
      />
      <div className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
        <ul className="grid gap-x-14 md:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="hairline-t py-9 md:py-11">
              <blockquote className="flex flex-col gap-5">
                <p className="font-display text-[length:calc(1.4rem*var(--display-scale))] leading-[1.32] text-ink md:text-[length:calc(1.55rem*var(--display-scale))]">“{r.text}”</p>
                <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-muted">
                  <Stars value={r.rating} />
                  <span className="text-ink">{r.author}</span>
                  {r.date && (
                    <>
                      <span>·</span>
                      <span>{formatDateShort(r.date)}</span>
                    </>
                  )}
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
        {reviews.length === 0 && <p className="text-[16px] text-muted">{copy.reviewsEmpty}</p>}
      </div>
    </ModuleGate>
  );
}

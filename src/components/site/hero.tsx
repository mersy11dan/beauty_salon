"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { useSalonStore } from "@/lib/store";

const INTERVAL_MS = 5200;

export function Hero() {
  const settings = useSalonStore((s) => s.settings);
  const { hero, modules, contact } = settings;
  const slides = hero.slides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [slides.length, paused]);

  const current = slides[index] ?? slides[0];

  const cta = modules.booking
    ? { href: "/book", label: "Book a time" }
    : modules.services
      ? { href: "/services", label: "See services" }
      : { href: `tel:${contact.phone.replace(/[^+\d]/g, "")}`, label: "Call to book" };

  return (
    <section
      className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-6 md:pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6 lg:pb-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex flex-col items-start lg:pr-6">
        {slides.length > 1 && (
          <div
            role="tablist"
            aria-label="What we do"
            className="animate-rise mb-6 flex items-center gap-5 text-[12px] font-semibold uppercase tracking-[0.2em]"
          >
            {slides.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === index}
                onClick={() => setIndex(i)}
                className={clsx(
                  "relative rounded-sm pb-1 transition-colors duration-500",
                  i === index ? "text-accent" : "text-faint hover:text-muted",
                )}
              >
                {s.label}
                <span
                  aria-hidden
                  className={clsx(
                    "absolute inset-x-0 bottom-0 h-px origin-left bg-accent transition-transform duration-700 ease-out-expo",
                    i === index ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </button>
            ))}
          </div>
        )}

        <h1
          className="animate-rise font-display text-display-xl text-balance text-ink [animation-delay:80ms]"
        >
          {hero.headline}
        </h1>

        <p className="animate-rise mt-6 max-w-[38ch] text-[16.5px] leading-[1.6] text-muted [animation-delay:160ms] md:text-[17.5px]">
          {hero.paragraph}
        </p>

        <div className="animate-rise mt-9 flex items-center gap-5 [animation-delay:240ms]">
          {cta.href.startsWith("tel:") ? (
            <a
              href={cta.href}
              className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-[14.5px] font-medium text-accent-ink transition-colors duration-300 hover:bg-accent-hover"
            >
              {cta.label}
            </a>
          ) : (
            <ButtonLink href={cta.href} size="lg">
              {cta.label}
            </ButtonLink>
          )}
          {modules.booking && modules.services && (
            <ButtonLink href="/services" variant="ghost" size="lg" className="-ml-2 px-4">
              Prices
            </ButtonLink>
          )}
        </div>
      </div>

      <div>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px] sm:max-w-[480px] lg:aspect-auto lg:h-[min(72vh,680px)] lg:max-w-none">
          {slides.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.id}
              src={s.src}
              alt={i === index ? s.alt : ""}
              aria-hidden={i !== index}
              draggable={false}
              className={clsx(
                "photo-fade absolute inset-0 h-full w-full select-none object-cover object-[50%_28%] mix-blend-multiply transition-opacity duration-[1400ms] ease-out-quart",
                i === index ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
          <span className="sr-only">{current?.label}</span>
        </div>
      </div>
    </section>
  );
}

"use client";

import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { EASE_OUT_EXPO, Reveal } from "@/components/motion/reveal";
import { SplitWords } from "@/components/motion/split-text";
import { Tilt } from "@/components/motion/tilt";
import { ButtonLink } from "@/components/ui/button";
import { telHref } from "@/lib/phone";
import { useSalonStore } from "@/lib/store";

const INTERVAL_MS = 5600;

export function Hero() {
  const settings = useSalonStore((s) => s.settings);
  const reduce = useReducedMotion();
  const { hero, modules, contact } = settings;
  const slides = hero.slides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused || reduce) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [slides.length, paused, reduce]);

  const current = slides[index] ?? slides[0];

  const cta = modules.booking
    ? { href: "/book", label: "Book a time" }
    : modules.services
      ? { href: "/services", label: "See services" }
      : { href: telHref(contact.phone), label: "Call to book" };

  return (
    <section
      className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-4 md:pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6 lg:pb-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex flex-col items-start lg:pr-6">
        {slides.length > 1 && (
          <Reveal y={10} amount={0}>
            <div
              role="tablist"
              aria-label="What we do"
              className="mb-6 flex items-center gap-5 text-[12px] font-semibold uppercase tracking-[0.2em]"
            >
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={i === index}
                  onClick={() => setIndex(i)}
                  className={clsx(
                    "hit-area rounded-sm pb-1 transition-colors duration-500",
                    i === index ? "text-accent" : "text-muted hover:text-ink",
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
          </Reveal>
        )}

        <SplitWords as="h1" text={hero.headline} delay={0.1} className="font-display text-display-xl text-balance text-ink" />

        <Reveal delay={0.45} y={14} amount={0}>
          <p className="mt-6 max-w-[38ch] text-[16.5px] leading-[1.6] text-muted md:text-[17.5px]">{hero.paragraph}</p>
        </Reveal>

        <Reveal delay={0.6} y={12} amount={0}>
          <div className="mt-9 flex items-center gap-5">
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
        </Reveal>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.25 }}
      >
        <Tilt max={7} scale={1.01} className="mx-auto w-full max-w-[420px] sm:max-w-[480px] lg:max-w-none">
          <div className="relative aspect-[4/5] w-full preserve-3d lg:aspect-auto lg:h-[min(72vh,680px)]">
            {/* Back layer: the category word, set deep behind the photo. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-2 top-[2%] select-none lg:-left-24"
              style={{ transform: "translateZ(-70px)" }}
            >
              {slides.map((s, i) => (
                <span
                  key={s.id}
                  className={clsx(
                    "font-script absolute left-0 top-0 whitespace-nowrap text-[clamp(4.2rem,12vw,9rem)] leading-none text-accent transition-all duration-[1400ms] ease-out-quart",
                    i === index ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                  )}
                >
                  {s.label}
                </span>
              ))}
            </div>

            {/* Photo layer with a slow idle float so the composition never feels frozen. */}
            <motion.div
              className="absolute inset-0"
              style={{ transform: "translateZ(40px)" }}
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
            >
              {slides.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={s.id}
                  src={s.src}
                  alt={i === index ? s.alt : ""}
                  aria-hidden={i !== index}
                  draggable={false}
                  className={clsx(
                    "photo-fade absolute inset-0 h-full w-full select-none object-cover object-[50%_28%] mix-blend-multiply transition-[opacity,transform] duration-[1600ms] ease-out-quart",
                    i === index ? "scale-100 opacity-100" : "scale-[1.03] opacity-0",
                  )}
                />
              ))}
            </motion.div>

            {/* Front layer: counter. */}
            {slides.length > 1 && (
              <div
                className="absolute bottom-[6%] right-[2%] flex items-center gap-3 text-[12px] font-medium tabular tracking-[0.14em] text-muted"
                style={{ transform: "translateZ(90px)" }}
              >
                <span className="h-px w-8 bg-line-strong" aria-hidden />
                <span>
                  {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                </span>
              </div>
            )}
            <span className="sr-only">{current?.label}</span>
          </div>
        </Tilt>
      </motion.div>
    </section>
  );
}

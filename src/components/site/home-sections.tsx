"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CursorPreview } from "@/components/motion/cursor-preview";
import { Marquee } from "@/components/motion/marquee";
import { Parallax } from "@/components/motion/parallax";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { SplitWords } from "@/components/motion/split-text";
import { Tilt } from "@/components/motion/tilt";
import { ButtonLink } from "@/components/ui/button";
import { formatDateShort, todayISO, weekdayOf } from "@/lib/dates";
import { formatPhone, telHref } from "@/lib/phone";
import { useSalonStore } from "@/lib/store";
import type { Service } from "@/lib/types";
import { GalleryScroll } from "./gallery-scroll";
import { HoursTable } from "./hours-table";
import { Section, SectionHeading } from "./section";
import { ServiceRows } from "./service-list";
import { Stars } from "./stars";

/** Script ticker under the hero: what the salon does, on a slow loop. */
export function ScriptMarquee() {
  const slides = useSalonStore((s) => s.settings.hero.slides);
  const services = useSalonStore((s) => s.services);
  const words = useMemo(() => {
    const fromSlides = slides.map((s) => s.label);
    const fromServices = Array.from(new Set(services.map((s) => s.category)));
    const list = fromSlides.length ? fromSlides : fromServices;
    return list.length ? [...list, "By appointment"] : ["By appointment"];
  }, [slides, services]);

  return (
    <Marquee className="hairline-t hairline-b py-5 md:py-6" durationSec={(words.length + 1) * 9}>
      <span className="flex items-center">
        <span lang="am" className="font-ethiopic whitespace-nowrap px-6 text-display-md font-light text-ink/80 md:px-10">
          እንኳን ደህና መጡ
        </span>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
      {words.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className="font-script whitespace-nowrap px-6 text-script-md text-ink/80 md:px-10">{w}</span>
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      ))}
    </Marquee>
  );
}

export function ServicesPreview() {
  const services = useSalonStore((s) => s.services);
  const portfolio = useSalonStore((s) => s.portfolio);
  const slides = useSalonStore((s) => s.settings.hero.slides);
  const modules = useSalonStore((s) => s.settings.modules);
  const [hovered, setHovered] = useState<Service | null>(null);

  const previewFor = (svc: Service | null) => {
    if (!svc) return null;
    const match = portfolio.find((p) => p.category.toLowerCase() === svc.category.toLowerCase());
    if (match) return match.src;
    const slide = slides.find((s) => s.label.toLowerCase() === svc.category.toLowerCase());
    return slide?.src ?? null;
  };

  if (!modules.services || services.length === 0) return null;
  const featured = services.slice(0, 6);

  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            label="Services"
            title="Priced up front"
            intro="Times are how long to set aside, including a chat at the start. Hover a line to see the kind of work it means."
            className="mb-0 md:mb-0"
          />
          <Reveal delay={0.3} y={10}>
            <Link href="/services" className="hit-area group mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-ink">
              Full list
              <span aria-hidden className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">→</span>
            </Link>
          </Reveal>
        </div>
        <Reveal className="lg:col-span-7" delay={0.15}>
          <ServiceRows services={featured} bookable={modules.booking} compact onHover={setHovered} />
        </Reveal>
      </div>
      <CursorPreview src={previewFor(hovered)} />
    </Section>
  );
}

export function PortfolioStrip() {
  const portfolio = useSalonStore((s) => s.portfolio);
  const modules = useSalonStore((s) => s.settings.modules);
  if (!modules.portfolio || portfolio.length === 0) return null;
  return <GalleryScroll items={portfolio.slice(0, 9)} />;
}

export function AboutBlock() {
  const about = useSalonStore((s) => s.settings.about);
  const staff = useSalonStore((s) => s.staff);
  const portfolio = useSalonStore((s) => s.portfolio);
  const slides = useSalonStore((s) => s.settings.hero.slides);
  const modules = useSalonStore((s) => s.settings.modules);

  // Two photos for the parallax pair: different categories when possible.
  const pair = useMemo(() => {
    const pool = portfolio.length ? portfolio : slides.map((s) => ({ src: s.src, alt: s.alt, category: s.label }));
    const a = pool.find((p) => /hair/i.test(p.category)) ?? pool[0];
    const b = pool.find((p) => p !== a && /make/i.test(p.category)) ?? pool.find((p) => p !== a) ?? a;
    return [a, b].filter(Boolean);
  }, [portfolio, slides]);

  return (
    <Section className="hairline-t overflow-hidden">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Reveal y={10}>
            <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-accent">About</p>
          </Reveal>
          <SplitWords as="h2" inView text={about.heading} className="font-display text-display-lg text-balance text-ink" />
          <Reveal delay={0.25}>
            <p className="mt-6 text-[17px] leading-[1.65] text-ink/85">{about.body}</p>
          </Reveal>
          {modules.staff && staff.length > 0 && (
            <RevealGroup className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              {staff.map((m) => (
                <RevealItem key={m.id}>
                  <Link href="/team" className="group flex items-center gap-3">
                    <Avatar name={m.name} photo={m.photo} />
                    <span className="flex flex-col leading-tight">
                      <span className="text-[14.5px] text-ink underline-offset-4 group-hover:underline">{m.name}</span>
                      <span className="text-[12.5px] text-muted">{m.role}</span>
                    </span>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>

        {pair.length > 0 && (
          <div className="relative mx-auto grid w-full max-w-[460px] grid-cols-[7fr_5fr] items-start gap-5 lg:col-span-5 lg:col-start-8 lg:max-w-none">
            <Parallax speed={0.1}>
              <div className="aspect-[3/4] overflow-hidden rounded-[16px] bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pair[0].src} alt={pair[0].alt} loading="lazy" className="h-full w-full object-cover" />
              </div>
            </Parallax>
            {pair[1] && (
              <Parallax speed={-0.12} className="mt-[28%]">
                <div className="aspect-[3/4] overflow-hidden rounded-[16px] bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pair[1].src} alt={pair[1].alt} loading="lazy" className="h-full w-full object-cover" />
                </div>
              </Parallax>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

export function Avatar({ name, photo, size = 40 }: { name: string; photo: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full bg-accent/12 font-display text-accent"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

export function OffersBand() {
  const offers = useSalonStore((s) => s.offers);
  const modules = useSalonStore((s) => s.settings.modules);
  const today = todayISO();
  const live = offers.filter((o) => o.active && o.until >= today);
  if (!modules.offers || live.length === 0) return null;
  const first = live[0];
  return (
    <Section className="hairline-t bg-soft py-12 md:py-14">
      <Reveal>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-script text-script-md text-balance text-ink">{first.title}</p>
            <p className="mt-1 text-[15px] text-muted">
              {first.detail} Until {formatDateShort(first.until)}.
            </p>
          </div>
          <ButtonLink href="/offers" variant="secondary" className="self-start md:self-auto">
            {live.length > 1 ? `All ${live.length} offers` : "Details"}
          </ButtonLink>
        </div>
      </Reveal>
    </Section>
  );
}

export function ReviewsPreview() {
  const reviews = useSalonStore((s) => s.reviews);
  const modules = useSalonStore((s) => s.settings.modules);
  if (!modules.reviews || reviews.length === 0) return null;
  const picks = reviews.slice(0, 3);
  return (
    <Section className="hairline-t">
      <SectionHeading label="Reviews" title="Kind words" more={{ href: "/reviews", label: `All ${reviews.length} reviews` }} />
      <RevealGroup stagger={0.12} className="grid gap-5 md:grid-cols-3 md:gap-6">
        {picks.map((r) => (
          <RevealItem key={r.id} y={28}>
            <Tilt max={6} className="h-full">
              <blockquote className="flex h-full flex-col justify-between gap-8 rounded-[18px] border border-line bg-surface p-7 md:p-8">
                <p className="font-display text-[1.35rem] leading-[1.35] text-ink md:text-[1.5rem]">“{r.text}”</p>
                <footer className="flex items-center justify-between gap-3 text-[13.5px] text-muted">
                  <span>{r.author}</span>
                  <Stars value={r.rating} />
                </footer>
              </blockquote>
            </Tilt>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}

export function VisitBlock() {
  const settings = useSalonStore((s) => s.settings);
  const today = weekdayOf(todayISO());
  return (
    <Section id="visit" className="hairline-t scroll-mt-14">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading label="Find us" title="Visit" className="mb-6 md:mb-6" />
          <Reveal delay={0.15}>
            <address className="flex flex-col gap-4 not-italic">
              <p className="text-[17px] leading-[1.5] text-ink">{settings.contact.address}</p>
              <p className="flex flex-col gap-1 text-[15.5px] text-muted">
                <a href={telHref(settings.contact.phone)} className="tabular w-fit hover:text-ink">{formatPhone(settings.contact.phone)}</a>
                <a href={`mailto:${settings.contact.email}`} className="w-fit hover:text-ink">{settings.contact.email}</a>
              </p>
              {settings.contact.mapUrl && (
                <a
                  href={settings.contact.mapUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hit-area group inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink"
                >
                  Open in maps
                  <span aria-hidden className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">→</span>
                </a>
              )}
            </address>
            {settings.modules.booking && (
              <ButtonLink href="/book" className="mt-9">
                Book a time
              </ButtonLink>
            )}
          </Reveal>
        </div>
        <Reveal className="lg:col-span-6 lg:col-start-7" delay={0.2}>
          <HoursTable hours={settings.hours} today={today} />
        </Reveal>
      </div>
    </Section>
  );
}

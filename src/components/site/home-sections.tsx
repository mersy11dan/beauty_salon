"use client";

import clsx from "clsx";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { formatDateShort, todayISO, weekdayOf } from "@/lib/dates";
import { useSalonStore } from "@/lib/store";
import { HoursTable } from "./hours-table";
import { Section, SectionHeading } from "./section";
import { ServiceRows } from "./service-list";
import { Stars } from "./stars";

export function ServicesPreview() {
  const services = useSalonStore((s) => s.services);
  const modules = useSalonStore((s) => s.settings.modules);
  if (!modules.services || services.length === 0) return null;
  const featured = services.slice(0, 6);
  return (
    <Section className="hairline-t">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            title="Services and prices"
            intro="Everything is priced up front. Times are how long to set aside, including a chat at the start."
            className="mb-0 md:mb-0"
          />
          <Link href="/services" className="group mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-ink">
            Full list
            <span aria-hidden className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">→</span>
          </Link>
        </div>
        <div className="lg:col-span-7">
          <ServiceRows services={featured} bookable={modules.booking} compact />
        </div>
      </div>
    </Section>
  );
}

export function PortfolioStrip() {
  const portfolio = useSalonStore((s) => s.portfolio);
  const modules = useSalonStore((s) => s.settings.modules);
  if (!modules.portfolio || portfolio.length === 0) return null;
  const items = portfolio.slice(0, 5);
  return (
    <Section bleed className="hairline-t">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading title="Recent work" more={{ href: "/portfolio", label: "See the portfolio" }} />
      </div>
      <div className="no-scrollbar flex gap-5 overflow-x-auto px-6 pb-2 md:gap-7 lg:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
        {items.map((p, i) => (
          <figure
            key={p.id}
            className={clsx(
              "w-[68vw] shrink-0 sm:w-[44vw] md:w-[30vw] lg:w-[22vw] lg:max-w-[300px]",
              i % 2 === 1 && "md:mt-10",
            )}
          >
            <div className="aspect-[3/4] overflow-hidden rounded-[14px] bg-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out-expo hover:scale-[1.03]"
              />
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between text-[13.5px]">
              <span className="text-ink">{p.caption}</span>
              <span className="text-faint">{p.category}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

export function AboutBlock() {
  const about = useSalonStore((s) => s.settings.about);
  const staff = useSalonStore((s) => s.staff);
  const modules = useSalonStore((s) => s.settings.modules);
  return (
    <Section className="hairline-t">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
        <h2 className="font-display text-display-lg text-balance text-ink lg:col-span-5">{about.heading}</h2>
        <div className="lg:col-span-6 lg:col-start-7">
          <p className="text-[17px] leading-[1.65] text-ink/85">{about.body}</p>
          {modules.staff && staff.length > 0 && (
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              {staff.map((m) => (
                <Link key={m.id} href="/team" className="group flex items-center gap-3">
                  <Avatar name={m.name} photo={m.photo} />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[14.5px] text-ink group-hover:underline underline-offset-4">{m.name}</span>
                    <span className="text-[12.5px] text-muted">{m.role}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
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
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-display-md text-ink">{first.title}</p>
          <p className="mt-1.5 text-[15px] text-muted">
            {first.detail} Until {formatDateShort(first.until)}.
          </p>
        </div>
        <ButtonLink href="/offers" variant="secondary" className="self-start md:self-auto">
          {live.length > 1 ? `All ${live.length} offers` : "Details"}
        </ButtonLink>
      </div>
    </Section>
  );
}

export function ReviewsPreview() {
  const reviews = useSalonStore((s) => s.reviews);
  const modules = useSalonStore((s) => s.settings.modules);
  if (!modules.reviews || reviews.length === 0) return null;
  const picks = reviews.slice(0, 2);
  return (
    <Section className="hairline-t">
      <SectionHeading title="What people say" more={{ href: "/reviews", label: `All ${reviews.length} reviews` }} />
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        {picks.map((r) => (
          <blockquote key={r.id} className="flex flex-col gap-5">
            <p className="font-display text-[1.5rem] leading-[1.3] text-ink md:text-[1.7rem]">“{r.text}”</p>
            <footer className="flex items-center gap-3 text-[13.5px] text-muted">
              <Stars value={r.rating} />
              <span>{r.author}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </Section>
  );
}

export function VisitBlock() {
  const settings = useSalonStore((s) => s.settings);
  const today = weekdayOf(todayISO());
  const tel = settings.contact.phone.replace(/[^+\d]/g, "");
  return (
    <Section id="visit" className="hairline-t scroll-mt-14">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 className="font-display text-display-lg text-ink">Visit</h2>
          <address className="mt-6 flex flex-col gap-4 not-italic">
            <p className="text-[17px] leading-[1.5] text-ink">{settings.contact.address}</p>
            <p className="flex flex-col gap-1 text-[15.5px] text-muted">
              <a href={`tel:${tel}`} className="w-fit hover:text-ink">{settings.contact.phone}</a>
              <a href={`mailto:${settings.contact.email}`} className="w-fit hover:text-ink">{settings.contact.email}</a>
            </p>
            {settings.contact.mapUrl && (
              <a
                href={settings.contact.mapUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink"
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
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <HoursTable hours={settings.hours} today={today} />
        </div>
      </div>
    </Section>
  );
}

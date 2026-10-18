"use client";

import clsx from "clsx";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { MOTION_OK, useMediaQuery } from "@/components/motion/use-media";
import { useCopy } from "@/lib/site-hooks";
import type { PortfolioItem } from "@/lib/types";
import { SectionHeading } from "./section";

function PortfolioHeading({ className }: { className?: string }) {
  const copy = useCopy();
  return (
    <SectionHeading
      label={copy.homePortfolioLabel}
      title={copy.homePortfolioTitle}
      more={{ href: "/portfolio", label: copy.homePortfolioLink }}
      className={className}
    />
  );
}

const CARD_WIDTH = "clamp(200px, 21vw, 300px)";

/**
 * Home portfolio: on large, motion-friendly screens the section pins and the
 * row of photos travels sideways as you scroll, each card turning in 3D as it
 * passes the centre. Elsewhere it is a plain horizontal snap strip.
 */
export function GalleryScroll({ items }: { items: PortfolioItem[] }) {
  const pinned = useMediaQuery(`(min-width: 1024px) and ${MOTION_OK}`);
  return pinned ? <Pinned items={items} /> : <Strip items={items} />;
}

function Pinned({ items }: { items: PortfolioItem[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items.length]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  return (
    <section ref={sectionRef} className="hairline-t relative" style={{ height: `${Math.max(220, 120 + items.length * 26)}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-12">
        <div className="mx-auto w-full max-w-6xl px-6">
          <PortfolioHeading className="mb-6 md:mb-8" />
        </div>

        <motion.div
          ref={trackRef}
          style={{ x, perspective: 1500 }}
          className="relative flex w-max items-start gap-8 pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] pr-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] [transform-style:preserve-3d]"
        >
          {items.map((p, i) => (
            <Card key={p.id} item={p} x={x} offset={i % 2 === 1 ? 40 : 0} />
          ))}
        </motion.div>

        <div className="mx-auto mt-10 w-full max-w-6xl px-6">
          <div className="h-px w-full bg-line">
            <motion.div className="h-px origin-left bg-ink" style={{ scaleX: scrollYProgress }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ item, x, offset }: { item: PortfolioItem; x: MotionValue<number>; offset: number }) {
  const ref = useRef<HTMLAnchorElement>(null);

  // Signed distance of the card's centre from the viewport centre, -1..1.
  const centre = useTransform(x, (v) => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return 0;
    const half = window.innerWidth / 2;
    const d = el.offsetLeft + v + el.offsetWidth / 2 - half;
    return Math.max(-1, Math.min(1, d / half));
  });
  const rotateY = useTransform(centre, (n) => n * -24);
  const z = useTransform(centre, (n) => -Math.abs(n) * 140);
  const opacity = useTransform(centre, (n) => 1 - Math.abs(n) * 0.35);

  return (
    <motion.a
      ref={ref}
      href={`/portfolio#${item.id}`}
      style={{ rotateY, z, opacity, width: CARD_WIDTH, marginTop: offset, transformStyle: "preserve-3d" }}
      className="group block shrink-0 will-change-transform"
    >
      <div className="aspect-[3/4] overflow-hidden rounded-[16px] bg-soft shadow-[0_30px_60px_-30px_color-mix(in_oklab,var(--ink)_45%,transparent)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt={item.alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.05]"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between text-[13.5px]">
        <span className="text-ink">{item.caption}</span>
        <span className="text-faint">{item.category}</span>
      </div>
    </motion.a>
  );
}

function Strip({ items }: { items: PortfolioItem[] }) {
  return (
    <section className="hairline-t py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <PortfolioHeading />
      </div>
      <RevealGroup
        stagger={0.07}
        amount={0.1}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 md:gap-7"
      >
        {items.map((p, i) => (
          <RevealItem key={p.id} className={clsx("w-[68vw] shrink-0 snap-start sm:w-[44vw] md:w-[30vw]", i % 2 === 1 && "md:mt-10")}>
            <Link href={`/portfolio#${p.id}`} className="group block">
              <div className="aspect-[3/4] overflow-hidden rounded-[14px] bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[13.5px]">
                <span className="text-ink">{p.caption}</span>
                <span className="text-faint">{p.category}</span>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

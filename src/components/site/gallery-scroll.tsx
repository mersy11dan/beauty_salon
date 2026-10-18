"use client";

import clsx from "clsx";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { CURSOR_LABEL_QUERY, CursorLabel } from "@/components/motion/cursor-label";
import { EASE_OUT_EXPO } from "@/components/motion/reveal";
import { FINE_POINTER, MOTION_OK, useMediaQuery } from "@/components/motion/use-media";
import type { PortfolioItem } from "@/lib/types";
import { SectionHeading } from "./section";

const CARD_WIDTH = "clamp(220px, 22vw, 310px)";
/** Lines the first card up with the page's content column. */
const GUTTER = "max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem))";
const TRACK_ID = "recent-work-track";

const MotionLink = motion.create(Link);

/**
 * Home portfolio: a staggered row of photos that only moves sideways when the
 * visitor moves it (drag, swipe, trackpad, the arrow buttons or the keyboard).
 * Scrolling up or down always scrolls the page. When the row first comes into
 * view the photos deal out from a fanned stack, and on large fine-pointer
 * screens each one turns in 3D as it passes the centre.
 */
export function GalleryScroll({ items }: { items: PortfolioItem[] }) {
  const reduce = useReducedMotion();
  const depth = useMediaQuery(`(min-width: 1024px) and ${FINE_POINTER} and ${MOTION_OK}`);
  const dragCursor = useMediaQuery(CURSOR_LABEL_QUERY);
  const trackRef = useRef<HTMLDivElement>(null);
  const dealt = useInView(trackRef, { once: true, amount: 0.35 });
  const { scrollX, scrollXProgress } = useScroll({ container: trackRef });
  const viewport = useMotionValue(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const drag = useDragScroll(trackRef);

  const syncEdges = () => {
    const t = trackRef.current;
    if (!t) return;
    const max = t.scrollWidth - t.clientWidth;
    const next = { start: t.scrollLeft <= 4, end: t.scrollLeft >= max - 4 };
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  };

  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    const measure = () => {
      viewport.set(t.clientWidth);
      const max = t.scrollWidth - t.clientWidth;
      setEdges({ start: t.scrollLeft <= 4, end: t.scrollLeft >= max - 4 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    return () => ro.disconnect();
  }, [viewport, items.length]);

  useMotionValueEvent(scrollX, "change", syncEdges);

  function step(dir: 1 | -1) {
    const t = trackRef.current;
    const cards = t?.querySelectorAll<HTMLElement>("[data-card]");
    if (!t || !cards || cards.length < 2) return;
    const span = cards[1].offsetLeft - cards[0].offsetLeft;
    const perPage = Math.max(1, Math.floor((t.clientWidth - 2 * cards[0].offsetLeft) / span));
    const index = Math.round(t.scrollLeft / span) + dir * perPage;
    t.scrollTo({ left: Math.max(0, index * span), behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section className="hairline-t py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          label="Portfolio"
          title="Recent work"
          more={{ href: "/portfolio", label: "See everything" }}
          className="mb-4 md:mb-6"
        />
      </div>

      <div
        ref={trackRef}
        id={TRACK_ID}
        role="region"
        aria-label="Recent work, scrolls sideways"
        data-lenis-prevent-horizontal
        data-cursor={dragCursor ? "Drag" : undefined}
        {...drag.handlers}
        className={clsx(
          "no-scrollbar relative flex select-none items-start gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain py-8 md:gap-7",
          "snap-x snap-mandatory lg:snap-none",
          dragCursor && "cursor-none",
        )}
        style={{ paddingInline: GUTTER, scrollPaddingInline: GUTTER }}
      >
        {items.map((item, i) => (
          <Card
            key={item.id}
            item={item}
            index={i}
            scrollX={scrollX}
            viewport={viewport}
            depth={depth}
            dealt={dealt || !!reduce}
            animateIn={!reduce}
            customCursor={dragCursor}
          />
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6">
        <div aria-hidden className="h-px flex-1 bg-line">
          <motion.div className="h-px origin-left bg-ink" style={{ scaleX: scrollXProgress }} />
        </div>
        <div className="flex items-center gap-2">
          <ArrowButton label="Previous photos" disabled={edges.start} onClick={() => step(-1)}>
            <ArrowLeft className="size-[18px]" strokeWidth={1.5} />
          </ArrowButton>
          <ArrowButton label="Next photos" disabled={edges.end} onClick={() => step(1)}>
            <ArrowRight className="size-[18px]" strokeWidth={1.5} />
          </ArrowButton>
        </div>
      </div>
      <CursorLabel />
    </section>
  );
}

function Card({
  item,
  index,
  scrollX,
  viewport,
  depth,
  dealt,
  animateIn,
  customCursor,
}: {
  item: PortfolioItem;
  index: number;
  scrollX: MotionValue<number>;
  viewport: MotionValue<number>;
  depth: boolean;
  dealt: boolean;
  animateIn: boolean;
  customCursor: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Signed distance of the card's centre from the track's visible centre, -1..1.
  const centre = useTransform([scrollX, viewport], ([x, w]: number[]) => {
    const el = ref.current;
    if (!el || !w) return 0;
    const half = w / 2;
    return Math.max(-1, Math.min(1, (el.offsetLeft - x + el.offsetWidth / 2 - half) / half));
  });
  const rotateY = useTransform(centre, (n) => (depth ? n * -18 : 0));
  const z = useTransform(centre, (n) => (depth ? -Math.abs(n) * 110 : 0));
  const opacity = useTransform(centre, (n) => (depth ? 1 - Math.abs(n) * 0.3 : 1));

  const lifted = index % 2 === 1;
  // A loose fan, so the stack reads as a hand of photos rather than one card.
  const fan = (index % 2 === 0 ? -1 : 1) * (2 + (index % 3) * 1.6);

  return (
    <motion.div
      ref={ref}
      data-card
      className={clsx("shrink-0 snap-start", lifted && "mt-10")}
      style={{ width: CARD_WIDTH, transformOrigin: "50% 90%" }}
      initial={animateIn ? "stacked" : false}
      animate={dealt ? "dealt" : "stacked"}
      variants={{
        stacked: { x: `${-index * 108}%`, y: lifted ? -24 : 16, rotate: fan, scale: 0.94 },
        dealt: {
          x: "0%",
          y: 0,
          rotate: 0,
          scale: 1,
          transition: { duration: 1.3, ease: EASE_OUT_EXPO, delay: 0.08 + index * 0.07 },
        },
      }}
    >
      <MotionLink
        href={`/portfolio#${item.id}`}
        draggable={false}
        style={{ rotateY, z, opacity, transformPerspective: 1200 }}
        className={clsx("group block rounded-[16px]", customCursor && "cursor-none")}
      >
        <div className="aspect-[3/4] overflow-hidden rounded-[16px] bg-soft shadow-[0_30px_60px_-34px_color-mix(in_oklab,var(--ink)_50%,transparent)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.05]"
          />
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-3 text-[13.5px]">
          <span className="truncate text-ink">{item.caption}</span>
          <span className="shrink-0 text-faint transition-colors duration-500 group-hover:text-accent">{item.category}</span>
        </div>
      </MotionLink>
    </motion.div>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-controls={TRACK_ID}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-line-strong text-ink transition-[background-color,border-color,color,opacity,transform] duration-300 ease-out-quart hover:border-ink hover:bg-ink hover:text-bg active:scale-95 disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

/**
 * Click-and-drag for mouse users, who otherwise have no way to pull a
 * horizontal scroller. Touch and trackpads keep their native scrolling. A drag
 * that travels more than a few pixels swallows the click that ends it, so
 * letting go over a photo doesn't open it.
 */
function useDragScroll(ref: RefObject<HTMLDivElement | null>) {
  const state = useRef<{ id: number; startX: number; startLeft: number; lastX: number; lastT: number; vx: number; moved: boolean } | null>(null);
  const swallowClick = useRef(false);

  const end = () => {
    const s = state.current;
    const t = ref.current;
    state.current = null;
    if (!s || !t || !s.moved) return;
    if (t.hasPointerCapture(s.id)) t.releasePointerCapture(s.id);
    swallowClick.current = true;
    // Carry a flick on a little, the way a touch scroll would.
    if (Math.abs(s.vx) > 0.25) t.scrollBy({ left: -s.vx * 280, behavior: "smooth" });
  };

  return {
    handlers: {
      onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
        swallowClick.current = false;
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        state.current = {
          id: e.pointerId,
          startX: e.clientX,
          startLeft: e.currentTarget.scrollLeft,
          lastX: e.clientX,
          lastT: e.timeStamp,
          vx: 0,
          moved: false,
        };
      },
      onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
        const s = state.current;
        const t = ref.current;
        if (!s || !t) return;
        const dx = e.clientX - s.startX;
        if (!s.moved) {
          if (Math.abs(dx) < 6) return;
          s.moved = true;
          t.setPointerCapture(s.id);
        }
        s.vx = (e.clientX - s.lastX) / Math.max(1, e.timeStamp - s.lastT);
        s.lastX = e.clientX;
        s.lastT = e.timeStamp;
        t.scrollLeft = s.startLeft - dx;
      },
      onPointerUp: end,
      onPointerCancel: end,
      onClickCapture: (e: React.MouseEvent) => {
        if (!swallowClick.current) return;
        swallowClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      },
    },
  };
}

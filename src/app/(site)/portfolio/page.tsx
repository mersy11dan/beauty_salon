"use client";

import clsx from "clsx";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { EASE_OUT_EXPO } from "@/components/motion/reveal";
import { ModuleGate } from "@/components/site/module-gate";
import { PageTitle } from "@/components/site/section";
import { useSalonStore } from "@/lib/store";
import type { PortfolioItem } from "@/lib/types";

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
function readHash() {
  return decodeURIComponent(window.location.hash.slice(1));
}

export default function PortfolioPage() {
  const portfolio = useSalonStore((s) => s.portfolio);
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<string>("All");
  const lastTrigger = useRef<HTMLElement | null>(null);

  // The URL hash is the open-photo state, so /portfolio#pf_hair_3 deep-links
  // from the home gallery and the browser back button closes the lightbox.
  const openId = useSyncExternalStore(subscribeHash, readHash, () => "");

  const categories = useMemo(() => ["All", ...Array.from(new Set(portfolio.map((p) => p.category)))], [portfolio]);
  const items = filter === "All" ? portfolio : portfolio.filter((p) => p.category === filter);
  const openIndex = items.findIndex((p) => p.id === openId);
  const open = openIndex >= 0 ? items[openIndex] : null;

  const setOpenId = useCallback((id: string | null) => {
    const url = id ? `#${id}` : window.location.pathname + window.location.search;
    history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, []);

  const show = useCallback(
    (id: string | null, trigger?: HTMLElement | null) => {
      if (trigger) lastTrigger.current = trigger;
      setOpenId(id);
    },
    [setOpenId],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (openIndex < 0 || items.length === 0) return;
      setOpenId(items[(openIndex + dir + items.length) % items.length].id);
    },
    [openIndex, items, setOpenId],
  );

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      lastTrigger.current?.focus({ preventScroll: true });
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") show(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, show, step]);

  return (
    <ModuleGate module="portfolio">
      <PageTitle
        label="Portfolio"
        title="Recent work"
        intro="Work from the last few months. Every photo is a real client who said yes to being shown."
      />
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
                  "relative h-9 rounded-full px-4 text-[13.5px] transition-colors duration-300",
                  filter === c ? "text-bg" : "text-ink hover:text-accent",
                )}
              >
                {filter === c && (
                  <motion.span
                    layoutId="portfolio-filter-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                {filter !== c && <span aria-hidden className="absolute inset-0 rounded-full border border-line-strong" />}
                <span className="relative">{c}</span>
              </button>
            ))}
          </div>
        )}

        <LayoutGroup>
          <motion.ul layout className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-7">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((p, i) => (
                <motion.li
                  key={p.id}
                  id={p.id}
                  layout
                  initial={reduce ? false : { opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: Math.min(i, 8) * 0.03 }}
                  className={clsx(i % 3 === 1 && "md:mt-12")}
                >
                  <Thumb item={p} hidden={open?.id === p.id} onOpen={(el) => show(p.id, el)} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>

          <AnimatePresence>
            {open && (
              <Lightbox
                item={open}
                index={openIndex}
                total={items.length}
                onClose={() => show(null)}
                onPrev={() => step(-1)}
                onNext={() => step(1)}
              />
            )}
          </AnimatePresence>
        </LayoutGroup>

        {items.length === 0 && <p className="text-[16px] text-muted">Nothing here yet.</p>}
      </div>
    </ModuleGate>
  );
}

function Thumb({ item, hidden, onOpen }: { item: PortfolioItem; hidden: boolean; onOpen: (el: HTMLElement) => void }) {
  return (
    <figure>
      <button
        type="button"
        onClick={(e) => onOpen(e.currentTarget)}
        aria-label={`Open ${item.caption}`}
        className="group block w-full cursor-zoom-in rounded-[14px] text-left"
      >
        <motion.div
          layoutId={`pf-${item.id}`}
          className={clsx("aspect-[3/4] overflow-hidden rounded-[14px] bg-soft", hidden && "invisible")}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.04]"
          />
        </motion.div>
      </button>
      <figcaption className="mt-3 flex items-baseline justify-between gap-3 text-[13.5px]">
        <span className="text-ink">{item.caption}</span>
        <span className="text-faint">{item.category}</span>
      </figcaption>
    </figure>
  );
}

function Lightbox({
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  item: PortfolioItem;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-zoom-out bg-ink/80 backdrop-blur-sm"
      />

      <div className="relative flex max-h-full w-full max-w-5xl flex-col items-center gap-4 md:flex-row md:items-end md:gap-8">
        <motion.div
          key={item.id}
          layoutId={`pf-${item.id}`}
          className="relative max-h-[78dvh] overflow-hidden rounded-[18px] bg-soft md:max-h-[84dvh]"
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.src} alt={item.alt} className="max-h-[78dvh] w-auto object-contain md:max-h-[84dvh]" />
        </motion.div>

        <motion.div
          className="flex w-full items-end justify-between gap-6 text-bg md:w-64 md:flex-col md:items-start md:pb-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.2 }}
        >
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-bg/60">{item.category}</p>
            <p className="font-script mt-1 text-[2rem] leading-[1.1] md:text-[2.4rem]">{item.caption}</p>
            <p className="tabular mt-2 text-[12.5px] text-bg/60">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LightboxButton label="Previous" onClick={onPrev}>
              ←
            </LightboxButton>
            <LightboxButton label="Next" onClick={onNext}>
              →
            </LightboxButton>
            <LightboxButton label="Close" onClick={onClose} ref={closeRef}>
              ×
            </LightboxButton>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function LightboxButton({
  label,
  onClick,
  children,
  ref,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-bg/30 text-[18px] text-bg transition-colors duration-200 hover:bg-bg hover:text-ink focus-visible:outline-bg"
    >
      {children}
    </button>
  );
}

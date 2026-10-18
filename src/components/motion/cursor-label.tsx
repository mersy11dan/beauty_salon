"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { EASE_OUT_EXPO } from "./reveal";
import { FINE_POINTER, MOTION_OK, useMediaQuery } from "./use-media";

/** When the label is live. Targets should hide the native cursor under the same query. */
export const CURSOR_LABEL_QUERY = `${FINE_POINTER} and ${MOTION_OK}`;

const SIZE = 88;

/**
 * A round label that trails the pointer while it is over any element carrying
 * `data-cursor`, showing that attribute's text. Fine-pointer, motion-friendly
 * devices only; nothing renders on touch.
 */
export function CursorLabel({ hidden = false }: { hidden?: boolean }) {
  const enabled = useMediaQuery(CURSOR_LABEL_QUERY);
  const [label, setLabel] = useState<string | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 420, damping: 34, mass: 0.5 };
  const x = useSpring(mx, spring);
  const y = useSpring(my, spring);

  useEffect(() => {
    if (!enabled) return;
    let seen = false;
    let px = 0;
    let py = 0;
    const read = (el: EventTarget | Element | null) => {
      const target = el instanceof Element ? el.closest<HTMLElement>("[data-cursor]") : null;
      setLabel(target?.dataset.cursor || null);
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!seen) {
        seen = true;
        x.jump(px);
        y.jump(py);
      }
      mx.set(px);
      my.set(py);
      read(e.target);
    };
    // Content scrolls under a still pointer without any pointer event firing.
    const scroll = () => {
      if (seen) read(document.elementFromPoint(px, py));
    };
    const leave = () => setLabel(null);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", move, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", move);
      window.removeEventListener("scroll", scroll);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [enabled, mx, my, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-40"
      style={{ x, y, width: SIZE, height: SIZE, translateX: "-50%", translateY: "-50%" }}
    >
      <AnimatePresence>
        {label && !hidden && (
          <motion.span
            key={label}
            className="font-script flex h-full w-full items-center justify-center rounded-full bg-accent pb-1 text-[1.75rem] leading-none text-accent-ink shadow-[0_18px_40px_-18px_color-mix(in_oklab,var(--ink)_60%,transparent)]"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.2 } }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";
import { EASE_OUT_EXPO } from "./reveal";
import { FINE_POINTER, MOTION_OK, useMediaQuery } from "./use-media";

/**
 * A small image that trails the pointer while `src` is set. Used for the
 * service list on the home page: hover a row, see the kind of work it means.
 * Fine-pointer devices only; nothing renders on touch.
 */
const WIDTH = 180;

export function CursorPreview({ src, alt = "" }: { src: string | null; alt?: string }) {
  const enabled = useMediaQuery(`${FINE_POINTER} and ${MOTION_OK}`);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 260, damping: 28, mass: 0.5 };
  const x = useSpring(mx, spring);
  const y = useSpring(my, spring);

  useEffect(() => {
    if (!enabled) return;
    // Sit to the right of the pointer, flipping to the left near the edge.
    const move = (e: PointerEvent) => {
      const right = e.clientX + 28;
      mx.set(right + WIDTH > window.innerWidth - 16 ? e.clientX - 28 - WIDTH : right);
      my.set(e.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", move);
    };
  }, [enabled, mx, my]);

  if (!enabled) return null;

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          key={src}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-40 overflow-hidden rounded-[12px] shadow-[0_24px_50px_-20px_color-mix(in_oklab,var(--ink)_55%,transparent)]"
          style={{ x, y, width: WIDTH, translateY: "-50%" }}
          initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="aspect-[3/4] w-full object-cover" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

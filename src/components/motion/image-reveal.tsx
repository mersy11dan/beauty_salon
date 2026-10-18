"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT_EXPO } from "./reveal";

/**
 * Curtain reveal for photos: the frame wipes open from its bottom edge when it
 * scrolls into view. Put a `RevealZoom` inside the frame's clipping box and the
 * photo settles from a slight zoom on the same timeline. The zoom can sit under
 * other motion elements (shared-layout frames, parallax) as long as they don't
 * set their own `initial`/`animate`, and must not be under an
 * `AnimatePresence initial={false}`, which would skip the hidden state.
 */
export function RevealFrame({
  children,
  className,
  delay = 0,
  amount = 0.2,
  radius = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Seconds. */
  delay?: number;
  /** Trigger when this fraction of the frame is in view. */
  amount?: number;
  /** Corner radius in px, so the moving edge matches a rounded frame. */
  radius?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const round = radius ? ` round ${radius}px` : "";
  // The in-view trigger must not be the clipped element: Chrome's
  // IntersectionObserver measures through the target's own clip-path, so a
  // fully clipped target never counts as visible.
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, show: { transition: { delayChildren: delay } } }}
    >
      <motion.div
        variants={{
          hidden: { clipPath: `inset(100% 0% 0% 0%${round})` },
          show: {
            clipPath: `inset(0% 0% 0% 0%${round})`,
            // Dropped once open so shared-layout children can fly outside the frame.
            transitionEnd: { clipPath: "none" },
            transition: { duration: 1.2, ease: EASE_OUT_EXPO },
          },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function RevealZoom({
  children,
  className,
  from = 1.2,
}: {
  children: ReactNode;
  className?: string;
  /** Starting scale. */
  from?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { scale: from },
        show: { scale: 1, transition: { duration: 1.6, ease: EASE_OUT_EXPO } },
      }}
    >
      {children}
    </motion.div>
  );
}

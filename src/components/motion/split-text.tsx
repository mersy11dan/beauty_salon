"use client";

import clsx from "clsx";
import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT_EXPO } from "./reveal";

/**
 * Word-by-word mask reveal: each word rises out of its own clipped line box.
 * Keeps words as real text (selectable, searchable, readable by screen readers).
 */
export function SplitWords({
  text,
  className,
  delay = 0,
  stagger = 0.045,
  duration = 1.1,
  inView = false,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  /** Animate when scrolled into view instead of on mount. */
  inView?: boolean;
  as?: "span" | "h1" | "h2" | "p";
}) {
  const reduce = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  if (reduce) return <Tag className={className}>{text}</Tag>;

  const trigger = inView
    ? { whileInView: "show" as const, viewport: { once: true, amount: 0.6 } }
    : { animate: "show" as const };

  return (
    <Tag className={className} aria-label={text}>
      <motion.span
        aria-hidden
        className="inline"
        initial="hidden"
        {...trigger}
        variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      >
        {words.map((w, i) => (
          <span key={i} className={clsx("clip-line inline-block align-bottom", i < words.length - 1 && "mr-[0.26em]")}>
            <motion.span
              className="inline-block will-change-transform"
              variants={{
                hidden: { y: "112%", rotate: 2 },
                show: { y: "0%", rotate: 0, transition: { duration, ease: EASE_OUT_EXPO } },
              }}
            >
              {w}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

const MOTION_TAGS = { span: motion.span, h1: motion.h1, h2: motion.h2, p: motion.p } as const;

/**
 * Soft reveal for script type: the swashes overhang any clip box, so instead of
 * masking we let the line settle in from a slight blur.
 */
export function ScriptReveal({
  children,
  className,
  delay = 0,
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  delay?: number;
  as?: "span" | "h1" | "h2" | "p";
}) {
  const reduce = useReducedMotion();
  if (reduce) return <Tag className={className}>{children}</Tag>;
  const MotionTag = MOTION_TAGS[Tag];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </MotionTag>
  );
}

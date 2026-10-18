"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

type RevealProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children: ReactNode;
  /** Seconds. */
  delay?: number;
  /** Pixels to travel on entry. */
  y?: number;
  /** Trigger when this fraction of the element is in view. */
  amount?: number;
  once?: boolean;
};

/** Fade-and-rise when scrolled into view. Static when motion is reduced. */
export function Reveal({ children, delay = 0, y = 22, amount = 0.25, once = true, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={rest.className as string | undefined}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 1, ease: EASE_OUT_EXPO, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container: children that are `RevealItem` enter one after another. */
export function RevealGroup({
  children,
  stagger = 0.08,
  amount = 0.2,
  className,
}: {
  children: ReactNode;
  stagger?: number;
  amount?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
      }}
    >
      {children}
    </motion.div>
  );
}

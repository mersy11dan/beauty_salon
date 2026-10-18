"use client";

import clsx from "clsx";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { FINE_POINTER, useMediaQuery } from "./use-media";

/**
 * Pointer-driven 3D tilt. Children laid out with `preserve-3d` can use
 * `translateZ` to float at different depths. Only active on hover-capable,
 * fine-pointer devices; a plain box everywhere else.
 */
export function Tilt({
  children,
  className,
  max = 9,
  scale = 1.015,
  perspective = 1100,
}: {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. */
  max?: number;
  scale?: number;
  perspective?: number;
}) {
  const reduce = useReducedMotion();
  const enabled = useMediaQuery(FINE_POINTER);
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 140, damping: 18, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const s = useSpring(1, spring);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    s.set(1);
  };

  if (reduce || !enabled) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ perspective }} className={clsx("[transform-style:preserve-3d]", className)}>
      <motion.div
        className="h-full w-full [transform-style:preserve-3d] will-change-transform"
        style={{ rotateX, rotateY, scale: s }}
        onPointerMove={onMove}
        onPointerEnter={() => s.set(scale)}
        onPointerLeave={onLeave}
      >
        {children}
      </motion.div>
    </div>
  );
}

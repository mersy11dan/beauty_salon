"use client";

import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";

/**
 * Inertia scrolling for the public site. Native scroll is kept (so anchors,
 * find-in-page and scroll-driven motion still work); Lenis only smooths the
 * wheel/touch input. Disabled when the visitor prefers reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -56 } });
    let frame = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);
  return <>{children}</>;
}

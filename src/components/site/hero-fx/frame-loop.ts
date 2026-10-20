import { useEffect, useEffectEvent, useRef, type RefObject } from "react";

/**
 * requestAnimationFrame loop that sleeps while the element is off screen or
 * the tab is hidden. `onFrame` returns false once there is nothing left to
 * animate; the loop then stops until `wake` changes or the returned kick is called.
 */
export function useFrameLoop(
  enabled: boolean,
  wake: unknown,
  target: RefObject<Element | null>,
  onFrame: (dt: number) => boolean,
) {
  const frame = useEffectEvent(onFrame);
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = 0;
    let onScreen = true;
    let done = false;

    const tick = (now: number) => {
      raf = 0;
      // Clamp so a dropped frame or a background stall never teleports the animation.
      const dt = last ? Math.min(Math.max((now - last) / 1000, 0), 0.05) : 1 / 60;
      last = now;
      if (!frame(dt)) {
        done = true;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      const run = onScreen && !document.hidden && !done;
      if (run && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const el = target.current;
    const io = el
      ? new IntersectionObserver(([entry]) => {
          onScreen = entry.isIntersecting;
          sync();
        })
      : null;
    if (el && io) io.observe(el);
    document.addEventListener("visibilitychange", sync);
    kick.current = () => {
      done = false;
      sync();
    };
    sync();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      kick.current = () => {};
    };
  }, [enabled, wake, target]);

  return kick;
}

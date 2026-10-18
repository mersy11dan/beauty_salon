import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Continuous horizontal ticker. Content is rendered twice so the loop is
 * seamless; the copy is aria-hidden. Pauses on hover and under reduced motion
 * (handled by the global reduced-motion rule, which freezes the keyframes).
 */
export function Marquee({
  children,
  className,
  durationSec = 38,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  durationSec?: number;
  reverse?: boolean;
}) {
  return (
    <div className={clsx("group/marquee overflow-hidden", className)}>
      <div
        className="flex w-max items-center [animation:marquee_var(--marquee-duration)_linear_infinite] group-hover/marquee:[animation-play-state:paused] motion-reduce:[animation:none]"
        style={{ "--marquee-duration": `${durationSec}s`, animationDirection: reverse ? "reverse" : "normal" } as React.CSSProperties}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

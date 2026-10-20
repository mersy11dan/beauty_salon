import type { CSSProperties, PointerEvent, ReactNode, Ref } from "react";

/** Native size of every built-in hero photo. */
export const PHOTO_W = 736;
export const PHOTO_H = 1104;

/** Matches the hero's `object-position: 50% 28%`. */
const FOCUS_Y = 0.28;

/*
  The box `object-cover` would give the photo, written in container units so
  canvases can be laid exactly over it without measuring anything in JS.
*/
const W = `max(100cqw, 100cqh * ${PHOTO_W / PHOTO_H})`;
const H = `max(100cqh, 100cqw * ${PHOTO_H / PHOTO_W})`;
const STAGE_STYLE: CSSProperties = {
  position: "absolute",
  width: W,
  height: H,
  left: `calc((100cqw - ${W}) * 0.5)`,
  top: `calc((100cqh - ${H}) * ${FOCUS_Y})`,
};

/** Pointer position in photo pixels. Works under the hero's 3D tilt because offsetX/Y are local. */
export function photoPoint(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  return {
    x: (e.nativeEvent.offsetX * PHOTO_W) / Math.max(1, el.clientWidth),
    y: (e.nativeEvent.offsetY * PHOTO_H) / Math.max(1, el.clientHeight),
  };
}

export function FxStage({
  src,
  alt,
  hidePhoto,
  stageRef,
  children,
}: {
  src: string;
  alt: string;
  /** Hide the plain photo once a canvas is drawing the full picture on top. */
  hidePhoto?: boolean;
  stageRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 [container-type:size]">
      <div ref={stageRef} style={STAGE_STYLE}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="absolute inset-0 h-full w-full select-none"
          // Opacity rather than visibility, so the alt text stays with assistive tech.
          style={hidePhoto ? { opacity: 0 } : undefined}
        />
        {children}
      </div>
    </div>
  );
}

/** Canvas sized to the photo's own pixels, so drawn detail matches the photo's sharpness. */
export function FxCanvas({ canvasRef, className }: { canvasRef: Ref<HTMLCanvasElement>; className?: string }) {
  return (
    <canvas
      ref={canvasRef}
      width={PHOTO_W}
      height={PHOTO_H}
      aria-hidden
      className={className ?? "pointer-events-none absolute inset-0 h-full w-full"}
    />
  );
}

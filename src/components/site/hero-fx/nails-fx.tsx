"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { FINE_POINTER, MOTION_OK, useMediaQuery } from "@/components/motion/use-media";
import { useFrameLoop } from "./frame-loop";
import { NailPainter } from "./nail-painter";
import { FxCanvas, FxStage, photoPoint } from "./stage";
import type { FxProps } from "./types";

export function NailsFx({ src, alt, active, accent }: FxProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [painter, setPainter] = useState<NailPainter | null>(null);
  const motionOk = useMediaQuery(MOTION_OK);
  const fine = useMediaQuery(FINE_POINTER);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!motionOk || !canvas) return;
    let cancelled = false;
    NailPainter.create(canvas, src, accent)
      .then((p) => {
        if (!cancelled) setPainter(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // The accent is picked up live below; reloading the painter for it would restart the show.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionOk, src]);

  useEffect(() => {
    painter?.setAccent(accent);
  }, [painter, accent]);

  useEffect(() => {
    if (painter && active) painter.start();
  }, [painter, active]);

  const kick = useFrameLoop(Boolean(painter) && motionOk, active, stageRef, (dt) => painter?.frame(dt, active) ?? false);

  const interactive = Boolean(painter) && motionOk && fine && active;
  const handlers = interactive
    ? {
        onPointerEnter: (e: PointerEvent<HTMLDivElement>) => {
          painter?.pointerEnter(photoPoint(e));
          kick.current();
        },
        onPointerMove: (e: PointerEvent<HTMLDivElement>) => painter?.pointerMove(photoPoint(e)),
        onPointerLeave: () => painter?.pointerLeave(),
        onPointerDown: () => painter?.nextShade(),
      }
    : {};

  return (
    <FxStage src={src} alt={alt} stageRef={stageRef}>
      <FxCanvas canvasRef={canvasRef} />
      {interactive && <div className="absolute inset-0 cursor-none" {...handlers} />}
    </FxStage>
  );
}

"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { FINE_POINTER, MOTION_OK, useMediaQuery } from "@/components/motion/use-media";
import { useFrameLoop } from "./frame-loop";
import { MAKEUP_MAPS, MakeupMotion } from "./makeup-motion";
import { FxCanvas, FxStage, photoPoint } from "./stage";
import type { FxProps } from "./types";
import { useFlowPhoto } from "./use-flow-photo";

export function MakeupFx({ src, alt, active }: FxProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);
  const [motion, setMotion] = useState<MakeupMotion | null>(null);
  const motionOk = useMediaQuery(MOTION_OK);
  const fine = useMediaQuery(FINE_POINTER);
  const renderer = useFlowPhoto(canvasRef, src, MAKEUP_MAPS, motionOk);

  useEffect(() => {
    const canvas = dustRef.current;
    if (!motionOk || !canvas) return;
    let cancelled = false;
    MakeupMotion.create(canvas)
      .then((m) => {
        if (!cancelled) setMotion(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [motionOk]);

  const ready = Boolean(renderer && motion);
  const kick = useFrameLoop(ready, active, stageRef, (dt) => {
    if (!renderer || !motion) return false;
    const out = motion.frame(dt, active);
    renderer.render(out.frame);
    return out.busy;
  });

  const interactive = ready && fine && active;
  const handlers = interactive
    ? {
        onPointerEnter: (e: PointerEvent<HTMLDivElement>) => {
          motion?.pointerEnter(photoPoint(e));
          kick.current();
        },
        onPointerMove: (e: PointerEvent<HTMLDivElement>) => motion?.pointerMove(photoPoint(e)),
        onPointerLeave: () => motion?.pointerLeave(),
        onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
          motion?.pointerDown(photoPoint(e));
          kick.current();
        },
      }
    : {};

  return (
    <FxStage src={src} alt={alt} stageRef={stageRef} hidePhoto={Boolean(renderer)}>
      <FxCanvas canvasRef={canvasRef} />
      <FxCanvas canvasRef={dustRef} />
      {interactive && <div className="absolute inset-0" {...handlers} />}
    </FxStage>
  );
}

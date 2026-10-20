"use client";

import { useRef, useState, type PointerEvent } from "react";
import { FINE_POINTER, MOTION_OK, useMediaQuery } from "@/components/motion/use-media";
import { useFrameLoop } from "./frame-loop";
import { HAIR_MAPS, HairMotion } from "./hair-motion";
import { FxCanvas, FxStage, photoPoint } from "./stage";
import type { FxProps } from "./types";
import { useFlowPhoto } from "./use-flow-photo";

export function HairFx({ src, alt, active }: FxProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [motion] = useState(() => new HairMotion());
  const motionOk = useMediaQuery(MOTION_OK);
  const fine = useMediaQuery(FINE_POINTER);
  const renderer = useFlowPhoto(canvasRef, src, HAIR_MAPS, motionOk);

  const kick = useFrameLoop(Boolean(renderer), active, stageRef, (dt) => {
    if (!renderer) return false;
    const out = motion.frame(dt, active);
    renderer.render(out.frame);
    return out.busy;
  });

  const interactive = Boolean(renderer) && fine && active;
  const handlers = interactive
    ? {
        onPointerEnter: (e: PointerEvent<HTMLDivElement>) => {
          motion.pointerEnter(photoPoint(e));
          kick.current();
        },
        onPointerMove: (e: PointerEvent<HTMLDivElement>) => motion.pointerMove(photoPoint(e)),
        onPointerLeave: () => motion.pointerLeave(),
      }
    : {};

  return (
    <FxStage src={src} alt={alt} stageRef={stageRef} hidePhoto={Boolean(renderer)}>
      <FxCanvas canvasRef={canvasRef} />
      {interactive && <div className="absolute inset-0" {...handlers} />}
    </FxStage>
  );
}

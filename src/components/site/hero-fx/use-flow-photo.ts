import { useEffect, useState, type RefObject } from "react";
import { FlowPhoto, type FlowConfig } from "./flow-gl";

/** Sets up the WebGL photo once the canvas exists. Stays null without WebGL, so the still photo shows. */
export function useFlowPhoto(canvasRef: RefObject<HTMLCanvasElement | null>, src: string, maps: Omit<FlowConfig, "photo">, enabled: boolean) {
  const [renderer, setRenderer] = useState<FlowPhoto | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    let cancelled = false;
    let made: FlowPhoto | null = null;
    FlowPhoto.create(canvas, { ...maps, photo: src })
      .then((r) => {
        if (!r) return;
        if (cancelled) {
          r.dispose();
          return;
        }
        made = r;
        // Draw the still frame first, so swapping out the plain photo never flashes.
        r.render({ phase: 0 });
        setRenderer(r);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      made?.dispose();
    };
  }, [canvasRef, src, maps, enabled]);

  return enabled && renderer?.ready ? renderer : null;
}

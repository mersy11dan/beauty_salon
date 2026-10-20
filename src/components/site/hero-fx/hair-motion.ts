import type { FlowConfig, FlowFrame } from "./flow-gl";
import { approach, clamp, easeInOutCubic, lerp } from "./util";

type Pt = { x: number; y: number };

export const HAIR_MAPS: Omit<FlowConfig, "photo"> = {
  flow: "/media/hero/fx/hair-flow.png",
  mask: "/media/hero/fx/hair-mask.png",
  noise: 0.55,
  // Fingers part the strands sideways and the hair falls back in under a second.
  trail: { heal: 3.2, across: 1 },
  // The band of diamond holes on the barrel's end cap, fitted from the hole positions.
  scroll: { cx: 519, radius: 95, period: 0.2172, rect: [425, 145, 612, 180] },
};

/** Seconds for the hair to travel one loop of the flow map (one hole of barrel turn). */
const CYCLE = 1.6;
const SHEEN_EVERY = 3.6;
const SHEEN_SWEEP = 1.8;
const TAU = Math.PI * 2;

export class HairMotion {
  private t = 0;
  private speed = 0;
  private phase = 0;
  private swing = { x: 0, v: 0 };
  private pointer: Pt | null = null;
  private at: Pt = { x: 0, y: 0 };
  private vel: Pt = { x: 0, y: 0 };
  private presence = 0;

  pointerEnter(p: Pt) {
    this.pointer = p;
    this.at = { ...p };
    this.vel = { x: 0, y: 0 };
  }

  pointerMove(p: Pt) {
    this.pointer = p;
  }

  pointerLeave() {
    this.pointer = null;
  }

  frame(dt: number, active: boolean): { frame: FlowFrame; busy: boolean } {
    this.t += dt;
    this.speed = approach(this.speed, active ? 1 : 0, active ? 1.4 : 2.5, dt);
    this.phase = (this.phase + (dt * this.speed) / CYCLE) % 1;

    const p = this.pointer;
    const from = { ...this.at };
    if (p) {
      const x = approach(this.at.x, p.x, 28, dt);
      const y = approach(this.at.y, p.y, 28, dt);
      const step = Math.max(dt, 1e-3);
      this.vel.x = approach(this.vel.x, (x - this.at.x) / step, 9, dt);
      this.vel.y = approach(this.vel.y, (y - this.at.y) / step, 9, dt);
      this.at = { x, y };
    } else {
      this.vel.x = approach(this.vel.x, 0, 6, dt);
      this.vel.y = approach(this.vel.y, 0, 6, dt);
    }
    this.presence = approach(this.presence, p ? 1 : 0, p ? 6 : 3, dt);

    // Loose hair rides a damped spring, so a quick flick of the pointer sets it swinging.
    const force = -20 * this.swing.x - 3.4 * this.swing.v + clamp(this.vel.x, -2000, 2000) * 0.09 * this.presence;
    this.swing.v += force * dt;
    this.swing.x = clamp(this.swing.x + this.swing.v * dt, -16, 16);

    const s = this.speed;
    const swayX = (3.6 * Math.sin((this.t * TAU) / 3.3) + 1.4 * Math.sin((this.t * TAU) / 1.9 + 1.3)) * s + this.swing.x;
    const swayY = 1.1 * Math.sin((this.t * TAU * 2) / 3.3 + 0.4) * s;

    const k = (this.t % SHEEN_EVERY) / SHEEN_SWEEP;
    const sheen = k < 1 ? { x: lerp(-140, 660, easeInOutCubic(k)), width: 80, amount: 0.3 * Math.sin(Math.PI * k) * s } : undefined;

    const pr = this.presence;
    const push = p
      ? {
          fromX: from.x,
          fromY: from.y,
          toX: this.at.x,
          toY: this.at.y,
          radius: 32,
          spread: 15 * pr,
          dragX: clamp(this.vel.x * 0.012, -14, 14) * pr,
          dragY: clamp(this.vel.y * 0.012, -14, 14) * pr,
        }
      : undefined;

    const settling = Math.abs(this.swing.x) > 0.05 || Math.abs(this.swing.v) > 0.5;
    return {
      frame: {
        dt,
        phase: this.phase,
        scrollPhase: this.phase,
        rigid: { x: swayX, y: swayY, angle: 0, pivotX: 0, pivotY: 0 },
        push,
        sheen,
      },
      busy: active || s > 0.003 || pr > 0.003 || settling,
    };
  }
}

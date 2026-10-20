import type { FlowConfig, FlowFrame } from "./flow-gl";
import { PHOTO_H, PHOTO_W } from "./stage";
import { approach, clamp, imagePixels, loadImage, makeCanvas } from "./util";

type Pt = { x: number; y: number };

export const MAKEUP_MAPS: Omit<FlowConfig, "photo"> = {
  flow: "/media/hero/fx/makeup-flow.png",
  mask: "/media/hero/fx/makeup-mask.png",
  noise: 0.7,
  // Powder pushed aside hangs in the air a while before it drifts back.
  trail: { heal: 1.4, across: 0 },
};

/** Powder colours sampled from the photo, most common first. */
const PALETTE = ["#e3a392", "#dc917d", "#f3b4a2", "#cd7b68", "#b96352", "#9b4a3d", "#7f2f24"];
const WEIGHTS = [0.255, 0.183, 0.17, 0.126, 0.11, 0.091, 0.065];

/** The brush head as an ellipse in photo pixels; its dome tops out at y = 250. */
const HEAD = { x: 368, y: 385, rx: 150, ry: 135 };
/** The brush pivots about a hand somewhere below the frame. */
const PIVOT = { x: 368, y: 1060 };

const CYCLE = 2.4;
const TAP_EVERY = 2.7;
const FIRST_TAP = 0.55;
const DIP = 0.11;
const DIP_DEPTH = 9;
const MAX_PARTICLES = 900;
const TAU = Math.PI * 2;

const SPECK = 0;
const CHUNK = 1;
const PUFF = 2;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
  grow: number;
  alpha: number;
  colour: number;
  kind: number;
};

function pickColour(dark = 0) {
  let r = Math.random() * (1 - dark) + dark;
  for (let i = 0; i < WEIGHTS.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return i;
  }
  return WEIGHTS.length - 1;
}

/** A soft round sprite per colour, blurred with a canvas shadow. */
function softSprites() {
  const size = 96;
  const OFF = 4000;
  return PALETTE.map((c) => {
    const { canvas, ctx } = makeCanvas(size, size);
    ctx.shadowColor = c;
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = OFF;
    ctx.beginPath();
    ctx.arc(size / 2 - OFF, size / 2, 18, 0, TAU);
    ctx.fill();
    return canvas;
  });
}

export class MakeupMotion {
  private ctx: CanvasRenderingContext2D;
  private sprites = softSprites();
  /** Points where the photo already shows powder, for the ambient glitter. */
  private spots: Float32Array;
  private particles: Particle[] = [];

  private t = 0;
  private speed = 0;
  private phase = 0;
  private boost = 0;
  private nextTap = FIRST_TAP;
  private tapT = -1;
  private struck = false;
  private ambient = 0;
  private wasActive = false;

  private pointer: Pt | null = null;
  private at: Pt = { x: 0, y: 0 };
  private vel: Pt = { x: 0, y: 0 };
  private trail = 0;
  private presence = 0;
  private lean = { x: 0, y: 0, a: 0 };

  private constructor(canvas: HTMLCanvasElement, spots: Float32Array) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.spots = spots;
  }

  static async create(canvas: HTMLCanvasElement) {
    const mask = imagePixels(await loadImage(MAKEUP_MAPS.mask));
    const sx = PHOTO_W / mask.width;
    const sy = PHOTO_H / mask.height;
    const pts: number[] = [];
    for (let y = 0; y < mask.height; y += 2) {
      for (let x = 0; x < mask.width; x += 2) {
        if (mask.data[(y * mask.width + x) * 4] > 170) pts.push(x * sx, y * sy);
      }
    }
    return new MakeupMotion(canvas, new Float32Array(pts));
  }

  pointerEnter(p: Pt) {
    this.pointer = p;
    this.at = { ...p };
    this.vel = { x: 0, y: 0 };
    this.trail = 0;
  }

  pointerMove(p: Pt) {
    this.pointer = p;
  }

  pointerLeave() {
    this.pointer = null;
  }

  /** Click: tap the brush now and throw a pinch of powder from the pointer. */
  pointerDown(p: Pt) {
    if (this.tapT < 0 || this.tapT > DIP + 0.35) this.startTap();
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * TAU;
      const sp = 40 + Math.random() * Math.random() * 260;
      this.spawn(p.x, p.y, Math.cos(a) * sp, Math.sin(a) * sp - 20, SPECK);
    }
    for (let i = 0; i < 3; i++) this.spawn(p.x, p.y, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, PUFF);
  }

  private startTap() {
    this.tapT = 0;
    this.struck = false;
  }

  private spawn(x: number, y: number, vx: number, vy: number, kind: number) {
    if (this.particles.length >= MAX_PARTICLES) return;
    const big = Math.random();
    this.particles.push({
      x,
      y,
      vx,
      vy,
      age: 0,
      life: kind === PUFF ? 1.1 + Math.random() * 0.9 : kind === CHUNK ? 1.4 + Math.random() : 0.8 + Math.random() * 1.4,
      r: kind === PUFF ? 16 + Math.random() * 18 : kind === CHUNK ? 2.4 + Math.random() * 2.6 : 0.55 + big * big * 2,
      grow: kind === PUFF ? 34 + Math.random() * 30 : 0,
      alpha: kind === PUFF ? 0.14 + Math.random() * 0.12 : 0.75 + Math.random() * 0.25,
      colour: kind === CHUNK ? pickColour(0.45) : kind === PUFF ? pickColour() % 3 : pickColour(),
      kind,
    });
  }

  /** Powder knocked off the bristles at the bottom of a tap. */
  private burst(dy: number) {
    for (let i = 0; i < 260; i++) {
      // Mostly off the dome, some off the sides, from a little way inside the bristles.
      const a = Math.PI - 0.35 + Math.random() * (Math.PI + 0.7);
      const k = 0.78 + Math.random() * 0.26;
      const x = HEAD.x + Math.cos(a) * HEAD.rx * k;
      const y = HEAD.y + dy + Math.sin(a) * HEAD.ry * k;
      let nx = Math.cos(a) / HEAD.rx;
      let ny = Math.sin(a) / HEAD.ry;
      const n = Math.hypot(nx, ny);
      nx /= n;
      ny /= n;
      const sp = 50 + Math.pow(Math.random(), 2.2) * 420;
      this.spawn(x, y, nx * sp + (Math.random() - 0.5) * 60, ny * sp + (Math.random() - 0.5) * 60, i % 16 === 0 ? CHUNK : SPECK);
    }
    for (let i = 0; i < 12; i++) {
      const a = Math.PI - 0.2 + Math.random() * (Math.PI + 0.4);
      const sp = 25 + Math.random() * 45;
      this.spawn(HEAD.x + Math.cos(a) * HEAD.rx * 0.92, HEAD.y + dy + Math.sin(a) * HEAD.ry * 0.92, Math.cos(a) * sp, Math.sin(a) * sp, PUFF);
    }
  }

  private tapOffset() {
    const s = this.tapT;
    if (s < 0) return 0;
    if (s < DIP) {
      const k = s / DIP;
      return DIP_DEPTH * k * k;
    }
    const tau = s - DIP;
    return DIP_DEPTH * Math.exp(-5.5 * tau) * Math.cos((TAU * tau) / 0.42);
  }

  frame(dt: number, active: boolean): { frame: FlowFrame; busy: boolean } {
    if (active && !this.wasActive) {
      this.t = 0;
      this.nextTap = FIRST_TAP;
    }
    this.wasActive = active;
    this.t += dt;
    this.speed = approach(this.speed, active ? 1 : 0, active ? 1.5 : 2.5, dt);

    if (active && this.t >= this.nextTap) {
      this.startTap();
      this.nextTap += TAP_EVERY;
    }
    if (this.tapT >= 0) {
      this.tapT += dt;
      if (!this.struck && this.tapT >= DIP) {
        this.struck = true;
        this.boost = 1;
        this.burst(DIP_DEPTH);
      }
      if (this.tapT > DIP + 1.6) this.tapT = -1;
    }
    this.boost *= Math.exp(-2.6 * dt);
    this.phase = (this.phase + (dt * this.speed * (1 + 2.4 * this.boost)) / CYCLE) % 1;

    const from = { ...this.at };
    this.trackPointer(dt);
    this.emitAmbient(dt, active);
    this.step(dt);
    this.draw();

    const s = this.speed;
    const dip = this.tapOffset();
    const idleX = 1.4 * Math.sin((this.t * TAU) / 4.3) * s;
    const idleY = 1.0 * Math.sin((this.t * TAU) / 3.1 + 1) * s;
    const idleA = 0.0018 * Math.sin((this.t * TAU) / 5.2) * s;
    const pr = this.presence;
    const push = this.pointer
      ? {
          fromX: from.x,
          fromY: from.y,
          toX: this.at.x,
          toY: this.at.y,
          radius: 44,
          spread: 14 * pr,
          dragX: clamp(this.vel.x * 0.02, -22, 22) * pr,
          dragY: clamp(this.vel.y * 0.02, -22, 22) * pr,
        }
      : undefined;

    return {
      frame: {
        dt,
        phase: this.phase,
        rigid: {
          x: idleX + this.lean.x,
          y: idleY + dip + this.lean.y,
          angle: idleA + this.lean.a - dip * 0.0004,
          pivotX: PIVOT.x,
          pivotY: PIVOT.y,
        },
        push,
      },
      busy: active || s > 0.003 || pr > 0.003 || this.particles.length > 0 || this.tapT >= 0,
    };
  }

  private trackPointer(dt: number) {
    const p = this.pointer;
    let lx = 0;
    let ly = 0;
    let la = 0;
    if (p) {
      const x = approach(this.at.x, p.x, 30, dt);
      const y = approach(this.at.y, p.y, 30, dt);
      const step = Math.max(dt, 1e-3);
      this.vel.x = approach(this.vel.x, (x - this.at.x) / step, 9, dt);
      this.vel.y = approach(this.vel.y, (y - this.at.y) / step, 9, dt);
      const dist = Math.hypot(x - this.at.x, y - this.at.y);
      this.trail += dist;
      const n = Math.floor(this.trail / 4);
      this.trail -= n * 4;
      for (let i = 0; i < n; i++) {
        const k = Math.random();
        const jx = (Math.random() - 0.5) * 12;
        const jy = (Math.random() - 0.5) * 12;
        this.spawn(
          this.at.x + (x - this.at.x) * k + jx,
          this.at.y + (y - this.at.y) * k + jy,
          this.vel.x * 0.16 + (Math.random() - 0.5) * 60,
          this.vel.y * 0.16 + (Math.random() - 0.5) * 60 - 10,
          SPECK,
        );
        if (Math.random() < 0.06) this.spawn(this.at.x + jx, this.at.y + jy, this.vel.x * 0.08, this.vel.y * 0.08, PUFF);
      }
      this.at = { x, y };
      // The brush leans a touch toward the pointer, as if it were following your hand.
      lx = clamp((x - HEAD.x) * 0.012, -5, 5);
      ly = clamp((y - HEAD.y) * 0.008, -3, 3);
      la = clamp((x - HEAD.x) / 420, -1, 1) * 0.011;
    } else {
      this.vel.x = approach(this.vel.x, 0, 6, dt);
      this.vel.y = approach(this.vel.y, 0, 6, dt);
    }
    this.presence = approach(this.presence, p ? 1 : 0, p ? 6 : 3, dt);
    this.lean.x = approach(this.lean.x, lx, 5, dt);
    this.lean.y = approach(this.lean.y, ly, 5, dt);
    this.lean.a = approach(this.lean.a, la, 5, dt);
  }

  private emitAmbient(dt: number, active: boolean) {
    if (!active || this.spots.length === 0) return;
    this.ambient += dt * 22;
    while (this.ambient >= 1) {
      this.ambient -= 1;
      const i = (Math.random() * (this.spots.length / 2)) | 0;
      const x = this.spots[i * 2];
      const y = this.spots[i * 2 + 1];
      const dx = x - HEAD.x;
      const dy = y - 410;
      const r = Math.hypot(dx, dy) || 1;
      const ux = dx / r;
      const uy = dy / r;
      const sp = 6 + Math.random() * 12;
      this.spawn(x, y, (0.78 * ux + 0.5 * uy) * sp, (0.78 * uy - 0.5 * ux) * sp, SPECK);
    }
  }

  private step(dt: number) {
    const drag = Math.exp(-2.2 * dt);
    const list = this.particles;
    let w = 0;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      p.age += dt;
      if (p.age >= p.life) continue;
      const pd = p.kind === PUFF ? Math.exp(-1.2 * dt) : drag;
      p.vx *= pd;
      p.vy = p.vy * pd + (p.kind === CHUNK ? 70 : p.kind === SPECK ? 26 : -4) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += p.grow * dt;
      list[w++] = p;
    }
    list.length = w;
  }

  private draw() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, PHOTO_W, PHOTO_H);
    ctx.lineCap = "round";
    for (const p of this.particles) {
      const k = p.age / p.life;
      const fade = Math.min(1, p.age / 0.08) * (k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1);
      const a = p.alpha * fade;
      if (a <= 0.004) continue;
      ctx.globalAlpha = a;
      if (p.kind === PUFF) {
        const d = p.r * 4.4;
        ctx.drawImage(this.sprites[p.colour], p.x - d / 2, p.y - d / 2, d, d);
        continue;
      }
      ctx.fillStyle = PALETTE[p.colour];
      const sp = Math.hypot(p.vx, p.vy);
      // Fast grains smear into short streaks, like powder caught on a slow shutter.
      const len = sp * 0.014;
      if (len > p.r) {
        ctx.strokeStyle = PALETTE[p.colour];
        ctx.lineWidth = p.r * 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (p.vx / sp) * len, p.y - (p.vy / sp) * len);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

import { NAIL_SHADE_BOX, NAILS } from "./nails-data";
import { BRISTLE_LENGTH, drawBrushShadow, drawPolishBrush, type BrushPose } from "./polish-brush";
import { PHOTO_H, PHOTO_W } from "./stage";
import {
  approach,
  clamp,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  hexLinear,
  imagePixels,
  isHex,
  lerp,
  linearToByte,
  loadImage,
  makeCanvas,
} from "./util";

const SHADE_SRC = "/media/hero/fx/nails-shade.webp";

/** Shades after the salon's own accent, so the first coat always matches the brand. */
const SHADES = ["#8E1230", "#2B1E22", "#B4505E", "#C98F86"];

type Pt = { x: number; y: number };

type Nail = {
  path: Path2D;
  start: Pt;
  dir: Pt;
  normal: Pt;
  length: number;
  halfWidth: number;
  /** Handle direction while painting this nail: along the stroke, turned a little to the left. */
  angle: number;
  bbox: [number, number, number, number];
};

const HANDLE_TURN = (14 * Math.PI) / 180;
const HAND_ANGLE = Math.atan2(0.66, -0.75);

type Step =
  | { kind: "move"; t0: number; t1: number; from: Pt; to: Pt; a0: number; a1: number; l0: number; l1: number; ease: (t: number) => number; arc: number }
  | { kind: "land"; t0: number; t1: number; nail: number }
  | { kind: "stroke"; t0: number; t1: number; nail: number };

const DELAY = 0.45;
const ENTER = 0.75;
const LAND = 0.12;
const STROKE = 0.5;
const TRAVEL = 0.36;
const EXIT = 0.6;
const GLINT = 0.55;
const GLINT_STAGGER = 0.09;
/** How far ahead of the bristle tip the polish is already down, hidden under the bristles. */
const LEAD = BRISTLE_LENGTH * 0.55;

function buildNails(): Nail[] {
  return NAILS.map((n) => {
    const path = new Path2D();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < n.outline.length; i += 2) {
      const x = n.outline[i];
      const y = n.outline[i + 1];
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    path.closePath();
    const dx = n.end[0] - n.start[0];
    const dy = n.end[1] - n.start[1];
    const length = Math.hypot(dx, dy);
    const dir = { x: dx / length, y: dy / length };
    return {
      path,
      start: { x: n.start[0], y: n.start[1] },
      dir,
      normal: { x: -dir.y, y: dir.x },
      length,
      halfWidth: n.width / 2,
      angle: Math.atan2(dir.y, dir.x) + HANDLE_TURN,
      bbox: [minX, minY, maxX, maxY],
    };
  });
}

function buildProgram(nails: Nail[]) {
  const steps: Step[] = [];
  let t = DELAY;
  const along = (n: Nail, u: number): Pt => ({ x: n.start.x + n.dir.x * u, y: n.start.y + n.dir.y * u });
  const first = nails[0];
  const offIn = { x: -140, y: PHOTO_H + 80 };
  steps.push({ kind: "move", t0: t, t1: t + ENTER, from: offIn, to: along(first, 6), a0: first.angle + 0.25, a1: first.angle, l0: 1, l1: 0.35, ease: easeOutCubic, arc: 60 });
  t += ENTER;
  nails.forEach((n, i) => {
    steps.push({ kind: "land", t0: t, t1: t + LAND, nail: i });
    t += LAND;
    steps.push({ kind: "stroke", t0: t, t1: t + STROKE, nail: i });
    t += STROKE;
    const from = along(n, n.length + 10);
    const next = nails[i + 1];
    if (next) {
      steps.push({ kind: "move", t0: t, t1: t + TRAVEL, from, to: along(next, 6), a0: n.angle, a1: next.angle, l0: 0, l1: 0.35, ease: easeInOutCubic, arc: 34 });
      t += TRAVEL;
    } else {
      steps.push({ kind: "move", t0: t, t1: t + EXIT, from, to: { x: -220, y: PHOTO_H + 160 }, a0: n.angle, a1: n.angle + 0.2, l0: 0, l1: 1, ease: easeInCubic, arc: 20 });
      t += EXIT;
    }
  });
  const glintStart = t - EXIT * 0.6;
  return { steps, end: t, glintStart, glintEnd: glintStart + GLINT + GLINT_STAGGER * nails.length };
}

/** Recolour the nails from the shade map: linear-light base colour times the nail's own shading, plus its gloss. */
function tint(shade: ImageData, hex: string) {
  const [r, g, b] = hexLinear(hex);
  const out = new ImageData(shade.width, shade.height);
  const s = shade.data;
  const o = out.data;
  for (let i = 0; i < s.length; i += 4) {
    const a = s[i + 2];
    if (!a) continue;
    const d = (s[i] / 255) * 1.3;
    const sp = (s[i + 1] / 255) * 0.85;
    o[i] = linearToByte(r * d + sp);
    o[i + 1] = linearToByte(g * d + sp);
    o[i + 2] = linearToByte(b * d + sp);
    o[i + 3] = a;
  }
  return out;
}

export class NailPainter {
  private ctx: CanvasRenderingContext2D;
  private photo: HTMLImageElement;
  private shade: ImageData;
  private nails = buildNails();
  private program = buildProgram(this.nails);
  private tints = new Map<string, HTMLCanvasElement>();
  private base = makeCanvas(NAIL_SHADE_BOX[2], NAIL_SHADE_BOX[3]);
  private coverage = makeCanvas(NAIL_SHADE_BOX[2], NAIL_SHADE_BOX[3]);
  private work = makeCanvas(NAIL_SHADE_BOX[2], NAIL_SHADE_BOX[3]);
  private shadow = makeCanvas(PHOTO_W, PHOTO_H);
  private hit = makeCanvas(1, 1).ctx;

  private accent: string;
  private shadeIndex = 0;
  private colour = SHADES[0];
  private t = 0;
  private idle = 0;
  private mode: "auto" | "hand" | "rest" = "rest";
  private pose: BrushPose = { x: -200, y: PHOTO_H + 200, angle: HAND_ANGLE, lift: 1, press: 0, alpha: 0 };
  private pointer: Pt | null = null;
  private last: Pt | null = null;
  private velocity = 0;
  private dirty = true;

  private constructor(canvas: HTMLCanvasElement, photo: HTMLImageElement, shade: ImageData, accent: string) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.photo = photo;
    this.shade = shade;
    this.accent = isHex(accent) ? accent : SHADES[0];
  }

  static async create(canvas: HTMLCanvasElement, photoSrc: string, accent: string) {
    const [photo, shadeImg] = await Promise.all([loadImage(photoSrc), loadImage(SHADE_SRC)]);
    return new NailPainter(canvas, photo, imagePixels(shadeImg), accent);
  }

  setAccent(accent: string) {
    if (isHex(accent)) this.accent = accent;
  }

  private shadeAt(i: number) {
    const list = [this.accent, ...SHADES.filter((s) => s.toLowerCase() !== this.accent.toLowerCase())];
    return list[i % list.length];
  }

  /** Fresh nude nails and the next shade, painted by the automatic brush. */
  start() {
    this.colour = this.shadeAt(this.shadeIndex++);
    this.base.ctx.clearRect(0, 0, this.base.canvas.width, this.base.canvas.height);
    this.coverage.ctx.clearRect(0, 0, this.coverage.canvas.width, this.coverage.canvas.height);
    this.t = 0;
    this.idle = 0;
    this.mode = "auto";
    this.dirty = true;
  }

  pointerEnter(p: Pt) {
    // Taking over mid-show keeps what is painted and carries on in the same shade.
    const midShow = this.mode === "auto" && this.t < this.program.glintStart;
    if (!midShow) this.newCoat();
    this.mode = "hand";
    this.pointer = p;
    this.last = null;
  }

  pointerMove(p: Pt) {
    this.pointer = p;
  }

  pointerLeave() {
    if (this.mode === "hand") this.mode = "rest";
    this.pointer = null;
    this.last = null;
  }

  /** Click: lay the next shade over what is there. */
  nextShade() {
    this.newCoat();
  }

  private newCoat() {
    this.flatten();
    this.colour = this.shadeAt(this.shadeIndex++);
  }

  /** Bake the current coat into the base layer so a new shade can go on top. */
  private flatten() {
    this.compose();
    this.base.ctx.drawImage(this.work.canvas, 0, 0);
    this.coverage.ctx.clearRect(0, 0, this.coverage.canvas.width, this.coverage.canvas.height);
    this.dirty = true;
  }

  private tintCanvas(hex: string) {
    let c = this.tints.get(hex);
    if (!c) {
      const made = makeCanvas(this.shade.width, this.shade.height);
      made.ctx.putImageData(tint(this.shade, hex), 0, 0);
      c = made.canvas;
      if (this.tints.size > 6) this.tints.clear();
      this.tints.set(hex, c);
    }
    return c;
  }

  private compose() {
    const w = this.work.ctx;
    w.globalCompositeOperation = "source-over";
    w.clearRect(0, 0, this.work.canvas.width, this.work.canvas.height);
    w.drawImage(this.tintCanvas(this.colour), 0, 0);
    w.globalCompositeOperation = "destination-in";
    w.drawImage(this.coverage.canvas, 0, 0);
    w.globalCompositeOperation = "source-over";
  }

  /** Paint everything on nail `i` up to `front` px along its stroke, with the centre of the wet edge leading. */
  private coverTo(i: number, front: number) {
    const n = this.nails[i];
    const hw = n.halfWidth + 10;
    const c = this.coverage.ctx;
    const at = (u: number, v: number) => ({ x: n.start.x + n.dir.x * u + n.normal.x * v, y: n.start.y + n.dir.y * u + n.normal.y * v });
    c.save();
    c.setTransform(1, 0, 0, 1, -NAIL_SHADE_BOX[0], -NAIL_SHADE_BOX[1]);
    c.clip(n.path);
    c.beginPath();
    const a = at(-20, -hw);
    c.moveTo(a.x, a.y);
    for (let k = 0; k <= 12; k++) {
      const v = -hw + (2 * hw * k) / 12;
      const q = at(front - 30 * Math.pow(v / hw, 2), v);
      c.lineTo(q.x, q.y);
    }
    const b = at(-20, hw);
    c.lineTo(b.x, b.y);
    c.closePath();
    c.fillStyle = "#000";
    c.fill();
    c.restore();
    this.dirty = true;
  }

  /** Free-hand stroke: a capsule under the bristles, from the last contact to this one. */
  private dab(from: Pt, to: Pt, angle: number) {
    const c = this.coverage.ctx;
    const hx = Math.cos(angle);
    const hy = Math.sin(angle);
    const r = 19;
    for (const n of this.nails) {
      const [x0, y0, x1, y1] = n.bbox;
      const reach = r + BRISTLE_LENGTH * 0.5;
      if (to.x < x0 - reach || to.x > x1 + reach || to.y < y0 - reach || to.y > y1 + reach) continue;
      c.save();
      c.setTransform(1, 0, 0, 1, -NAIL_SHADE_BOX[0], -NAIL_SHADE_BOX[1]);
      c.clip(n.path);
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = "#000";
      c.lineWidth = r * 2;
      c.beginPath();
      c.moveTo(from.x, from.y);
      c.lineTo(to.x, to.y);
      c.lineTo(to.x + hx * BRISTLE_LENGTH * 0.45, to.y + hy * BRISTLE_LENGTH * 0.45);
      c.stroke();
      c.restore();
    }
    this.dirty = true;
  }

  private onNail(p: Pt) {
    return this.nails.some((n) => this.hit.isPointInPath(n.path, p.x, p.y));
  }

  private autoPose(t: number): BrushPose | null {
    const step = this.program.steps.find((s) => t >= s.t0 && t < s.t1);
    if (!step) return null;
    const k = (t - step.t0) / (step.t1 - step.t0);
    if (step.kind === "move") {
      const e = step.ease(k);
      // Arc up and away from the hand between nails.
      const mx = (step.from.x + step.to.x) / 2 - step.arc * 0.6;
      const my = (step.from.y + step.to.y) / 2 - step.arc;
      const u = 1 - e;
      return {
        x: u * u * step.from.x + 2 * u * e * mx + e * e * step.to.x,
        y: u * u * step.from.y + 2 * u * e * my + e * e * step.to.y,
        angle: lerp(step.a0, step.a1, e),
        lift: lerp(step.l0, step.l1, step.l1 > step.l0 ? easeOutCubic(k) : k),
        press: 0,
        alpha: 1,
      };
    }
    const n = this.nails[step.nail];
    if (step.kind === "land") {
      const e = easeInOutCubic(k);
      this.coverTo(step.nail, 6 + LEAD * e);
      return { x: n.start.x + n.dir.x * 6, y: n.start.y + n.dir.y * 6, angle: n.angle, lift: 0.35 * (1 - e), press: e, alpha: 1 };
    }
    const e = easeInOutCubic(k);
    const u = lerp(6, n.length + 10, e);
    this.coverTo(step.nail, u + LEAD);
    const wobble = Math.sin(t * 11) * 0.02;
    return { x: n.start.x + n.dir.x * u, y: n.start.y + n.dir.y * u, angle: n.angle + wobble, lift: 0, press: 1, alpha: 1 };
  }

  private updateHand(dt: number) {
    const p = this.pointer;
    if (!p) return;
    const prev = { x: this.pose.x, y: this.pose.y };
    this.pose.x = approach(this.pose.x, p.x, 26, dt);
    this.pose.y = approach(this.pose.y, p.y, 26, dt);
    const vx = (this.pose.x - prev.x) / Math.max(dt, 1e-3);
    this.velocity = approach(this.velocity, vx, 10, dt);
    this.pose.angle = approach(this.pose.angle, HAND_ANGLE + clamp(this.velocity / 2400, -0.22, 0.22), 12, dt);
    const touching = this.onNail(this.pose);
    this.pose.lift = approach(this.pose.lift, touching ? 0 : 0.5, 18, dt);
    this.pose.press = approach(this.pose.press, touching ? 1 : 0, 18, dt);
    this.pose.alpha = approach(this.pose.alpha, 1, 14, dt);
    const here = { x: this.pose.x, y: this.pose.y };
    if (touching && this.pose.lift < 0.15) this.dab(this.last ?? here, here, this.pose.angle);
    this.last = touching ? here : null;
  }

  private drawGlints(t: number) {
    const ctx = this.ctx;
    const g0 = this.program.glintStart;
    if (t < g0 || t > this.program.glintEnd) return;
    const OFF = 6000;
    this.nails.forEach((n, i) => {
      const k = (t - g0 - i * GLINT_STAGGER) / GLINT;
      if (k <= 0 || k >= 1) return;
      const u = lerp(-20, n.length + 20, easeInOutCubic(k));
      const hw = n.halfWidth + 12;
      const cx = n.start.x + n.dir.x * u;
      const cy = n.start.y + n.dir.y * u;
      ctx.save();
      ctx.clip(n.path);
      ctx.globalCompositeOperation = "screen";
      ctx.shadowColor = `rgba(255, 255, 255, ${0.55 * Math.sin(Math.PI * k)})`;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = OFF;
      ctx.beginPath();
      const bw = 7;
      ctx.moveTo(cx - n.dir.x * bw + n.normal.x * hw - OFF, cy - n.dir.y * bw + n.normal.y * hw);
      ctx.lineTo(cx + n.dir.x * bw + n.normal.x * hw - OFF, cy + n.dir.y * bw + n.normal.y * hw);
      ctx.lineTo(cx + n.dir.x * bw - n.normal.x * hw - OFF, cy + n.dir.y * bw - n.normal.y * hw);
      ctx.lineTo(cx - n.dir.x * bw - n.normal.x * hw - OFF, cy - n.dir.y * bw - n.normal.y * hw);
      ctx.closePath();
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.restore();
    });
  }

  /** Advance and draw one frame. Returns false when nothing will change until the next input. */
  frame(dt: number, active: boolean): boolean {
    this.idle = active ? 0 : this.idle + dt;
    this.t += dt;
    let brush: BrushPose | null = null;

    if (this.mode === "auto") {
      brush = this.autoPose(this.t);
      if (brush) this.pose = { ...brush };
      if (this.t > this.program.glintEnd) this.mode = "rest";
    } else if (this.mode === "hand") {
      this.updateHand(dt);
      brush = this.pose;
    } else if (this.pose.alpha > 0.01) {
      this.pose.alpha = approach(this.pose.alpha, 0, 16, dt);
      this.pose.lift = approach(this.pose.lift, 1, 10, dt);
      brush = this.pose;
    }

    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, PHOTO_W, PHOTO_H);
    if (this.dirty) {
      this.compose();
      this.dirty = false;
    }
    ctx.drawImage(this.base.canvas, NAIL_SHADE_BOX[0], NAIL_SHADE_BOX[1]);
    ctx.drawImage(this.work.canvas, NAIL_SHADE_BOX[0], NAIL_SHADE_BOX[1]);
    this.drawGlints(this.t);

    if (brush && brush.alpha > 0.01) {
      const scale = 1 + brush.lift * 0.07;
      const lifted = { ...brush, x: brush.x - 3 * brush.lift, y: brush.y - 8 * brush.lift };
      const s = this.shadow.ctx;
      s.globalCompositeOperation = "source-over";
      s.clearRect(0, 0, PHOTO_W, PHOTO_H);
      drawBrushShadow(s, lifted, scale);
      // Shadows only land on the hand and sleeve, never on the empty backdrop.
      s.globalCompositeOperation = "destination-in";
      s.drawImage(this.photo, 0, 0, PHOTO_W, PHOTO_H);
      s.globalCompositeOperation = "source-over";
      ctx.drawImage(this.shadow.canvas, 0, 0);
      drawPolishBrush(ctx, lifted, scale, this.colour);
    }

    const busy = this.mode !== "rest" || (brush !== null && brush.alpha > 0.01);
    return busy || (!active && this.idle < 0.1);
  }
}

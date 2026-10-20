/*
  A nail polish brush drawn in local space: the origin is the bristle tip that
  touches the nail and +x runs up the brush toward the cap. The far end widens
  a little because the handle tilts up toward the camera.

  Every pose the painter uses points the handle down and to the left, so local
  +y always faces the photo's light (top left). Highlights sit on that side.
*/

const BRISTLE = 64;
const STEM = 146;
const NECK = 16;
const CAP = 330;

export const BRISTLE_LENGTH = BRISTLE;

const OFF = 6000;

function bristleWidth(press: number) {
  return 38 + 14 * press;
}

/** Flat, loaded bristles: square shoulders, a rounded tip that flattens as it is pressed. */
function bristlePath(press: number, inset = 0) {
  const tw = bristleWidth(press) - inset * 2;
  const bw = 11 - inset;
  const dome = 6 - 3 * press;
  const x0 = inset;
  const p = new Path2D();
  p.moveTo(x0 + dome, -tw / 2);
  p.quadraticCurveTo(x0 - dome, 0, x0 + dome, tw / 2);
  p.bezierCurveTo(BRISTLE * 0.42, tw / 2, BRISTLE * 0.66, bw * 0.7, BRISTLE, bw / 2);
  p.lineTo(BRISTLE, -bw / 2);
  p.bezierCurveTo(BRISTLE * 0.66, -bw * 0.7, BRISTLE * 0.42, -tw / 2, x0 + dome, -tw / 2);
  p.closePath();
  return p;
}

/** Trapezoid along +x from x0 to x1, half-widths h0 and h1, centred on y = c. */
function band(x0: number, x1: number, h0: number, h1: number, c = 0) {
  const p = new Path2D();
  p.moveTo(x0, c - h0);
  p.lineTo(x1, c - h1);
  p.lineTo(x1, c + h1);
  p.lineTo(x0, c + h0);
  p.closePath();
  return p;
}

const STEM_X0 = BRISTLE - 3;
const STEM_X1 = BRISTLE + STEM;
const CAP_X0 = STEM_X1 + NECK;
const CAP_X1 = CAP_X0 + CAP;

function capPath() {
  const p = new Path2D();
  p.moveTo(CAP_X0, -30);
  p.lineTo(CAP_X1 - 10, -34);
  p.quadraticCurveTo(CAP_X1, -34, CAP_X1, -24);
  p.lineTo(CAP_X1, 24);
  p.quadraticCurveTo(CAP_X1, 34, CAP_X1 - 10, 34);
  p.lineTo(CAP_X0, 30);
  p.closePath();
  return p;
}

function silhouette(ctx: CanvasRenderingContext2D, press: number) {
  ctx.fill(bristlePath(press));
  ctx.fill(band(STEM_X0, STEM_X1, 4.5, 5.5));
  ctx.fill(band(STEM_X1, CAP_X0, 6, 30));
  ctx.fill(capPath());
}

function shadeHex(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

/** Fill `path` as a blurred shape only, by drawing it off canvas and casting its shadow back. */
function softFill(ctx: CanvasRenderingContext2D, path: Path2D, colour: string, blur: number) {
  ctx.save();
  const m = ctx.getTransform();
  ctx.setTransform(m.a, m.b, m.c, m.d, m.e - OFF, m.f);
  ctx.shadowColor = colour;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = OFF;
  ctx.fillStyle = "#000";
  ctx.fill(path);
  ctx.restore();
}

export type BrushPose = {
  x: number;
  y: number;
  /** Direction from the bristle tip toward the cap, in radians. */
  angle: number;
  /** 0 resting on the nail, 1 well clear of it. */
  lift: number;
  /** 0..1, how far the bristles fan out against the nail. */
  press: number;
  alpha: number;
};

/**
 * Soft contact shadow. The tip's shadow sits close to the brush and the cap's
 * falls further away, the way a tilted brush casts one under a top-left light.
 */
export function drawBrushShadow(ctx: CanvasRenderingContext2D, pose: BrushPose, scale: number) {
  const ox = 0.55;
  const oy = 0.83;
  const h0 = 3 + pose.lift * 38;
  const k = 0.16;
  const c = Math.cos(pose.angle) * scale;
  const s = Math.sin(pose.angle) * scale;
  ctx.save();
  ctx.setTransform(c + ox * k * scale, s + oy * k * scale, -s, c, pose.x + ox * h0 - OFF, pose.y + oy * h0);
  ctx.shadowColor = `rgba(28, 14, 10, ${0.5 * pose.alpha * (1 - pose.lift * 0.5)})`;
  ctx.shadowBlur = 4 + pose.lift * 16;
  ctx.shadowOffsetX = OFF;
  ctx.fillStyle = "#000";
  silhouette(ctx, pose.press);
  ctx.restore();
}

export function drawPolishBrush(ctx: CanvasRenderingContext2D, pose: BrushPose, scale: number, colour: string) {
  ctx.save();
  ctx.globalAlpha = pose.alpha;
  ctx.translate(pose.x, pose.y);
  ctx.rotate(pose.angle);
  ctx.scale(scale, scale);

  // Cap: glossy black cylinder with a hard window highlight and a soft fill light.
  const cap = capPath();
  ctx.fillStyle = "#141113";
  ctx.fill(cap);
  ctx.save();
  ctx.clip(cap);
  softFill(ctx, band(CAP_X0, CAP_X1, 6, 7, 9), "rgba(255, 255, 255, 0.1)", 8);
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.fill(band(CAP_X0 + 6, CAP_X1 - 8, 1.6, 1.9, 17));
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fill(band(CAP_X0, CAP_X1, 1.2, 1.4, -25));
  ctx.fillStyle = "#2a2427";
  ctx.fillRect(CAP_X0, -34, 5, 68);
  ctx.restore();

  // Neck into the cap.
  ctx.fillStyle = "#1c1719";
  ctx.fill(band(STEM_X1, CAP_X0, 6, 30));
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fill(band(STEM_X1, CAP_X0, 0.8, 4, 4));

  // Stem, coated in polish from the bottle.
  const stem = band(STEM_X0, STEM_X1, 4.5, 5.5);
  ctx.fillStyle = shadeHex(colour, -0.2);
  ctx.fill(stem);
  ctx.save();
  ctx.clip(stem);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fill(band(STEM_X0, STEM_X1, 1.6, 2, -3.4));
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fill(band(STEM_X0, STEM_X1, 0.7, 0.8, 2));
  ctx.restore();

  // Bristles, a flat bundle soaked in polish: dark underside, lit top face, a wet streak.
  const tw = bristleWidth(pose.press);
  const bristles = bristlePath(pose.press);
  ctx.fillStyle = shadeHex(colour, -0.38);
  ctx.fill(bristles);
  ctx.save();
  ctx.clip(bristles);
  ctx.save();
  ctx.translate(0, 2.5);
  softFill(ctx, bristlePath(pose.press, 4), shadeHex(colour, -0.08), 4);
  ctx.restore();
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.14)";
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(BRISTLE, i * 1.1);
    ctx.bezierCurveTo(BRISTLE * 0.6, i * 3, BRISTLE * 0.3, (i * tw) / 9.6, 0, (i * tw) / 9.2);
    ctx.stroke();
  }
  const streak = new Path2D();
  streak.moveTo(BRISTLE - 6, 1.5);
  streak.bezierCurveTo(BRISTLE * 0.6, tw * 0.2, BRISTLE * 0.3, tw * 0.27, 8, tw * 0.27);
  ctx.lineCap = "round";
  ctx.save();
  const m = ctx.getTransform();
  ctx.setTransform(m.a, m.b, m.c, m.d, m.e - OFF, m.f);
  ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = OFF;
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#000";
  ctx.stroke(streak);
  ctx.restore();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.stroke(streak);
  ctx.restore();

  // Bead of wet polish along the tip.
  const dome = 6 - 3 * pose.press;
  const bead = new Path2D();
  bead.moveTo(dome + 1, -tw / 2 + 2);
  bead.quadraticCurveTo(-dome + 1, 0, dome + 1, tw / 2 - 2);
  ctx.lineCap = "round";
  ctx.lineWidth = 5;
  ctx.strokeStyle = colour;
  ctx.stroke(bead);
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.beginPath();
  ctx.ellipse(2.2, tw * 0.2, 1.2, tw * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

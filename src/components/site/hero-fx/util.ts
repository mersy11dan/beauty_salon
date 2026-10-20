export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

export function imagePixels(img: HTMLImageElement): ImageData {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

export function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas: c, ctx };
}

const HEX = /^#?([0-9a-f]{6})$/i;

export function isHex(v: string) {
  return HEX.test(v.trim());
}

export function hexRgb(hex: string): [number, number, number] {
  const m = HEX.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

export function hexLinear(hex: string): [number, number, number] {
  const [r, g, b] = hexRgb(hex);
  return [toLinear(r), toLinear(g), toLinear(b)];
}

/** Linear light (0..1) to an sRGB byte, via a lookup table. */
const LUT_SIZE = 4096;
const SRGB_LUT = (() => {
  const t = new Uint8ClampedArray(LUT_SIZE + 1);
  for (let i = 0; i <= LUT_SIZE; i++) {
    const v = i / LUT_SIZE;
    t[i] = Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055));
  }
  return t;
})();

export function linearToByte(v: number) {
  return SRGB_LUT[v <= 0 ? 0 : v >= 1 ? LUT_SIZE : (v * LUT_SIZE) | 0];
}

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
/** Exponential approach that behaves the same at any frame rate. */
export const approach = (from: number, to: number, rate: number, dt: number) => to + (from - to) * Math.exp(-rate * dt);

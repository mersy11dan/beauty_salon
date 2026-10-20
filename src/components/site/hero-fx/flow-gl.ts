import { PHOTO_H, PHOTO_W } from "./stage";
import { loadImage } from "./util";

/*
  Re-renders a photo with parts of it in motion, from two maps traced off the photo:

  flow  R,G  how far each pixel's content travels per loop: 128 + 4 * px
        B    weight of the rigid transform (a brush that moves as one piece)
  mask  R    how much the pointer can push this pixel around
        G    where the travelling sheen may show

  Travel uses the usual two-phase flow-map loop: two samples half a loop
  apart, each faded out while it resets, with a slow noise offset so the
  whole picture never pulses in step.

  The pointer draws into a small displacement texture that heals over time,
  so moving through the picture leaves a wake rather than a lens.
*/

export type FlowScroll = {
  /** Cylinder centre and radius in photo pixels, and the angle between repeats of its pattern. */
  cx: number;
  radius: number;
  period: number;
  rect: [number, number, number, number];
};

export type FlowConfig = {
  photo: string;
  flow: string;
  mask: string;
  /** Strength of the noise that offsets the loop phase across the picture, 0..1. */
  noise: number;
  scroll?: FlowScroll;
  trail: {
    /** How fast a wake heals, per second. */
    heal: number;
    /** 0 pushes straight out from the pointer, 1 only across the flow (parting strands of hair). */
    across: number;
  };
};

export type FlowFrame = {
  dt?: number;
  /** Loops travelled so far. Integrate speed into this rather than passing time, so speed can change smoothly. */
  phase: number;
  scrollPhase?: number;
  rigid?: { x: number; y: number; angle: number; pivotX: number; pivotY: number };
  /** The pointer's path this frame, in photo pixels. */
  push?: { fromX: number; fromY: number; toX: number; toY: number; radius: number; spread: number; dragX: number; dragY: number };
  sheen?: { x: number; width: number; amount: number };
};

const TRAIL_W = PHOTO_W / 4;
const TRAIL_H = PHOTO_H / 4;
/** Largest wake displacement the 8-bit trail texture stores, in photo pixels. */
const TRAIL_MAX = 28;
/** Seconds a wake can take to heal completely; the trail pass sleeps after that. */
const TRAIL_SETTLE = 3;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/* Drawn upside down relative to vUv, so trail rows line up with photo rows when sampled. */
const TRAIL_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, aPos.y * 0.5 + 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const TRAIL_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform sampler2D uFlow;
uniform vec2 uSize;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uSpread;
uniform vec2 uDrag;
uniform float uKeep;
uniform float uOn;
uniform float uAcross;
uniform float uMax;

void main() {
  vec2 v = (texture2D(uPrev, vUv).rg - 0.5) * 2.0 * uMax;
  float len = length(v);
  // Heal, with a small floor so 8-bit values settle all the way to zero.
  if (len > 0.0) v *= max(len * uKeep - 0.25, 0.0) / len;
  if (uOn > 0.5) {
    vec2 p = vUv * uSize;
    vec2 seg = uTo - uFrom;
    float h = clamp(dot(p - uFrom, seg) / max(dot(seg, seg), 0.0001), 0.0, 1.0);
    vec2 d = p - (uFrom + seg * h);
    float dist = length(d);
    vec2 side = dist > 0.001 ? d / dist : vec2(0.0);
    vec2 fl = texture2D(uFlow, vUv).rg * 255.0 - 128.0;
    float fll = length(fl);
    if (fll > 0.5) {
      vec2 n = vec2(-fl.y, fl.x) / fll;
      side = mix(side, n * dot(side, n), uAcross);
    }
    float x = dist / uRadius;
    float env = exp(-x * x);
    vec2 stamp = side * uSpread * 2.33 * x * env + uDrag * env;
    v = mix(v, stamp, env);
  }
  v = clamp(v, -uMax, uMax);
  gl_FragColor = vec4(v / (2.0 * uMax) + 0.5, 0.5, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPhoto;
uniform sampler2D uFlow;
uniform sampler2D uMask;
uniform sampler2D uTrail;
uniform vec2 uSize;
uniform float uPhase;
uniform float uNoise;
uniform vec3 uRigid;
uniform vec2 uPivot;
uniform float uTrailMax;
uniform vec4 uScroll;
uniform vec4 uScrollRect;
uniform float uScrollPhase;
uniform vec3 uSheen;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec4 photo(vec2 p) { return texture2D(uPhoto, p / uSize); }

void main() {
  vec2 p = vUv * uSize;
  vec4 f = texture2D(uFlow, vUv);
  vec2 flow = (f.rg * 255.0 - 128.0) / 4.0;
  vec4 m = texture2D(uMask, vUv);

  vec2 push = (texture2D(uTrail, vUv).rg - 0.5) * 2.0 * uTrailMax * m.r;

  vec2 q = p - uPivot - uRigid.xy;
  float c = cos(uRigid.z);
  float s = sin(uRigid.z);
  vec2 rigid = vec2(c * q.x + s * q.y, -s * q.x + c * q.y) + uPivot;
  vec2 base = mix(p, rigid, f.b) - push;

  float ph0 = fract(uPhase + vnoise(p / 230.0) * uNoise);
  float ph1 = fract(ph0 + 0.5);
  float w0 = 1.0 - abs(2.0 * ph0 - 1.0);
  vec4 col = photo(base - flow * (ph0 - 0.5)) * w0 + photo(base - flow * (ph1 - 0.5)) * (1.0 - w0);

  if (uScroll.y > 0.0) {
    float band = smoothstep(uScrollRect.y - 2.0, uScrollRect.y + 2.0, p.y)
      * (1.0 - smoothstep(uScrollRect.w - 2.0, uScrollRect.w + 2.0, p.y))
      * step(uScrollRect.x, p.x) * step(p.x, uScrollRect.z);
    if (band > 0.0) {
      // Turn the band on its cylinder. The second sample is one pattern repeat behind,
      // so the repeat lines up exactly and only the irregular bits cross-fade.
      float th = asin(clamp((base.x - uScroll.x) / uScroll.y, -0.999, 0.999));
      float a = th - uScroll.z * uScrollPhase;
      float b = a + uScroll.z;
      float k = uScrollPhase;
      if (a < -1.45) k = 1.0;
      if (b > 1.45) k = 0.0;
      vec4 sa = photo(vec2(uScroll.x + uScroll.y * sin(a), base.y));
      vec4 sb = photo(vec2(uScroll.x + uScroll.y * sin(b), base.y));
      col = mix(col, mix(sa, sb, k), band);
    }
  }

  if (uSheen.z > 0.0) {
    float lum = dot(col.rgb / max(col.a, 0.001), vec3(0.299, 0.587, 0.114));
    float x = (p.x + (p.y - 300.0) * 0.18 - uSheen.x) / uSheen.y;
    float k = exp(-x * x) * uSheen.z * m.g * smoothstep(0.12, 0.65, lum);
    col.rgb += (col.a - col.rgb) * k;
  }

  gl_FragColor = col;
}`;

type Gl = WebGLRenderingContext;
type Uniforms = Record<string, WebGLUniformLocation | null>;

type Trail = {
  program: WebGLProgram;
  u: Uniforms;
  textures: [WebGLTexture, WebGLTexture];
  fbos: [WebGLFramebuffer, WebGLFramebuffer];
  /** Index of the texture holding the latest wake. */
  front: number;
};

type Resources = {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  textures: WebGLTexture[];
  u: Uniforms;
  trail: Trail | null;
};

const MAIN_UNIFORMS = [
  "uPhoto",
  "uFlow",
  "uMask",
  "uTrail",
  "uSize",
  "uPhase",
  "uNoise",
  "uRigid",
  "uPivot",
  "uTrailMax",
  "uScroll",
  "uScrollRect",
  "uScrollPhase",
  "uSheen",
];
const TRAIL_UNIFORMS = ["uPrev", "uFlow", "uSize", "uFrom", "uTo", "uRadius", "uSpread", "uDrag", "uKeep", "uOn", "uAcross", "uMax"];

function compile(gl: Gl, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader failed: ${log}`);
  }
  return shader;
}

function link(gl: Gl, vert: string, frag: string, names: string[]) {
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create program");
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Link failed: ${gl.getProgramInfoLog(program)}`);
  const u: Uniforms = {};
  for (const name of names) u[name] = gl.getUniformLocation(program, name);
  return { program, u };
}

function setFilters(gl: Gl) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function imageTexture(gl: Gl, img: HTMLImageElement, premultiply: boolean) {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Could not create texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
  // Maps hold numbers, not colours: no colour management on the way in.
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, premultiply ? gl.BROWSER_DEFAULT_WEBGL : gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  setFilters(gl);
  return tex;
}

function buildTrail(gl: Gl): Trail | null {
  const { program, u } = link(gl, TRAIL_VERT, TRAIL_FRAG, TRAIL_UNIFORMS);
  const still = new Uint8Array(TRAIL_W * TRAIL_H * 4).fill(128);
  const textures: WebGLTexture[] = [];
  const fbos: WebGLFramebuffer[] = [];
  for (let i = 0; i < 2; i++) {
    const tex = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!tex || !fbo) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TRAIL_W, TRAIL_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, still);
    setFilters(gl);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!ok) return null;
    textures.push(tex);
    fbos.push(fbo);
  }
  gl.useProgram(program);
  gl.uniform1i(u.uPrev, 0);
  gl.uniform1i(u.uFlow, 1);
  gl.uniform2f(u.uSize, PHOTO_W, PHOTO_H);
  gl.uniform1f(u.uMax, TRAIL_MAX);
  return { program, u, textures: [textures[0], textures[1]], fbos: [fbos[0], fbos[1]], front: 0 };
}

export class FlowPhoto {
  private gl: Gl;
  private canvas: HTMLCanvasElement;
  private images: HTMLImageElement[];
  private config: FlowConfig;
  private res: Resources | null = null;
  private lostContext = false;
  private sinceStamp = TRAIL_SETTLE;

  private constructor(canvas: HTMLCanvasElement, gl: Gl, images: HTMLImageElement[], config: FlowConfig) {
    this.canvas = canvas;
    this.gl = gl;
    this.images = images;
    this.config = config;
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
    this.res = this.build();
  }

  /** Resolves to null where WebGL is missing, so the caller keeps the still photo. */
  static async create(canvas: HTMLCanvasElement, config: FlowConfig) {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) return null;
    const images = await Promise.all([loadImage(config.photo), loadImage(config.flow), loadImage(config.mask)]);
    try {
      return new FlowPhoto(canvas, gl, images, config);
    } catch {
      return null;
    }
  }

  get ready() {
    return !this.lostContext && this.res !== null;
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.lostContext = true;
    this.res = null;
  };

  private onRestored = () => {
    this.lostContext = false;
    try {
      this.res = this.build();
    } catch {
      this.res = null;
    }
  };

  private build(): Resources {
    const gl = this.gl;
    const { program, u } = link(gl, VERT, FRAG, MAIN_UNIFORMS);

    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Could not create buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const [photo, flow, mask] = this.images;
    const textures = [imageTexture(gl, photo, true), imageTexture(gl, flow, false), imageTexture(gl, mask, false)];
    const trail = buildTrail(gl);

    gl.useProgram(program);
    gl.uniform1i(u.uPhoto, 0);
    gl.uniform1i(u.uFlow, 1);
    gl.uniform1i(u.uMask, 2);
    gl.uniform1i(u.uTrail, 3);
    gl.uniform2f(u.uSize, PHOTO_W, PHOTO_H);
    gl.uniform1f(u.uNoise, this.config.noise);
    gl.uniform1f(u.uTrailMax, trail ? TRAIL_MAX : 0);
    const sc = this.config.scroll;
    gl.uniform4f(u.uScroll, sc?.cx ?? 0, sc?.radius ?? 0, sc?.period ?? 0, 0);
    gl.uniform4f(u.uScrollRect, ...(sc?.rect ?? ([0, 0, 0, 0] as const)));
    this.sinceStamp = TRAIL_SETTLE;
    return { program, buffer, textures, u, trail };
  }

  private drawTrail(res: Resources, frame: FlowFrame) {
    const trail = res.trail;
    const dt = frame.dt ?? 0;
    const p = frame.push;
    this.sinceStamp = p ? 0 : this.sinceStamp + dt;
    if (!trail || this.sinceStamp >= TRAIL_SETTLE) return;
    const gl = this.gl;
    const u = trail.u;
    const back = 1 - trail.front;
    gl.useProgram(trail.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, trail.fbos[back]);
    gl.viewport(0, 0, TRAIL_W, TRAIL_H);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, trail.textures[trail.front]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, res.textures[1]);
    gl.uniform1f(u.uKeep, Math.exp(-this.config.trail.heal * dt));
    gl.uniform1f(u.uAcross, this.config.trail.across);
    gl.uniform1f(u.uOn, p ? 1 : 0);
    if (p) {
      gl.uniform2f(u.uFrom, p.fromX, p.fromY);
      gl.uniform2f(u.uTo, p.toX, p.toY);
      gl.uniform1f(u.uRadius, p.radius);
      gl.uniform1f(u.uSpread, p.spread);
      gl.uniform2f(u.uDrag, p.dragX, p.dragY);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    trail.front = back;
  }

  render(frame: FlowFrame) {
    const res = this.res;
    if (!res || this.lostContext) return;
    const gl = this.gl;
    // Bind everything each frame: another renderer on this canvas (a cancelled one in dev) may have changed state.
    gl.bindBuffer(gl.ARRAY_BUFFER, res.buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);
    this.drawTrail(res, frame);

    const u = res.u;
    gl.useProgram(res.program);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    res.textures.forEach((t, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
    });
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, res.trail ? res.trail.textures[res.trail.front] : res.textures[1]);
    gl.uniform1f(u.uPhase, frame.phase);
    gl.uniform1f(u.uScrollPhase, (((frame.scrollPhase ?? 0) % 1) + 1) % 1);
    const r = frame.rigid;
    gl.uniform3f(u.uRigid, r?.x ?? 0, r?.y ?? 0, r?.angle ?? 0);
    gl.uniform2f(u.uPivot, r?.pivotX ?? 0, r?.pivotY ?? 0);
    const sh = frame.sheen;
    gl.uniform3f(u.uSheen, sh?.x ?? 0, sh?.width ?? 1, sh?.amount ?? 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    const res = this.res;
    if (res && !this.lostContext) {
      const gl = this.gl;
      res.textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(res.buffer);
      gl.deleteProgram(res.program);
      if (res.trail) {
        res.trail.textures.forEach((t) => gl.deleteTexture(t));
        res.trail.fbos.forEach((f) => gl.deleteFramebuffer(f));
        gl.deleteProgram(res.trail.program);
      }
    }
    this.res = null;
  }
}

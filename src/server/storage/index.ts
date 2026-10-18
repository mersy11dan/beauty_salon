import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../env";

export type StoredFile = { key: string; url: string; width?: number; height?: number };

export type StorageDriver = {
  name: "local" | "cloudinary";
  put(input: { id: string; bytes: Buffer; contentType: string; ext: string }): Promise<StoredFile>;
  remove(key: string): Promise<void>;
};

/** Chosen at runtime, so the build must not try to trace it. */
const uploadsRoot = () => path.resolve(/*turbopackIgnore: true*/ process.cwd(), env().UPLOADS_DIR);

/** Writes to UPLOADS_DIR and serves through /uploads/... Good for development; serverless disks don't persist. */
function localDriver(): StorageDriver {
  const root = uploadsRoot();
  return {
    name: "local",
    async put({ id, bytes, ext }) {
      const now = new Date();
      const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}.${ext}`;
      const file = path.join(/*turbopackIgnore: true*/ root, key);
      await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
      await writeFile(/*turbopackIgnore: true*/ file, bytes);
      return { key, url: `/uploads/${key}` };
    },
    async remove(key) {
      const file = resolveLocalUpload(key);
      if (file) await rm(/*turbopackIgnore: true*/ file, { force: true });
    },
  };
}

/** Absolute path for an /uploads key, or null if it tries to leave the uploads folder. */
export function resolveLocalUpload(key: string) {
  const root = uploadsRoot();
  if (!/^[\w./-]+$/.test(key) || key.split("/").some((s) => s === ".." || s === "." || s === "")) return null;
  const file = path.resolve(/*turbopackIgnore: true*/ root, key);
  return file.startsWith(root + path.sep) ? file : null;
}

export async function readLocalUpload(key: string) {
  const file = resolveLocalUpload(key);
  if (!file) return null;
  try {
    return await readFile(/*turbopackIgnore: true*/ file);
  } catch {
    return null;
  }
}

function parseCloudinaryUrl(raw: string) {
  const u = new URL(raw);
  return { cloud: u.hostname, apiKey: decodeURIComponent(u.username), apiSecret: decodeURIComponent(u.password) };
}

/** Cloudinary's signature: SHA-1 of the sorted params joined with &, followed by the API secret. */
function sign(params: Record<string, string>, secret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(payload + secret).digest("hex");
}

/**
 * Cloudinary free plan: 25 monthly credits (about 25 GB of storage or delivery), served from a CDN.
 * URLs carry f_auto,q_auto so each browser gets WebP/AVIF at a sensible quality.
 */
function cloudinaryDriver(raw: string): StorageDriver {
  const { cloud, apiKey, apiSecret } = parseCloudinaryUrl(raw);
  const folder = env().CLOUDINARY_FOLDER;
  const api = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image`;

  async function call(endpoint: "upload" | "destroy", params: Record<string, string>, file?: Blob) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signed = { ...params, timestamp };
    const form = new FormData();
    for (const [k, v] of Object.entries(signed)) form.set(k, v);
    form.set("api_key", apiKey);
    form.set("signature", sign(signed, apiSecret));
    if (file) form.set("file", file);
    const res = await fetch(`${api}/${endpoint}`, { method: "POST", body: form, signal: AbortSignal.timeout(30_000) });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string } };
    if (!res.ok) throw new Error(`Cloudinary ${endpoint} failed (${res.status}): ${json.error?.message ?? "unknown error"}`);
    return json;
  }

  return {
    name: "cloudinary",
    async put({ id, bytes, contentType }) {
      const json = await call("upload", { folder, public_id: id, overwrite: "false" }, new Blob([new Uint8Array(bytes)], { type: contentType }));
      const secureUrl = String(json.secure_url);
      return {
        key: String(json.public_id),
        url: secureUrl.replace("/image/upload/", "/image/upload/f_auto,q_auto,c_limit,w_2400/"),
        width: Number(json.width) || undefined,
        height: Number(json.height) || undefined,
      };
    },
    async remove(key) {
      await call("destroy", { public_id: key, invalidate: "true" });
    },
  };
}

let driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (driver) return driver;
  const url = env().CLOUDINARY_URL;
  driver = url ? cloudinaryDriver(url) : localDriver();
  if (!url && process.env.NODE_ENV === "production") {
    console.warn("[storage] CLOUDINARY_URL is not set; photos are saved to the local disk, which most hosts wipe on deploy.");
  }
  return driver;
}

export function storageFor(name: string): StorageDriver | null {
  const current = storage();
  if (current.name === name) return current;
  return name === "local" ? localDriver() : null;
}

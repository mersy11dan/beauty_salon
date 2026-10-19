"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const MAX_EDGE = 2400;
const QUALITY = 0.86;

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Downsizes on a canvas and re-encodes as WebP (JPEG or PNG where WebP encoding isn't supported).
 * Re-encoding also drops EXIF data, so a phone photo never publishes where it was taken.
 */
async function prepare(file: File, maxEdge = MAX_EDGE): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const webp = await toBlob(canvas, "image/webp");
  if (webp?.type === "image/webp") return webp;
  const keepAlpha = file.type === "image/png" || file.type === "image/gif" || file.type === "image/webp";
  const fallback = await toBlob(canvas, keepAlpha ? "image/png" : "image/jpeg");
  if (!fallback) throw new Error("Could not encode image");
  return fallback;
}

/** Sends a photo to /api/uploads and returns its public URL. Throws a readable message on failure. */
export async function uploadPhoto(blob: Blob): Promise<string> {
  const form = new FormData();
  form.set("file", blob, `photo.${blob.type.split("/")[1] ?? "img"}`);
  let res: Response;
  try {
    res = await fetch("/api/uploads", { method: "POST", body: form });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "The photo couldn't be saved. Try again.");
  return json.url;
}

export function ImageInput({
  id,
  value,
  onChange,
  onBusyChange,
  aspect = "aspect-[4/3]",
  maxSize,
}: {
  id?: string;
  value: string | null;
  onChange: (next: string | null) => void;
  /** True while a photo is uploading, so the surrounding form can hold its Save button. */
  onBusyChange?: (busy: boolean) => void;
  aspect?: string;
  /** Longest edge in pixels after resizing. */
  maxSize?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      let blob: Blob;
      try {
        blob = await prepare(file, maxSize);
      } catch {
        throw new Error("That file could not be read. Try a JPG or PNG.");
      }
      onChange(await uploadPhoto(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The photo couldn't be saved. Try again.");
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className={`relative w-28 shrink-0 overflow-hidden rounded-md bg-ops-bg ${aspect}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value && <img src={value} alt="" className="h-full w-full object-cover" />}
        {busy && <span aria-hidden className="absolute inset-0 animate-pulse bg-ops-surface/60" />}
      </div>
      <div className="flex flex-col gap-2">
        <input
          id={id}
          ref={ref}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
        <p role={error ? "alert" : undefined} className={`text-[12.5px] ${error ? "text-[#9b2c2c]" : "text-ops-muted"}`}>
          {error || "JPG, PNG or WebP. Resized automatically."}
        </p>
      </div>
    </div>
  );
}

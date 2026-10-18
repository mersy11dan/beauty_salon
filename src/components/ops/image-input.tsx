"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDataMode } from "@/lib/store";
import { uploadImage } from "@/server/actions";

const MAX_EDGE = 1600;
/** Keeps each image well under the database's per-request limit and the browser's storage quota. */
const MAX_CHARS = 900_000;

/** Reads a file and downsizes it on a canvas until the JPEG/PNG/WebP data URL fits in MAX_CHARS. */
async function fileToDataUrl(file: File, maxEdge = MAX_EDGE): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const keepAlpha = file.type === "image/png" || file.type === "image/svg+xml" || file.type === "image/webp";
  const formats: [string, number?][] = keepAlpha ? [["image/png"], ["image/webp", 0.9]] : [["image/jpeg", 0.86]];
  let edge = Math.min(maxEdge, Math.max(bitmap.width, bitmap.height));
  for (;;) {
    const scale = edge / Math.max(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let url = "";
    for (const [type, quality] of formats) {
      url = canvas.toDataURL(type, quality);
      if (url.length <= MAX_CHARS) return url;
    }
    if (edge <= 320) return url;
    edge = Math.round(edge * 0.75);
  }
}

export function ImageInput({
  id,
  value,
  onChange,
  aspect = "aspect-[4/3]",
  maxSize,
}: {
  id?: string;
  value: string | null;
  onChange: (next: string | null) => void;
  aspect?: string;
  /** Longest edge in pixels after resizing. */
  maxSize?: number;
}) {
  const mode = useDataMode();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    let dataUrl: string;
    try {
      dataUrl = await fileToDataUrl(file, maxSize);
    } catch {
      setError("That file could not be read. Try a JPG or PNG.");
      setBusy(false);
      return;
    }
    if (mode !== "live") {
      onChange(dataUrl);
      setBusy(false);
      return;
    }
    try {
      const r = await uploadImage(dataUrl);
      if (r.ok) onChange(r.url);
      else setError(r.error);
    } catch {
      setError("The upload did not finish. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className={`w-28 shrink-0 overflow-hidden rounded-md bg-ops-bg ${aspect}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value && <img src={value} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex flex-col gap-2">
        <input
          id={id}
          ref={ref}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? (mode === "live" ? "Uploading…" : "Reading…") : value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
        <p role={error ? "alert" : undefined} className={error ? "text-[12.5px] text-[#9b2c2c]" : "text-[12.5px] text-ops-muted"}>
          {error || "JPG or PNG. Resized automatically."}
        </p>
      </div>
    </div>
  );
}

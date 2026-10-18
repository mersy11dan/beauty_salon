"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const MAX_EDGE = 1600;

/** Reads a file, downsizes it on a canvas, and returns a JPEG/PNG data URL small enough for localStorage. */
async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const keepAlpha = file.type === "image/png" || file.type === "image/svg+xml";
  return canvas.toDataURL(keepAlpha ? "image/png" : "image/jpeg", 0.86);
}

export function ImageInput({
  id,
  value,
  onChange,
  aspect = "aspect-[4/3]",
}: {
  id?: string;
  value: string | null;
  onChange: (next: string | null) => void;
  aspect?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await fileToDataUrl(file));
    } catch {
      setError("That file could not be read. Try a JPG or PNG.");
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
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? "Reading…" : value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
        <p className="text-[12.5px] text-ops-muted">{error || "JPG or PNG. Resized automatically."}</p>
      </div>
    </div>
  );
}

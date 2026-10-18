import type { CSSProperties } from "react";
import type { Theme } from "@/lib/types";

/** Relative luminance (sRGB) for a #rrggbb colour. */
export function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const chan = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(n >> 16) + 0.7152 * chan((n >> 8) & 255) + 0.0722 * chan(n & 255);
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Picks white or the ink colour for text on the accent, whichever reads better. */
export function accentInk(theme: Theme) {
  return contrastRatio(theme.accent, "#ffffff") >= contrastRatio(theme.accent, theme.ink)
    ? "#ffffff"
    : theme.ink;
}

export function themeStyle(theme: Theme): CSSProperties {
  return {
    "--bg": theme.background,
    "--ink": theme.ink,
    "--accent": theme.accent,
    "--surface": theme.surface,
    "--accent-ink": accentInk(theme),
  } as CSSProperties;
}

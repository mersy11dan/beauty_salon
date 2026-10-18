import type { CSSProperties } from "react";
import { resolveFonts } from "@/lib/fonts";
import type { FontChoice, Theme } from "@/lib/types";

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

/**
 * Text colour for buttons on the accent: white, the ink or the page colour,
 * whichever reads best. Hot pink needs black text; deep plum needs white.
 */
export function accentInk(theme: Theme) {
  const candidates = ["#FFFFFF", theme.ink, theme.background];
  return candidates.reduce((best, c) => (contrastRatio(theme.accent, c) > contrastRatio(theme.accent, best) ? c : best));
}

export const isDarkTheme = (theme: Theme) => luminance(theme.background) < 0.2;

export function themeStyle(theme: Theme, fonts?: FontChoice): CSSProperties {
  const f = resolveFonts(fonts);
  return {
    "--bg": theme.background,
    "--ink": theme.ink,
    "--accent": theme.accent,
    "--surface": theme.surface,
    "--accent-ink": accentInk(theme),
    "--site-display": f.display.stack,
    "--site-script": f.script.stack,
    "--site-body": f.body.stack,
    "--display-scale": String(f.display.scale ?? 1),
    "--script-scale": String(f.script.scale ?? 1),
    colorScheme: isDarkTheme(theme) ? "dark" : "light",
    fontFamily: "var(--site-body)",
    fontFeatureSettings: f.body.features ?? "normal",
  } as CSSProperties;
}

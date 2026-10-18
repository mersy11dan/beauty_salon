import type { FontChoice } from "./types";

/**
 * Client-safe font catalog. The faces themselves are declared with next/font in
 * `app/fonts.ts`, which puts a `--font-<id>` variable on <html> for each one.
 */
export type FontOption = {
  id: string;
  name: string;
  note: string;
  stack: string;
  /** Multiplier on the role's type scale, so a wide or large face sits at the same visual size. */
  scale?: number;
  features?: string;
};

export const DISPLAY_FONTS: FontOption[] = [
  { id: "bodoni", name: "Bodoni Moda", note: "High-fashion serif", stack: 'var(--font-bodoni), "Bodoni Moda", Didot, serif' },
  { id: "playfair", name: "Playfair Display", note: "Classic editorial", stack: 'var(--font-playfair), "Playfair Display", Georgia, serif' },
  { id: "cormorant", name: "Cormorant Garamond", note: "Romantic and light", stack: 'var(--font-cormorant), "Cormorant Garamond", Garamond, serif', scale: 1.08 },
  { id: "dmserif", name: "DM Serif Display", note: "Bold glam", stack: 'var(--font-dmserif), "DM Serif Display", Georgia, serif', scale: 0.95 },
  { id: "italiana", name: "Italiana", note: "Thin and airy", stack: 'var(--font-italiana), Italiana, Didot, serif' },
  { id: "cinzel", name: "Cinzel", note: "Luxury capitals", stack: 'var(--font-cinzel), Cinzel, "Trajan Pro", serif', scale: 0.84 },
  { id: "marcellus", name: "Marcellus", note: "Calm classical", stack: 'var(--font-marcellus), Marcellus, Georgia, serif', scale: 0.94 },
  { id: "prata", name: "Prata", note: "Refined", stack: 'var(--font-prata), Prata, Georgia, serif', scale: 0.92 },
  { id: "fraunces", name: "Fraunces", note: "Soft and warm", stack: 'var(--font-fraunces), Fraunces, Georgia, serif', scale: 0.96 },
  { id: "yeseva", name: "Yeseva One", note: "Bold and feminine", stack: 'var(--font-yeseva), "Yeseva One", Georgia, serif', scale: 0.9 },
  { id: "gilda", name: "Gilda Display", note: "Delicate", stack: 'var(--font-gilda), "Gilda Display", Georgia, serif' },
  { id: "poiret", name: "Poiret One", note: "Art deco", stack: 'var(--font-poiret), "Poiret One", system-ui, sans-serif' },
  { id: "josefin", name: "Josefin Sans", note: "Modern geometric", stack: 'var(--font-josefin), "Josefin Sans", system-ui, sans-serif', scale: 0.94 },
];

export const SCRIPT_AS_HEADING = "heading";

export const SCRIPT_FONTS: FontOption[] = [
  { id: "pinyon", name: "Pinyon Script", note: "Copperplate", stack: 'var(--font-pinyon), "Pinyon Script", "Edwardian Script ITC", cursive' },
  { id: "greatvibes", name: "Great Vibes", note: "Flowing and romantic", stack: 'var(--font-greatvibes), "Great Vibes", cursive', scale: 0.95 },
  { id: "parisienne", name: "Parisienne", note: "French boutique", stack: 'var(--font-parisienne), Parisienne, cursive', scale: 0.86 },
  { id: "allura", name: "Allura", note: "Wedding invitation", stack: 'var(--font-allura), Allura, cursive' },
  { id: "alexbrush", name: "Alex Brush", note: "Brush calligraphy", stack: 'var(--font-alexbrush), "Alex Brush", cursive', scale: 0.92 },
  { id: "italianno", name: "Italianno", note: "Tall and slender", stack: 'var(--font-italianno), Italianno, cursive', scale: 1.1 },
  { id: "monsieur", name: "Monsieur La Doulaise", note: "Ornate flourish", stack: 'var(--font-monsieur), "Monsieur La Doulaise", cursive', scale: 1.04 },
  { id: "mrssaint", name: "Mrs Saint Delafield", note: "Signature", stack: 'var(--font-mrssaint), "Mrs Saint Delafield", cursive', scale: 1.04 },
  { id: "sacramento", name: "Sacramento", note: "Thin monoline", stack: 'var(--font-sacramento), Sacramento, cursive', scale: 1.04 },
  { id: "dancing", name: "Dancing Script", note: "Casual and friendly", stack: 'var(--font-dancing), "Dancing Script", cursive', scale: 0.76 },
  { id: "satisfy", name: "Satisfy", note: "Retro sign", stack: 'var(--font-satisfy), Satisfy, cursive', scale: 0.78 },
  { id: "pacifico", name: "Pacifico", note: "Bubbly and bold", stack: 'var(--font-pacifico), Pacifico, cursive', scale: 0.62 },
  { id: SCRIPT_AS_HEADING, name: "No script", note: "Use the heading font instead", stack: "var(--site-display)", scale: 0.6 },
];

export const BODY_FONTS: FontOption[] = [
  { id: "manrope", name: "Manrope", note: "Clean, slightly round", stack: 'var(--font-manrope), Manrope, system-ui, sans-serif', features: '"ss01", "cv11"' },
  { id: "inter", name: "Inter", note: "Neutral and very readable", stack: 'var(--font-inter), Inter, system-ui, sans-serif' },
  { id: "dmsans", name: "DM Sans", note: "Friendly geometric", stack: 'var(--font-dmsans), "DM Sans", system-ui, sans-serif' },
  { id: "jost", name: "Jost", note: "Fashion geometric", stack: 'var(--font-jost), Jost, system-ui, sans-serif' },
  { id: "montserrat", name: "Montserrat", note: "Wide and modern", stack: 'var(--font-montserrat), Montserrat, system-ui, sans-serif' },
  { id: "poppins", name: "Poppins", note: "Round and confident", stack: 'var(--font-poppins), Poppins, system-ui, sans-serif' },
  { id: "raleway", name: "Raleway", note: "Elegant and thin", stack: 'var(--font-raleway), Raleway, system-ui, sans-serif' },
  { id: "lato", name: "Lato", note: "Warm classic", stack: 'var(--font-lato), Lato, system-ui, sans-serif' },
  { id: "nunito", name: "Nunito", note: "Soft and rounded", stack: 'var(--font-nunito), Nunito, system-ui, sans-serif' },
  { id: "quicksand", name: "Quicksand", note: "Light and girly", stack: 'var(--font-quicksand), Quicksand, system-ui, sans-serif' },
  { id: "karla", name: "Karla", note: "Quirky grotesque", stack: 'var(--font-karla), Karla, system-ui, sans-serif' },
  { id: "outfit", name: "Outfit", note: "Crisp studio sans", stack: 'var(--font-outfit), Outfit, system-ui, sans-serif' },
  { id: "lora", name: "Lora", note: "Bookish serif", stack: 'var(--font-lora), Lora, Georgia, serif' },
];

export const DEFAULT_FONTS: FontChoice = { display: "bodoni", script: "pinyon", body: "manrope" };

export const FONT_PAIRINGS: { id: string; name: string; note: string; fonts: FontChoice }[] = [
  { id: "couture", name: "Couture", note: "High-fashion serif with copperplate script", fonts: DEFAULT_FONTS },
  { id: "romance", name: "Romance", note: "Soft and bridal", fonts: { display: "cormorant", script: "greatvibes", body: "jost" } },
  { id: "editorial", name: "Editorial", note: "Magazine classic", fonts: { display: "playfair", script: "allura", body: "inter" } },
  { id: "glam", name: "Glam", note: "Bold makeup and lashes", fonts: { display: "dmserif", script: "parisienne", body: "poppins" } },
  { id: "sweet", name: "Sweet", note: "Friendly and girly", fonts: { display: "fraunces", script: "dancing", body: "quicksand" } },
  { id: "luxe", name: "Luxe", note: "Gold-leaf luxury", fonts: { display: "cinzel", script: "monsieur", body: "raleway" } },
  { id: "airy", name: "Airy", note: "Thin, light and modern", fonts: { display: "italiana", script: "sacramento", body: "montserrat" } },
  { id: "bubbly", name: "Bubbly", note: "Playful nail bar", fonts: { display: "yeseva", script: "pacifico", body: "nunito" } },
  { id: "timeless", name: "Timeless", note: "Traditional salon", fonts: { display: "prata", script: "alexbrush", body: "lato" } },
  { id: "deco", name: "Deco", note: "1920s glamour", fonts: { display: "poiret", script: "italianno", body: "karla" } },
  { id: "spa", name: "Spa", note: "Calm and natural", fonts: { display: "marcellus", script: "satisfy", body: "dmsans" } },
  { id: "boutique", name: "Boutique", note: "Brow and lash studio", fonts: { display: "gilda", script: "mrssaint", body: "jost" } },
  { id: "studio", name: "Studio", note: "No script, clean hair studio", fonts: { display: "josefin", script: SCRIPT_AS_HEADING, body: "outfit" } },
];

const find = (list: FontOption[], id: string) => list.find((f) => f.id === id) ?? list[0];

export function resolveFonts(choice: FontChoice | undefined) {
  const c = choice ?? DEFAULT_FONTS;
  const display = find(DISPLAY_FONTS, c.display);
  const script = find(SCRIPT_FONTS, c.script);
  const body = find(BODY_FONTS, c.body);
  return { display, script, body };
}

export function sameFonts(a: FontChoice, b: FontChoice) {
  return a.display === b.display && a.script === b.script && a.body === b.body;
}

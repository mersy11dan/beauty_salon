import type { Theme } from "./types";

export type PaletteMood = "pink-black" | "girly" | "elegant" | "dark" | "natural" | "bold";

export type Palette = { id: string; name: string; mood: PaletteMood; theme: Theme };

export const PALETTE_MOODS: { id: PaletteMood; label: string; description: string }[] = [
  { id: "pink-black", label: "Pink and black", description: "Fashion-forward. Nail bars, lash studios, makeup artists." },
  { id: "girly", label: "Girly and sweet", description: "Soft pinks, peach and lilac. Friendly and feminine." },
  { id: "elegant", label: "Mature and elegant", description: "Quiet neutrals and deep wine. Bridal, skin and colour salons." },
  { id: "dark", label: "Dark and luxe", description: "Evening glamour with gold, rose and plum accents." },
  { id: "natural", label: "Natural and calm", description: "Sage, clay and sand. Spa, organic hair and wellness." },
  { id: "bold", label: "Bold and modern", description: "Strong single colours for hair studios and barbers." },
];

const p = (id: string, name: string, mood: PaletteMood, background: string, ink: string, accent: string, surface: string): Palette => ({
  id,
  name,
  mood,
  theme: { background, ink, accent, surface },
});

/** Every entry passes 4.5:1 for body text and button text, and 3:1 for accent on background. */
export const PALETTES: Palette[] = [
  p("noir-rose", "Noir Rose", "pink-black", "#0F0F10", "#FFE3EF", "#FF4FA3", "#1C1A1E"),
  p("fuchsia-night", "Fuchsia Night", "pink-black", "#0B0A0C", "#FFFFFF", "#FF2E93", "#18151A"),
  p("midnight-blush", "Midnight Blush", "pink-black", "#141014", "#F6E9EE", "#F2A7C3", "#201A1F"),
  p("velvet-rose", "Velvet Rose", "pink-black", "#1A0E14", "#FBEAF0", "#FF6FAE", "#26161E"),
  p("hot-pink-couture", "Hot Pink Couture", "pink-black", "#FFF7FA", "#0F0F10", "#C2136F", "#FFFFFF"),
  p("bubblegum-black", "Bubblegum and Black", "pink-black", "#FFD6E8", "#121212", "#121212", "#FFEFF6"),
  p("blush-black", "Blush and Black", "pink-black", "#FBEEEC", "#111111", "#111111", "#FFFFFF"),
  p("pink-onyx", "Pink Onyx", "pink-black", "#F9E4EA", "#141014", "#B3105E", "#FFF6F8"),

  p("ballet-slipper", "Ballet Slipper", "girly", "#FBEFF1", "#3A2A30", "#B24A6E", "#FFFFFF"),
  p("cotton-candy", "Cotton Candy", "girly", "#FFF0F6", "#3B1F2B", "#C42E6F", "#FFFFFF"),
  p("strawberry-milk", "Strawberry Milk", "girly", "#FFF1F1", "#3A1F24", "#C23A52", "#FFFFFF"),
  p("barbie", "Doll House", "girly", "#FFE6F2", "#2B0F1E", "#C0136F", "#FFF5FA"),
  p("peony", "Peony", "girly", "#FDF0F3", "#321C24", "#BE3A64", "#FFFFFF"),
  p("rose-quartz", "Rose Quartz", "girly", "#F7E9EA", "#3B2B2E", "#9A4A57", "#FFFAFA"),
  p("peach-blossom", "Peach Blossom", "girly", "#FFF4EE", "#3D2620", "#B34A33", "#FFFFFF"),
  p("lilac-dream", "Lilac Dream", "girly", "#F6F0FB", "#2E2338", "#7A4CB3", "#FFFFFF"),
  p("sugar-plum", "Sugar Plum", "girly", "#FAF0F7", "#331A2C", "#952C74", "#FFFFFF"),

  p("porcelain", "Porcelain", "elegant", "#F5F1F2", "#1E181C", "#6E2B3F", "#FFFFFF"),
  p("linen", "Linen", "elegant", "#F4EFE6", "#262119", "#7A5A2E", "#FFFDF8"),
  p("champagne", "Champagne", "elegant", "#F7F1E8", "#2B2620", "#7E5E35", "#FFFDF9"),
  p("mocha-mousse", "Mocha Mousse", "elegant", "#F3ECE6", "#2C211C", "#7E5442", "#FFFBF8"),
  p("burgundy-velvet", "Burgundy Velvet", "elegant", "#F6EFEF", "#241519", "#7B1E3A", "#FFFFFF"),
  p("dusty-mauve", "Dusty Mauve", "elegant", "#F4EEF0", "#2D2428", "#74505F", "#FFFFFF"),
  p("plum-silk", "Plum Silk", "elegant", "#F5EFF4", "#26182A", "#5E2A5E", "#FFFFFF"),
  p("taupe-gold", "Taupe and Gold", "elegant", "#EFEAE4", "#2A2622", "#80653E", "#F9F6F2"),
  p("ivory-ink", "Ivory and Ink", "elegant", "#FAF8F3", "#141414", "#141414", "#FFFFFF"),
  p("greige", "Greige", "elegant", "#ECEAE6", "#22211F", "#57524C", "#F7F6F3"),

  p("ink", "Ink", "dark", "#17161A", "#F4F1F3", "#D9A3B0", "#221F26"),
  p("onyx-gold", "Onyx and Gold", "dark", "#0F0E0C", "#F3EDE2", "#C9A45C", "#1A1815"),
  p("emerald-night", "Emerald Night", "dark", "#0E1915", "#EEF3EF", "#C8A96A", "#16241F"),
  p("plum-noir", "Plum Noir", "dark", "#1A1220", "#F3ECF6", "#D8A7E0", "#251B2C"),
  p("espresso", "Espresso", "dark", "#1C1512", "#F2E9E1", "#D4A373", "#271E1A"),
  p("velvet-wine", "Velvet Wine", "dark", "#1D0F14", "#F6E9EE", "#E3A1B5", "#2A161E"),
  p("midnight-rose-gold", "Midnight Rose Gold", "dark", "#0F1424", "#EEF1F8", "#E5B8A0", "#18203A"),

  p("sage", "Sage", "natural", "#EEF1EC", "#1B211C", "#3F5E4A", "#FFFFFF"),
  p("eucalyptus", "Eucalyptus", "natural", "#EDF2EF", "#1D2622", "#40604F", "#FFFFFF"),
  p("seafoam-spa", "Seafoam Spa", "natural", "#EEF5F4", "#1A2827", "#2B6762", "#FFFFFF"),
  p("terracotta", "Terracotta", "natural", "#F7EFE8", "#2E211B", "#9C4826", "#FFFBF7"),
  p("clay-cream", "Clay and Cream", "natural", "#F5EEE8", "#2F2420", "#8F513C", "#FFFFFF"),
  p("sand-dune", "Sand Dune", "natural", "#F4EDE3", "#2A251F", "#7E5F42", "#FFFCF7"),
  p("olive-grove", "Olive Grove", "natural", "#F1F0E8", "#23251C", "#55613A", "#FFFFFF"),

  p("cherry-red", "Cherry Red", "bold", "#FFF6F4", "#1A1112", "#B80F2A", "#FFFFFF"),
  p("coral-pop", "Coral Pop", "bold", "#FFF4F0", "#2A1712", "#C13E18", "#FFFFFF"),
  p("tangerine", "Tangerine", "bold", "#FFF7EE", "#261A10", "#AD4D0B", "#FFFFFF"),
  p("copper-charcoal", "Copper and Charcoal", "bold", "#F2F0EE", "#1F1D1C", "#97492A", "#FFFFFF"),
  p("cobalt-studio", "Cobalt Studio", "bold", "#F3F5FB", "#12162A", "#2742C8", "#FFFFFF"),
  p("electric-violet", "Electric Violet", "bold", "#F6F3FF", "#1C1530", "#6234D0", "#FFFFFF"),
  p("platinum", "Platinum", "bold", "#F2F2F0", "#1B1B1D", "#4B4E57", "#FFFFFF"),
];

export const DEFAULT_THEME: Theme = PALETTES.find((x) => x.id === "porcelain")!.theme;

const norm = (t: Theme) => [t.background, t.ink, t.accent, t.surface].map((c) => c.toLowerCase()).join();

export function matchPalette(theme: Theme) {
  const key = norm(theme);
  return PALETTES.find((x) => norm(x.theme) === key) ?? null;
}

"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { useState } from "react";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { SitePreview } from "@/components/ops/site-preview";
import { accentInk, contrastRatio, themeStyle } from "@/components/site/theme-vars";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import {
  BODY_FONTS,
  DEFAULT_FONTS,
  DISPLAY_FONTS,
  FONT_PAIRINGS,
  resolveFonts,
  sameFonts,
  SCRIPT_FONTS,
  type FontOption,
} from "@/lib/fonts";
import { DEFAULT_THEME, matchPalette, PALETTE_MOODS, PALETTES, type Palette, type PaletteMood } from "@/lib/palettes";
import { useSalonStore } from "@/lib/store";
import type { FontChoice, Theme } from "@/lib/types";

export default function LookPage() {
  const settings = useSalonStore((s) => s.settings);
  const setTheme = useSalonStore((s) => s.setTheme);
  const update = useSalonStore((s) => s.updateSettings);
  const [mood, setMood] = useState<PaletteMood | "all">("all");
  const t = settings.theme;
  const current = matchPalette(t);
  const setFonts = (patch: Partial<FontChoice>) => update({ fonts: { ...settings.fonts, ...patch } });

  const moods = PALETTE_MOODS.filter((m) => mood === "all" || m.id === mood);

  return (
    <>
      <OpsTitle
        title="Colours and fonts"
        intro="Pick a ready-made look, then fine-tune it. The preview on the right is the client's homepage; the live site changes as you click."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-ops-ink">Colour palettes</h2>
              <p className="text-[13px] text-ops-muted">
                {current ? (
                  <>
                    Using <span className="font-medium text-ops-ink">{current.name}</span>
                  </>
                ) : (
                  "Using your own colours"
                )}
              </p>
            </div>
            <div role="group" aria-label="Filter palettes by mood" className="mb-5 flex flex-wrap gap-1.5">
              <Chip on={mood === "all"} onClick={() => setMood("all")}>
                All {PALETTES.length}
              </Chip>
              {PALETTE_MOODS.map((m) => (
                <Chip key={m.id} on={mood === m.id} onClick={() => setMood(m.id)}>
                  {m.label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-col gap-7">
              {moods.map((m) => (
                <section key={m.id} aria-labelledby={`mood-${m.id}`}>
                  <h3 id={`mood-${m.id}`} className="text-[13.5px] font-semibold text-ops-ink">
                    {m.label}
                  </h3>
                  <p className="mb-3 text-[13px] text-ops-muted">{m.description}</p>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {PALETTES.filter((x) => x.mood === m.id).map((x) => (
                      <li key={x.id}>
                        <PaletteCard palette={x} on={current?.id === x.id} onPick={() => setTheme(x.theme)} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Fine-tune the colours</h2>
            <p className="mb-4 text-[13.5px] text-ops-muted">
              Four colours drive the whole site; everything else is mixed from them. Match the client&apos;s logo or shopfront here.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="Background" value={t.background} onChange={(v) => setTheme({ background: v })} />
              <ColorField label="Text" value={t.ink} onChange={(v) => setTheme({ ink: v })} />
              <ColorField label="Accent" value={t.accent} onChange={(v) => setTheme({ accent: v })} hint="Buttons, the active label, stars." />
              <ColorField label="Panels" value={t.surface} onChange={(v) => setTheme({ surface: v })} hint="Sticky menu bar, forms, booking summary." />
            </div>
            <ContrastList theme={t} />
            <Button size="sm" variant="secondary" className="mt-4" onClick={() => setTheme(DEFAULT_THEME)}>
              Back to the default colours
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Font pairings</h2>
            <p className="mb-4 text-[13.5px] text-ops-muted">
              Each pairing sets a heading font, a script font for the big flowing titles, and a font for everything else.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {FONT_PAIRINGS.map((p) => (
                <li key={p.id}>
                  <PairingCard
                    name={p.name}
                    note={p.note}
                    fonts={p.fonts}
                    theme={t}
                    on={sameFonts(p.fonts, settings.fonts)}
                    onPick={() => update({ fonts: { ...p.fonts } })}
                  />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Mix your own fonts</h2>
            <p className="mb-4 text-[13.5px] text-ops-muted">Choose each role on its own. The line under each menu is set in that font.</p>
            <div className="grid gap-5 md:grid-cols-3">
              <FontSelect
                id="font-display"
                label="Headings"
                options={DISPLAY_FONTS}
                value={settings.fonts.display}
                onChange={(v) => setFonts({ display: v })}
                sample="Hair, nails and makeup"
                sampleClass="font-display text-[length:calc(1.35rem*var(--display-scale))] leading-[1.15]"
              />
              <FontSelect
                id="font-script"
                label="Script titles"
                options={SCRIPT_FONTS}
                value={settings.fonts.script}
                onChange={(v) => setFonts({ script: v })}
                sample="Recent work"
                sampleClass="font-script text-[length:calc(2rem*var(--script-scale))] leading-[1.15]"
              />
              <FontSelect
                id="font-body"
                label="Everything else"
                options={BODY_FONTS}
                value={settings.fonts.body}
                onChange={(v) => setFonts({ body: v })}
                sample="Book online in about a minute. Pay at the desk."
                sampleClass="text-[14px] leading-[1.5]"
              />
            </div>
            <Button size="sm" variant="secondary" className="mt-5" onClick={() => update({ fonts: { ...DEFAULT_FONTS } })}>
              Back to the default fonts
            </Button>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-ops-muted">Preview</p>
          <SitePreview settings={settings} />
        </aside>
      </div>
    </>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={clsx(
        "rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-200",
        on ? "border-ops-accent bg-ops-accent text-white" : "border-ops-line text-ops-ink hover:border-ops-accent",
      )}
    >
      {children}
    </button>
  );
}

function PaletteCard({ palette, on, onPick }: { palette: Palette; on: boolean; onPick: () => void }) {
  const t = palette.theme;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={clsx(
        "group block w-full overflow-hidden rounded-lg border text-left transition-[border-color,box-shadow] duration-200",
        on ? "border-ops-accent shadow-[0_0_0_1px_var(--ops-accent)]" : "border-ops-line hover:border-ops-muted",
      )}
    >
      <span className="relative block h-20 p-3" style={{ background: t.background, color: t.ink }}>
        <span className="font-display block text-[1.35rem] leading-none">Aa</span>
        <span className="mt-1.5 block h-1 w-12 rounded-full opacity-40" style={{ background: t.ink }} />
        <span className="absolute bottom-3 left-3 h-4 w-9 rounded" style={{ background: t.surface, boxShadow: `0 0 0 1px ${t.ink}1a` }} />
        <span
          className="absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-[10.5px] font-medium"
          style={{ background: t.accent, color: accentInk(t) }}
        >
          Book
        </span>
        {on && (
          <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-ops-accent text-white">
            <Check size={12} strokeWidth={2.5} aria-hidden />
          </span>
        )}
      </span>
      <span className="block truncate border-t border-ops-line bg-ops-surface px-3 py-2 text-[13px] text-ops-ink">{palette.name}</span>
    </button>
  );
}

function PairingCard({
  name,
  note,
  fonts,
  theme,
  on,
  onPick,
}: {
  name: string;
  note: string;
  fonts: FontChoice;
  theme: Theme;
  on: boolean;
  onPick: () => void;
}) {
  const f = resolveFonts(fonts);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={clsx(
        "block w-full overflow-hidden rounded-lg border text-left transition-[border-color,box-shadow] duration-200",
        on ? "border-ops-accent shadow-[0_0_0_1px_var(--ops-accent)]" : "border-ops-line hover:border-ops-muted",
      )}
    >
      <span style={themeStyle(theme, fonts)} className="block bg-bg px-4 pb-4 pt-3 text-ink">
        <span className="font-script block truncate text-[length:calc(2rem*var(--script-scale))] leading-[1.2]">Beauty</span>
        <span className="font-display block text-[length:calc(1.15rem*var(--display-scale))] leading-[1.2]">Hair and nails</span>
        <span className="mt-1 block text-[12.5px] text-muted">Book online in a minute.</span>
      </span>
      <span className="flex items-center justify-between gap-2 border-t border-ops-line bg-ops-surface px-3 py-2">
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-ops-ink">{name}</span>
          <span className="block truncate text-[12px] text-ops-muted">
            {note} · {f.display.name}, {f.script.id === "heading" ? "no script" : f.script.name}, {f.body.name}
          </span>
        </span>
        {on && <Check size={15} strokeWidth={2.25} className="shrink-0 text-ops-ink" aria-label="In use" />}
      </span>
    </button>
  );
}

function FontSelect({
  id,
  label,
  options,
  value,
  onChange,
  sample,
  sampleClass,
}: {
  id: string;
  label: string;
  options: FontOption[];
  value: string;
  onChange: (v: string) => void;
  sample: string;
  sampleClass: string;
}) {
  const settings = useSalonStore((s) => s.settings);
  const current = options.find((o) => o.id === value) ?? options[0];
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Field label={label} htmlFor={id} hint={current.note}>
        <Select id={id} value={current.id} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </Field>
      <div style={themeStyle(settings.theme, settings.fonts)} className="rounded-lg border border-ops-line bg-bg px-3 py-3 text-ink">
        <p className={sampleClass}>{sample}</p>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const id = `color-${label}`;
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-ops-line bg-transparent p-1"
        />
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-[14px] uppercase" />
      </div>
    </Field>
  );
}

function ContrastList({ theme }: { theme: Theme }) {
  const lines = [
    { label: "Text on background", ratio: contrastRatio(theme.ink, theme.background), min: 4.5 },
    { label: "Text on panels", ratio: contrastRatio(theme.ink, theme.surface), min: 4.5 },
    { label: "Button text on accent", ratio: contrastRatio(accentInk(theme), theme.accent), min: 4.5 },
    { label: "Accent on background", ratio: contrastRatio(theme.accent, theme.background), min: 3 },
  ];
  return (
    <ul className="mt-5 flex flex-col gap-1.5 text-[13px]">
      {lines.map((l) => {
        const ok = l.ratio >= l.min;
        return (
          <li key={l.label} className={clsx("flex items-center justify-between", ok ? "text-ops-muted" : "text-[#8a2f1f]")}>
            <span>{l.label}</span>
            <span className="tabular">
              {l.ratio.toFixed(1)}:1 {ok ? "· easy to read" : `· hard to read, aim for ${l.min}:1`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

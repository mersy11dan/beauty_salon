"use client";

import clsx from "clsx";
import { ImageInput } from "@/components/ops/image-input";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { SocialRow } from "@/components/site/social-icons";
import { accentInk, contrastRatio, themeStyle } from "@/components/site/theme-vars";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { isValidUrl } from "@/lib/format";
import { useSalonStore } from "@/lib/store";
import type { Socials, Theme } from "@/lib/types";

const PRESETS: { name: string; theme: Theme }[] = [
  { name: "Porcelain", theme: { background: "#F5F1F2", ink: "#1E181C", accent: "#6E2B3F", surface: "#FFFFFF" } },
  { name: "Linen", theme: { background: "#F4EFE6", ink: "#262119", accent: "#7A5A2E", surface: "#FFFDF8" } },
  { name: "Sage", theme: { background: "#EEF1EC", ink: "#1B211C", accent: "#3F5E4A", surface: "#FFFFFF" } },
  { name: "Ink", theme: { background: "#17161A", ink: "#F4F1F3", accent: "#D9A3B0", surface: "#221F26" } },
  { name: "Blush", theme: { background: "#F8EEF0", ink: "#2A1A20", accent: "#B4475F", surface: "#FFFFFF" } },
];

const SOCIAL_FIELDS: { key: keyof Socials; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yoursalon" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yoursalon" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yoursalon" },
  { key: "x", label: "X", placeholder: "https://x.com/yoursalon" },
];

export default function BrandPage() {
  const settings = useSalonStore((s) => s.settings);
  const update = useSalonStore((s) => s.updateSettings);
  const setTheme = useSalonStore((s) => s.setTheme);
  const t = settings.theme;

  const bodyContrast = contrastRatio(t.ink, t.background);
  const buttonContrast = contrastRatio(accentInk(t), t.accent);
  const accentOnBg = contrastRatio(t.accent, t.background);

  return (
    <>
      <OpsTitle title="Brand and colours" intro="What the public site is called and how it looks. Changes apply immediately." />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-ops-ink">Name and logo</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Salon name" htmlFor="name">
                <Input id="name" value={settings.name} onChange={(e) => update({ name: e.target.value })} />
              </Field>
              <Field label="Tagline" htmlFor="tagline" hint="Shown under the name. Leave blank to hide.">
                <Input id="tagline" value={settings.tagline} onChange={(e) => update({ tagline: e.target.value })} />
              </Field>
              <Field label="Logo" htmlFor="logo" hint="Optional. Replaces the typed name in the header." className="sm:col-span-2">
                <ImageInput id="logo" value={settings.logoDataUrl} onChange={(v) => update({ logoDataUrl: v })} aspect="aspect-[3/1]" />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Colours</h2>
            <p className="mb-4 text-[13.5px] text-ops-muted">Four colours drive the whole site. Everything else is mixed from these.</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setTheme(p.theme)}
                  className="flex items-center gap-2 rounded-full border border-ops-line py-1 pl-1.5 pr-3 text-[13px] text-ops-ink transition-colors hover:border-ops-accent"
                >
                  <span className="flex -space-x-1">
                    <Swatch c={p.theme.background} />
                    <Swatch c={p.theme.accent} />
                    <Swatch c={p.theme.ink} />
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="Background" value={t.background} onChange={(v) => setTheme({ background: v })} />
              <ColorField label="Text" value={t.ink} onChange={(v) => setTheme({ ink: v })} />
              <ColorField label="Accent" value={t.accent} onChange={(v) => setTheme({ accent: v })} hint="Buttons, the active label, stars." />
              <ColorField label="Panels" value={t.surface} onChange={(v) => setTheme({ surface: v })} hint="Sticky menu bar, forms, booking summary." />
            </div>
            <ul className="mt-5 flex flex-col gap-1.5 text-[13px]">
              <ContrastLine label="Text on background" ratio={bodyContrast} min={4.5} />
              <ContrastLine label="Button text on accent" ratio={buttonContrast} min={4.5} />
              <ContrastLine label="Accent on background" ratio={accentOnBg} min={3} />
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Social links</h2>
            <p className="mb-4 text-[13.5px] text-ops-muted">Icons appear in the footer. An empty link hides that icon.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_FIELDS.map((f) => {
                const v = settings.socials[f.key];
                return (
                  <Field key={f.key} label={f.label} htmlFor={`social-${f.key}`} error={isValidUrl(v) ? undefined : "Use a full link starting with https://"}>
                    <Input
                      id={`social-${f.key}`}
                      inputMode="url"
                      placeholder={f.placeholder}
                      value={v}
                      onChange={(e) => update({ socials: { ...settings.socials, [f.key]: e.target.value } })}
                    />
                  </Field>
                );
              })}
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-ops-muted">Preview</p>
          <div style={themeStyle(t)} className="overflow-hidden rounded-xl border border-ops-line bg-bg text-ink">
            <div className="flex flex-col items-center px-6 pb-4 pt-7 text-center">
              {settings.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logoDataUrl} alt="" className="h-8 w-auto" />
              ) : (
                <span className="font-display text-[1.2rem] uppercase tracking-[0.2em]">{settings.name || "Salon name"}</span>
              )}
              {settings.tagline && <span className="mt-2 text-[9.5px] uppercase tracking-[0.2em] text-muted">{settings.tagline}</span>}
            </div>
            <div className="flex justify-center gap-4 bg-surface py-2 text-[11px] text-ink/70 shadow-[0_1px_0_0_var(--line)]">
              <span>Services</span>
              <span>Portfolio</span>
              <span className="font-semibold text-accent">Book</span>
            </div>
            <div className="px-6 pb-7 pt-6">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-accent">Nails</p>
              <p className="font-display mt-2 text-[1.35rem] leading-[1.05]">{settings.hero.headline}</p>
              <p className="mt-3 text-[11.5px] leading-[1.5] text-muted">{settings.hero.paragraph}</p>
              <span className="mt-4 inline-flex h-8 items-center rounded-full bg-accent px-4 text-[11px] font-medium text-accent-ink">Book a time</span>
              <div className="hairline-t mt-6 pt-4">
                <SocialRow socials={settings.socials} className="flex items-center justify-center gap-5 [&_svg]:h-4 [&_svg]:w-4" />
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="mt-3 text-ops-muted" onClick={() => setTheme(PRESETS[0].theme)}>
            Reset colours
          </Button>
        </aside>
      </div>
    </>
  );
}

function Swatch({ c }: { c: string }) {
  return <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: c }} />;
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

function ContrastLine({ label, ratio, min }: { label: string; ratio: number; min: number }) {
  const ok = ratio >= min;
  return (
    <li className={clsx("flex items-center justify-between", ok ? "text-ops-muted" : "text-[#8a2f1f]")}>
      <span>{label}</span>
      <span className="tabular">
        {ratio.toFixed(1)}:1 {ok ? "· readable" : `· needs ${min}:1`}
      </span>
    </li>
  );
}

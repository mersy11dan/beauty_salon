"use client";

import { ImageInput } from "@/components/ops/image-input";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { SitePreview } from "@/components/ops/site-preview";
import { Field, Input, Textarea } from "@/components/ui/field";
import { isValidUrl } from "@/lib/format";
import { useSalonStore } from "@/lib/store";
import type { Socials } from "@/lib/types";

const SOCIAL_FIELDS: { key: keyof Socials; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yoursalon" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yoursalon" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yoursalon" },
  { key: "x", label: "X", placeholder: "https://x.com/yoursalon" },
];

export default function BrandPage() {
  const settings = useSalonStore((s) => s.settings);
  const update = useSalonStore((s) => s.updateSettings);

  return (
    <>
      <OpsTitle
        title="Name and logo"
        intro="The client's name, logo, browser-tab icon and how the site shows up in Google. Changes save as you go."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
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
                <ImageInput id="logo" value={settings.logoUrl} onChange={(v) => update({ logoUrl: v })} aspect="aspect-[3/1]" />
              </Field>
              <Field
                label="Browser-tab icon"
                htmlFor="favicon"
                hint="A square picture, like the logo mark. Leave empty for the default icon."
                className="sm:col-span-2"
              >
                <ImageInput
                  id="favicon"
                  value={settings.faviconUrl}
                  onChange={(v) => update({ faviconUrl: v })}
                  aspect="aspect-square"
                  maxSize={256}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Search and sharing</h2>
            <p className="mb-4 text-[13.5px] text-ops-muted">What Google and link previews show for the client&apos;s site.</p>
            <div className="grid gap-4">
              <Field label="Page title" htmlFor="seo-title" hint={`Blank uses the salon name: “${settings.name}”.`}>
                <Input
                  id="seo-title"
                  value={settings.seo.title}
                  placeholder={settings.name}
                  onChange={(e) => update({ seo: { ...settings.seo, title: e.target.value } })}
                />
              </Field>
              <Field label="Description" htmlFor="seo-description" hint="One or two sentences. About 150 characters reads best in search results.">
                <Textarea
                  id="seo-description"
                  value={settings.seo.description}
                  onChange={(e) => update({ seo: { ...settings.seo, description: e.target.value } })}
                  className="min-h-20"
                />
              </Field>
            </div>
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
          <SitePreview settings={settings} />
        </aside>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { ImageInput } from "@/components/ops/image-input";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { PhoneInput } from "@/components/ui/phone-input";
import { WEEKDAY_NAMES } from "@/lib/dates";
import { uid } from "@/lib/format";
import { checkPhone, parsePhone, phoneHint, type PhoneValue } from "@/lib/phone";
import { useSalonStore } from "@/lib/store";
import type { Weekday } from "@/lib/types";
import { checkEmail } from "@/lib/validation";

const ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

/** Landlines are fine here. Saves once the number is complete, so the site never shows half a number. */
function ContactPhone({ value, onSave }: { value: string; onSave: (e164: string) => void }) {
  const [phone, setPhone] = useState<PhoneValue>(() => parsePhone(value));
  const [touched, setTouched] = useState(false);
  const check = checkPhone(phone, "any");
  const error = touched && !check.ok ? check.error : undefined;
  return (
    <Field label="Phone" htmlFor="phone" error={error} hint={`${phoneHint(phone.country, "any")} Saves once complete.`}>
      <PhoneInput
        id="phone"
        kind="any"
        value={phone}
        invalid={!!error}
        describedBy={error ? "phone-error" : "phone-hint"}
        onChange={(v) => {
          setPhone(v);
          const r = checkPhone(v, "any");
          if (r.ok) onSave(r.e164);
        }}
        onBlur={() => setTouched(true)}
      />
    </Field>
  );
}

function ContactEmail({ value, onSave }: { value: string; onSave: (email: string) => void }) {
  const [email, setEmail] = useState(value);
  const [touched, setTouched] = useState(false);
  const problem = checkEmail(email);
  const error = touched ? problem : undefined;
  return (
    <Field label="Email" htmlFor="email" error={error} hint="Saves once it is a full address.">
      <Input
        id="email"
        type="email"
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={!!error}
        aria-describedby={error ? "email-error" : "email-hint"}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (!checkEmail(e.target.value)) onSave(e.target.value.trim());
        }}
        onBlur={() => setTouched(true)}
      />
    </Field>
  );
}

export default function ContentPage() {
  const settings = useSalonStore((s) => s.settings);
  const update = useSalonStore((s) => s.updateSettings);
  const { hero, about, contact, hours } = settings;

  const setHero = (patch: Partial<typeof hero>) => update({ hero: { ...hero, ...patch } });
  const setSlide = (id: string, patch: Partial<(typeof hero.slides)[number]>) =>
    setHero({ slides: hero.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  return (
    <>
      <OpsTitle title="Content and hours" intro="The words and facts on the public site. Everything saves as you type." />

      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ops-ink">Homepage opening</h2>
          <div className="grid gap-4">
            <Field label="Headline" htmlFor="headline" hint="One sentence. Up to about nine words reads best.">
              <Input id="headline" value={hero.headline} onChange={(e) => setHero({ headline: e.target.value })} />
            </Field>
            <Field label="Paragraph" htmlFor="paragraph">
              <Textarea id="paragraph" value={hero.paragraph} onChange={(e) => setHero({ paragraph: e.target.value })} />
            </Field>
          </div>

          <h3 className="mb-1 mt-7 text-[14px] font-semibold text-ops-ink">Photos that rotate next to the headline</h3>
          <p className="mb-4 text-[13.5px] text-ops-muted">Portrait photos on a plain, light background blend best. The small label above the headline is taken from here.</p>
          <ul className="flex flex-col divide-y divide-ops-line">
            {hero.slides.map((s) => (
              <li key={s.id} className="grid gap-4 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                <Field label="Label" htmlFor={`label-${s.id}`}>
                  <Input id={`label-${s.id}`} value={s.label} onChange={(e) => setSlide(s.id, { label: e.target.value })} />
                </Field>
                <Field label="Photo" htmlFor={`img-${s.id}`}>
                  <ImageInput id={`img-${s.id}`} value={s.src} onChange={(v) => setSlide(s.id, { src: v ?? "" })} aspect="aspect-[4/5]" />
                </Field>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-ops-muted sm:mt-7"
                  disabled={hero.slides.length <= 1}
                  onClick={() => setHero({ slides: hero.slides.filter((x) => x.id !== s.id) })}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            disabled={hero.slides.length >= 5}
            onClick={() => setHero({ slides: [...hero.slides, { id: uid("slide"), label: "New", src: "", alt: "" }] })}
          >
            Add a photo
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ops-ink">About the salon</h2>
          <div className="grid gap-4">
            <Field label="Heading" htmlFor="about-heading">
              <Input id="about-heading" value={about.heading} onChange={(e) => update({ about: { ...about, heading: e.target.value } })} />
            </Field>
            <Field label="Text" htmlFor="about-body">
              <Textarea id="about-body" className="min-h-36" value={about.body} onChange={(e) => update({ about: { ...about, body: e.target.value } })} />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ops-ink">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ContactPhone value={contact.phone} onSave={(phone) => update({ contact: { ...contact, phone } })} />
            <ContactEmail value={contact.email} onSave={(email) => update({ contact: { ...contact, email } })} />
            <Field label="Address" htmlFor="address" className="sm:col-span-2">
              <Input id="address" value={contact.address} onChange={(e) => update({ contact: { ...contact, address: e.target.value } })} />
            </Field>
            <Field label="Map link" htmlFor="map" hint="Paste a Google Maps share link. Leave blank to hide." className="sm:col-span-2">
              <Input id="map" inputMode="url" value={contact.mapUrl} onChange={(e) => update({ contact: { ...contact, mapUrl: e.target.value } })} />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Opening hours</h2>
          <p className="mb-4 text-[13.5px] text-ops-muted">Booking only offers times inside these hours.</p>
          <ul className="divide-y divide-ops-line">
            {ORDER.map((d) => {
              const h = hours[d];
              return (
                <li key={d} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-28 text-[14.5px] text-ops-ink">{WEEKDAY_NAMES[d]}</span>
                  <label className="flex items-center gap-2 text-[13.5px] text-ops-muted">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-ops-accent"
                      checked={!!h}
                      onChange={(e) =>
                        update({ hours: { ...hours, [d]: e.target.checked ? { open: "09:00", close: "18:00" } : null } })
                      }
                    />
                    Open
                  </label>
                  {h && (
                    <span className="flex items-center gap-2">
                      <Input type="time" aria-label={`${WEEKDAY_NAMES[d]} opens`} value={h.open} onChange={(e) => update({ hours: { ...hours, [d]: { ...h, open: e.target.value } } })} className="w-32" />
                      <span className="text-ops-muted">to</span>
                      <Input type="time" aria-label={`${WEEKDAY_NAMES[d]} closes`} value={h.close} onChange={(e) => update({ hours: { ...hours, [d]: { ...h, close: e.target.value } } })} className="w-32" />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-5 max-w-xs">
            <Field label="Bookings at the same time" htmlFor="capacity" hint="Used when guests book without choosing a person. Usually the number of chairs.">
              <Input
                id="capacity"
                inputMode="numeric"
                value={String(settings.capacity)}
                onChange={(e) => update({ capacity: Math.max(1, Number(e.target.value) || 1) })}
              />
            </Field>
          </div>
        </Card>
      </div>
    </>
  );
}

"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { ImageInput } from "@/components/ops/image-input";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { uid } from "@/lib/format";
import { useSalonStore } from "@/lib/store";
import type { HeroSlide } from "@/lib/types";

const MAX_SLIDES = 5;

export default function ContentPage() {
  const settings = useSalonStore((s) => s.settings);
  const update = useSalonStore((s) => s.updateSettings);
  const { hero, about } = settings;

  const setHero = (patch: Partial<typeof hero>) => update({ hero: { ...hero, ...patch } });
  const setAbout = (patch: Partial<typeof about>) => update({ about: { ...about, ...patch } });
  const setSlide = (id: string, patch: Partial<HeroSlide>) =>
    setHero({ slides: hero.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const moveSlide = (i: number, dir: -1 | 1) => {
    const next = hero.slides.slice();
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setHero({ slides: next });
  };
  const setPhoto = (i: number, v: string | null) => {
    const photos = [about.photos[0] ?? "", about.photos[1] ?? ""];
    photos[i] = v ?? "";
    setAbout({ photos: photos[0] || photos[1] ? photos : [] });
  };

  return (
    <>
      <OpsTitle
        title="Homepage"
        intro="The headline, the rotating photos and the about block. Everything saves as you type. Button and section wording is under Site text."
      />

      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ops-ink">Opening</h2>
          <div className="grid gap-4">
            <Field label="Headline" htmlFor="headline" hint="One sentence. Up to about nine words reads best.">
              <Input id="headline" value={hero.headline} onChange={(e) => setHero({ headline: e.target.value })} />
            </Field>
            <Field label="Paragraph" htmlFor="paragraph">
              <Textarea id="paragraph" value={hero.paragraph} onChange={(e) => setHero({ paragraph: e.target.value })} />
            </Field>
          </div>

          <h3 className="mb-1 mt-7 text-[14px] font-semibold text-ops-ink">Photos that rotate next to the headline</h3>
          <p className="mb-4 text-[13.5px] text-ops-muted">
            Portrait photos on a plain, light background blend best. The label shows above the headline, in the big script behind the
            photo, and in the moving ticker.
          </p>
          <ul className="flex flex-col divide-y divide-ops-line">
            {hero.slides.map((s, i) => (
              <li key={s.id} className="grid gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
                <div className="grid gap-4">
                  <Field label="Label" htmlFor={`label-${s.id}`}>
                    <Input id={`label-${s.id}`} value={s.label} onChange={(e) => setSlide(s.id, { label: e.target.value })} />
                  </Field>
                  <Field label="Photo description" htmlFor={`alt-${s.id}`} hint="Read aloud by screen readers and used by Google.">
                    <Input id={`alt-${s.id}`} value={s.alt} onChange={(e) => setSlide(s.id, { alt: e.target.value })} />
                  </Field>
                </div>
                <Field label="Photo" htmlFor={`img-${s.id}`}>
                  <ImageInput id={`img-${s.id}`} value={s.src || null} onChange={(v) => setSlide(s.id, { src: v ?? "" })} aspect="aspect-[4/5]" />
                </Field>
                <div className="flex items-center gap-1 sm:mt-7">
                  <IconButton label="Move up" disabled={i === 0} onClick={() => moveSlide(i, -1)}>
                    <ChevronUp size={16} strokeWidth={1.75} />
                  </IconButton>
                  <IconButton label="Move down" disabled={i === hero.slides.length - 1} onClick={() => moveSlide(i, 1)}>
                    <ChevronDown size={16} strokeWidth={1.75} />
                  </IconButton>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-ops-muted"
                    disabled={hero.slides.length <= 1}
                    onClick={() => setHero({ slides: hero.slides.filter((x) => x.id !== s.id) })}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            disabled={hero.slides.length >= MAX_SLIDES}
            onClick={() => setHero({ slides: [...hero.slides, { id: uid("slide"), label: "New", src: "", alt: "" }] })}
          >
            Add a photo
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ops-ink">About the salon</h2>
          <div className="grid gap-4">
            <Field label="Heading" htmlFor="about-heading">
              <Input id="about-heading" value={about.heading} onChange={(e) => setAbout({ heading: e.target.value })} />
            </Field>
            <Field label="Text" htmlFor="about-body" hint="Press Enter twice to start a new paragraph.">
              <Textarea id="about-body" className="min-h-36" value={about.body} onChange={(e) => setAbout({ body: e.target.value })} />
            </Field>
          </div>
          <h3 className="mb-1 mt-7 text-[14px] font-semibold text-ops-ink">Photos beside the text</h3>
          <p className="mb-4 text-[13.5px] text-ops-muted">Leave both empty to pick two from the portfolio automatically.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <Field key={i} label={i === 0 ? "Large photo" : "Small photo"} htmlFor={`about-photo-${i}`}>
                <ImageInput id={`about-photo-${i}`} value={about.photos[i] || null} onChange={(v) => setPhoto(i, v)} aspect="aspect-[3/4]" />
              </Field>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md p-2 text-ops-muted transition-colors hover:bg-ops-bg hover:text-ops-ink disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

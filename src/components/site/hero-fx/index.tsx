"use client";

import clsx from "clsx";
import type { ComponentType } from "react";
import type { HeroSlide } from "@/lib/types";
import { HairFx } from "./hair-fx";
import { MakeupFx } from "./makeup-fx";
import { NailsFx } from "./nails-fx";
import type { FxProps } from "./types";

type HeroFx = {
  Component: ComponentType<FxProps>;
  /** How long the slide stays up, so each scene can finish before the next one. */
  duration: number;
};

/*
  Effects are traced from the built-in photos, so they only run on those exact
  files. A photo uploaded in the admin shows as a still image.
*/
const EFFECTS: Record<string, HeroFx> = {
  "/media/hero/nails.webp": { Component: NailsFx, duration: 8200 },
  "/media/hero/hair.webp": { Component: HairFx, duration: 6400 },
  "/media/hero/makeup.webp": { Component: MakeupFx, duration: 6400 },
};

export function heroFxDuration(src: string | undefined, fallback: number) {
  return (src && EFFECTS[src]?.duration) || fallback;
}

export function HeroSlideMedia({ slide, active, dark, accent }: { slide: HeroSlide; active: boolean; dark: boolean; accent: string }) {
  const fx = EFFECTS[slide.src];
  const alt = active ? slide.alt : "";
  return (
    <div
      aria-hidden={!active}
      className={clsx(
        "photo-fade absolute inset-0 overflow-hidden transition-[opacity,transform] duration-[1600ms] ease-out-quart",
        // Multiply melts a white studio backdrop into a light page; on a dark page it would black the photo out.
        !dark && "mix-blend-multiply",
        active ? "scale-100 opacity-100" : "pointer-events-none scale-[1.03] opacity-0",
      )}
    >
      {fx ? (
        <fx.Component src={slide.src} alt={alt} active={active} accent={accent} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.src}
          alt={alt}
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover object-[50%_28%]"
        />
      )}
    </div>
  );
}

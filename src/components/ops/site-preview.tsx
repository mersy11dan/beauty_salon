"use client";

import { SocialRow } from "@/components/site/social-icons";
import { themeStyle } from "@/components/site/theme-vars";
import { resolveCopy } from "@/lib/copy";
import type { FontChoice, Settings, Theme } from "@/lib/types";

/** A small stand-in for the public home page, drawn with the given colours and fonts. */
export function SitePreview({ settings, theme, fonts }: { settings: Settings; theme?: Theme; fonts?: FontChoice }) {
  const copy = resolveCopy(settings.copy);
  const label = settings.hero.slides[0]?.label || "Nails";
  return (
    <div
      style={themeStyle(theme ?? settings.theme, fonts ?? settings.fonts)}
      className="overflow-hidden rounded-xl border border-ops-line bg-bg text-ink"
    >
      <div className="flex flex-col items-center px-6 pb-4 pt-7 text-center">
        {settings.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl} alt="" className="h-8 w-auto" />
        ) : (
          <span className="font-script text-[length:calc(1.9rem*var(--script-scale))] leading-[1.1]">
            {settings.name || "Salon name"}
          </span>
        )}
        {settings.tagline && <span className="mt-2 text-[9.5px] uppercase tracking-[0.2em] text-muted">{settings.tagline}</span>}
      </div>
      <div className="flex justify-center gap-4 bg-surface py-2 text-[11px] text-ink/70 shadow-[0_1px_0_0_var(--line)]">
        <span>{copy.navServices}</span>
        <span>{copy.navPortfolio}</span>
        <span className="font-semibold text-accent">{copy.navBook}</span>
      </div>
      <div className="px-6 pb-7 pt-6">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-accent">{label}</p>
        <p className="font-display mt-2 text-[length:calc(1.35rem*var(--display-scale))] leading-[1.08]">{settings.hero.headline}</p>
        <p className="mt-3 line-clamp-3 text-[11.5px] leading-[1.5] text-muted">{settings.hero.paragraph}</p>
        <span className="mt-4 inline-flex h-8 items-center rounded-full bg-accent px-4 text-[11px] font-medium text-accent-ink">
          {copy.heroBook}
        </span>
        <div className="mt-6 rounded-lg border border-line bg-surface p-3">
          <p className="font-script text-[length:calc(1.5rem*var(--script-scale))] leading-[1.15]">{copy.homeServicesTitle}</p>
          <div className="mt-1.5 flex items-baseline justify-between text-[11px]">
            <span>Gel manicure</span>
            <span className="tabular">55</span>
          </div>
        </div>
        <div className="hairline-t mt-6 pt-4">
          <SocialRow socials={settings.socials} className="flex items-center justify-center gap-5 [&_svg]:h-4 [&_svg]:w-4" />
        </div>
      </div>
    </div>
  );
}

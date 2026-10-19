import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { ScriptReveal } from "@/components/motion/split-text";

export function Section({
  id,
  children,
  className,
  bleed,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  return (
    <section id={id} className={clsx("py-16 md:py-24", className)}>
      <div className={clsx(bleed ? "" : "mx-auto max-w-6xl px-6")}>{children}</div>
    </section>
  );
}

/**
 * Section title in script, with an optional small uppercase label above it and
 * a "more" link that sits on the baseline at desktop widths.
 */
export function SectionHeading({
  title,
  label,
  intro,
  more,
  className,
}: {
  title: string;
  label?: string;
  intro?: string;
  more?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={clsx("mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {label && (
          <Reveal y={10}>
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-accent">{label}</p>
          </Reveal>
        )}
        <ScriptReveal as="h2" className="font-script text-script-lg text-balance text-ink">
          {title}
        </ScriptReveal>
        {intro && (
          <Reveal delay={0.15} y={12}>
            <p className="mt-3 max-w-[48ch] text-[15.5px] leading-[1.6] text-muted">{intro}</p>
          </Reveal>
        )}
      </div>
      {more && (
        <Reveal delay={0.25} y={10}>
          <Link
            href={more.href}
            className="hit-area group inline-flex items-center gap-2 self-start text-[14px] font-medium text-ink md:self-auto"
          >
            {more.label}
            <span aria-hidden className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
              →
            </span>
          </Link>
        </Reveal>
      )}
    </div>
  );
}

export function PageTitle({ title, label, intro }: { title: string; label?: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-10 pt-8 md:pb-14 md:pt-14">
      {label && (
        <Reveal y={10}>
          <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-accent">{label}</p>
        </Reveal>
      )}
      <ScriptReveal as="h1" className="font-script text-script-xl text-balance text-ink">
        {title}
      </ScriptReveal>
      {intro && (
        <Reveal delay={0.15} y={12}>
          <p className="mt-4 max-w-[52ch] text-[16.5px] leading-[1.6] text-muted">{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

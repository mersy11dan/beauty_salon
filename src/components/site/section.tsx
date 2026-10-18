import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

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

export function SectionHeading({
  title,
  intro,
  more,
  className,
}: {
  title: string;
  intro?: string;
  more?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={clsx("mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-[30ch]">
        <h2 className="font-display text-display-lg text-balance text-ink">{title}</h2>
        {intro && <p className="mt-3 max-w-[48ch] text-[15.5px] leading-[1.6] text-muted">{intro}</p>}
      </div>
      {more && (
        <Link
          href={more.href}
          className="group inline-flex items-center gap-2 self-start text-[14px] font-medium text-ink md:self-auto"
        >
          {more.label}
          <span aria-hidden className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
            →
          </span>
        </Link>
      )}
    </div>
  );
}

export function PageTitle({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-10 pt-10 md:pb-14 md:pt-16">
      <h1 className="font-display text-display-xl text-balance text-ink">{title}</h1>
      {intro && <p className="mt-5 max-w-[52ch] text-[16.5px] leading-[1.6] text-muted">{intro}</p>}
    </div>
  );
}

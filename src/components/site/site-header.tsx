"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navFor } from "@/lib/nav";
import { useSettings } from "@/lib/store";

export function Wordmark({
  name,
  logo,
  size = "lg",
  className,
}: {
  name: string;
  logo: string | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={name}
        className={clsx(size === "lg" ? "h-12 md:h-14" : "h-7", "w-auto object-contain", className)}
      />
    );
  }
  return (
    <span
      className={clsx(
        "font-script text-ink",
        size === "lg" ? "text-[2.75rem] leading-[1.1] md:text-[3.4rem]" : "text-[1.7rem] leading-none",
        className,
      )}
    >
      {name}
    </span>
  );
}

export function SiteHeader() {
  const settings = useSettings();
  const pathname = usePathname();
  const sentinel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [more, setMore] = useState({ before: false, after: false });
  const items = navFor(settings.modules);

  // On narrow screens the links scroll sideways: keep the current page in view
  // and fade whichever edge has more links past it.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>("[aria-current=page]");
    if (active && el.scrollWidth > el.clientWidth) {
      const target = active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2;
      el.scrollTo({ left: Math.max(0, target), behavior: "instant" });
    }
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      setMore({ before: el.scrollLeft > 2, after: el.scrollLeft < max - 2 });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [pathname]);

  const fade = 28;
  const mask =
    more.before || more.after
      ? `linear-gradient(to right, ${more.before ? "transparent" : "#000"} 0, #000 ${more.before ? fade : 0}px, #000 calc(100% - ${more.after ? fade : 0}px), ${more.after ? "transparent" : "#000"} 100%)`
      : undefined;

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: "-1px 0px 0px 0px",
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The nav is a sibling of the header (not a child) so `position: sticky`
  // is constrained by the full-page wrapper and stays pinned all the way down.
  return (
    <>
      <header className="flex flex-col items-center px-6 pb-5 pt-8 text-center md:pt-10">
        <Link href="/" className="rounded-sm">
          <Wordmark name={settings.name} logo={settings.logoUrl} />
        </Link>
        {settings.tagline && (
          <p className="mt-2 text-[11.5px] font-medium uppercase tracking-[0.22em] text-muted">
            {settings.tagline}
          </p>
        )}
      </header>

      <div ref={sentinel} aria-hidden className="h-px w-full" />

      <nav
        aria-label="Main"
        className={clsx(
          "sticky top-0 z-30 transition-[background-color,box-shadow] duration-500 ease-out-quart",
          stuck
            ? "bg-white/95 shadow-[0_1px_0_0_var(--line)] backdrop-blur-sm"
            : "bg-transparent",
        )}
      >
        <div className="relative mx-auto flex h-12 max-w-6xl items-center px-6">
          <Link
            href="/"
            className={clsx(
              "absolute left-6 hidden rounded-sm transition-opacity duration-500 lg:block",
              stuck ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            tabIndex={stuck ? 0 : -1}
          >
            <Wordmark name={settings.name} logo={settings.logoUrl} size="sm" />
          </Link>

          <div
            ref={scroller}
            className="no-scrollbar w-full overflow-x-auto"
            style={{ maskImage: mask, WebkitMaskImage: mask }}
          >
            <ul className="mx-auto flex w-max items-center gap-7 px-1 md:gap-9">
              {items.map((item) => {
                const active =
                  item.href !== "/#visit" &&
                  (pathname === item.href || pathname.startsWith(item.href + "/"));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "relative block py-3 text-[14px] tracking-[0.01em] transition-colors duration-300",
                        active ? "text-ink" : "text-ink/70 hover:text-ink",
                        item.module === "booking" && "font-semibold text-accent hover:text-accent-hover",
                      )}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={clsx(
                          "absolute inset-x-0 bottom-1.5 h-px origin-left bg-ink transition-transform duration-500 ease-out-expo",
                          active ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

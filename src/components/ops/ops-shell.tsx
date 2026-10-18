"use client";

import clsx from "clsx";
import { ArrowUpRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/hydration";
import { useSalonStore, type Sync } from "@/lib/store";
import type { Role, Session } from "@/lib/types";

/** Items sharing a `group` sit under one heading in the wide sidebar. */
export type OpsNavItem = { href: string; label: string; exact?: boolean; group?: string };

export function OpsShell({
  area,
  allow,
  nav,
  children,
}: {
  area: "Desk" | "Admin";
  allow: Role[];
  nav: OpsNavItem[];
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const session = useSalonStore((s) => s.session);
  const name = useSalonStore((s) => s.settings.name);
  const signOut = useSalonStore((s) => s.signOut);
  const router = useRouter();
  const pathname = usePathname();

  const allowed = session && allow.includes(session.role);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace(session.role === "admin" ? "/admin" : "/desk");
  }, [hydrated, session, allowed, router, pathname]);

  useLivePolling(!!allowed);

  if (!hydrated || !allowed) {
    return <div className="min-h-dvh bg-ops-bg" aria-busy />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ops-bg text-ops-ink lg:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-ops-line bg-ops-surface lg:w-60 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-6">
          <div>
            <p className="font-display text-[15px] uppercase tracking-[0.16em] text-ops-ink">{name}</p>
            <p className="mt-0.5 flex items-center gap-2 text-[12px] text-ops-muted">
              {area}
              <ModeChip />
            </p>
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            <HeaderLinks session={session} signOut={signOut} compact />
          </div>
        </div>
        <nav aria-label={`${area} sections`} className="no-scrollbar overflow-x-auto px-3 pb-3 lg:flex-1 lg:px-3 lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {nav.map((item, i) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
              const heading = item.group && item.group !== nav[i - 1]?.group ? item.group : null;
              return (
                <li key={item.href} className="shrink-0">
                  {heading && (
                    <p aria-hidden className="hidden px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-ops-muted/80 lg:block">
                      {heading}
                    </p>
                  )}
                  <Link
                    href={item.href}
                    className={clsx(
                      "block rounded-md px-3 py-2 text-[14px] transition-colors duration-200",
                      active ? "bg-ops-bg font-medium text-ops-ink" : "text-ops-muted hover:bg-ops-bg hover:text-ops-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="hidden border-t border-ops-line px-3 py-3 lg:block">
          <HeaderLinks session={session} signOut={signOut} />
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-12">{children}</div>
      </main>
      <SyncBadge />
    </div>
  );
}

/** Live sites: picks up bookings and payments made on other devices while this tab is open. */
function useLivePolling(enabled: boolean) {
  const mode = useSalonStore((s) => s.mode);
  const pollLive = useSalonStore((s) => s.pollLive);
  useEffect(() => {
    if (!enabled || mode !== "live") return;
    const tick = () => {
      if (document.visibilityState === "visible") void pollLive();
    };
    const timer = setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [enabled, mode, pollLive]);
}

function ModeChip() {
  const mode = useSalonStore((s) => s.mode);
  return mode === "live" ? (
    <span
      title="Changes save to this website's own database."
      className="rounded-full bg-[#e3f1e6] px-2 py-px text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#1f5130]"
    >
      Live
    </span>
  ) : (
    <span
      title="A showcase copy. Changes stay in this browser until you launch the site with its own database."
      className="rounded-full bg-ops-bg px-2 py-px text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ops-muted ring-1 ring-ops-line"
    >
      Demo
    </span>
  );
}

const SYNC_TEXT = { pending: "Saving…", saving: "Saving…", saved: "All changes saved" } as const;

function SyncBadge() {
  const mode = useSalonStore((s) => s.mode);
  const sync = useSalonStore((s) => s.sync);
  const [hiddenAt, setHiddenAt] = useState<Sync | null>(null);

  useEffect(() => {
    if (sync.status !== "saved") return;
    const t = setTimeout(() => setHiddenAt(sync), 2500);
    return () => clearTimeout(t);
  }, [sync]);

  if (mode !== "live") return null;
  const visible = sync.status !== "idle" && hiddenAt !== sync;
  const error = sync.status === "error";
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 lg:justify-end lg:px-6">
      {visible && (
        <div
          role={error ? "alert" : "status"}
          className={clsx(
            "pointer-events-auto flex max-w-md items-center gap-3 rounded-full border px-4 py-2 text-[13px] shadow-sm",
            error ? "border-[#e8c3c3] bg-[#fbeeee] text-[#7a2222]" : "border-ops-line bg-ops-surface text-ops-muted",
          )}
        >
          {!error && (
            <span
              aria-hidden
              className={clsx("size-2 rounded-full", sync.status === "saved" ? "bg-[#2f7a46]" : "animate-pulse bg-ops-accent")}
            />
          )}
          <span>{error ? (sync.message ?? "Not saved.") : SYNC_TEXT[sync.status as keyof typeof SYNC_TEXT]}</span>
          {error && (
            <button type="button" onClick={() => setHiddenAt(sync)} className="cursor-pointer font-medium underline underline-offset-2">
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function HeaderLinks({
  session,
  signOut,
  compact,
}: {
  session: NonNullable<Session>;
  signOut: () => void;
  compact?: boolean;
}) {
  const other = session.role === "admin" ? { href: "/desk", label: "Desk" } : null;
  const cls = "flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] text-ops-muted transition-colors hover:bg-ops-bg hover:text-ops-ink";
  return (
    <>
      {!compact && <p className="truncate px-3 pb-1 text-[12px] text-ops-muted">{session.email}</p>}
      {other && !compact && (
        <Link href={other.href} className={cls}>
          {other.label}
        </Link>
      )}
      <Link href="/" className={cls}>
        {compact ? <ArrowUpRight size={16} strokeWidth={1.75} aria-label="View site" /> : <>View site <ArrowUpRight size={14} strokeWidth={1.75} /></>}
      </Link>
      <button type="button" onClick={signOut} className={cls}>
        {compact ? <LogOut size={16} strokeWidth={1.75} aria-label="Sign out" /> : <>Sign out <LogOut size={14} strokeWidth={1.75} /></>}
      </button>
    </>
  );
}

export function OpsTitle({ title, intro, action }: { title: string; intro?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-ops-ink">{title}</h1>
        {intro && <p className="mt-1.5 max-w-[60ch] text-[14.5px] text-ops-muted">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("rounded-xl border border-ops-line bg-ops-surface", className)}>{children}</div>;
}

"use client";

import clsx from "clsx";
import { ArrowUpRight, LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { OpsProvider } from "@/lib/ops-store";
import { useSalonApi, useSalonStore } from "@/lib/store";
import type { OpsSnapshot, Session } from "@/lib/types";

export type OpsNavItem = { href: string; label: string; exact?: boolean };

const ADMIN_NAV: OpsNavItem[] = [
  { href: "/admin", label: "Modules", exact: true },
  { href: "/admin/brand", label: "Brand and colours" },
  { href: "/admin/content", label: "Content and hours" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/portfolio", label: "Portfolio" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/access", label: "Access and data" },
];

/** The desk and admin frame. The server layout has already checked the login before this renders. */
export function OpsShell({
  area,
  session,
  ops,
  children,
}: {
  area: "Desk" | "Admin";
  session: NonNullable<Session>;
  ops: OpsSnapshot;
  children: React.ReactNode;
}) {
  const name = useSalonStore((s) => s.settings.name);
  const ledgerOn = useSalonStore((s) => s.settings.modules.ledger);
  const api = useSalonApi();
  const router = useRouter();
  const pathname = usePathname();

  const nav = useMemo<OpsNavItem[]>(
    () =>
      area === "Admin"
        ? ADMIN_NAV
        : [{ href: "/desk", label: "Appointments", exact: true }, ...(ledgerOn ? [{ href: "/desk/ledger", label: "Payments" }] : [])],
    [area, ledgerOn],
  );

  const hooks = {
    notify: (text: string) => api.getState().notify(text),
    onSignedOut: () => {
      api.getState().forgetSession();
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    },
  };

  async function signOut() {
    await api.getState().flushSettings();
    await api.getState().signOut();
    router.replace("/login");
  }

  return (
    <OpsProvider initial={ops} hooks={hooks}>
      <div className="flex min-h-dvh flex-col bg-ops-bg text-ops-ink lg:flex-row">
        <aside className="flex shrink-0 flex-col border-b border-ops-line bg-ops-surface lg:w-60 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-6">
            <div>
              <p className="font-display text-[15px] uppercase tracking-[0.16em] text-ops-ink">{name}</p>
              <p className="mt-0.5 text-[12px] text-ops-muted">{area}</p>
            </div>
            <div className="flex items-center gap-1 lg:hidden">
              <HeaderLinks session={session} signOut={signOut} compact />
            </div>
          </div>
          <nav aria-label={`${area} sections`} className="no-scrollbar overflow-x-auto px-3 pb-3 lg:flex-1 lg:px-3 lg:pb-0">
            <ul className="flex gap-1 lg:flex-col">
              {nav.map((item) => {
                const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href} className="shrink-0">
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
          <NoticeBanner />
          <div className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-12">{children}</div>
        </main>
        {area === "Admin" && <SaveIndicator />}
      </div>
    </OpsProvider>
  );
}

function HeaderLinks({ session, signOut, compact }: { session: NonNullable<Session>; signOut: () => Promise<void>; compact?: boolean }) {
  const [leaving, setLeaving] = useState(false);
  const other = session.role === "admin" ? { href: "/desk", label: "Desk" } : null;
  const cls = "flex items-center gap-2 rounded-md px-3 py-2 text-[13.5px] text-ops-muted transition-colors hover:bg-ops-bg hover:text-ops-ink";
  return (
    <>
      {!compact && (
        <p className="truncate px-3 pb-1 text-[12px] text-ops-muted" title={session.email}>
          {session.name || session.email}
        </p>
      )}
      {other && !compact && (
        <Link href={other.href} className={cls}>
          {other.label}
        </Link>
      )}
      <Link href="/" className={cls}>
        {compact ? <ArrowUpRight size={16} strokeWidth={1.75} aria-label="View site" /> : <>View site <ArrowUpRight size={14} strokeWidth={1.75} /></>}
      </Link>
      <button
        type="button"
        disabled={leaving}
        onClick={() => {
          setLeaving(true);
          void signOut().finally(() => setLeaving(false));
        }}
        className={clsx(cls, leaving && "opacity-60")}
      >
        {compact ? <LogOut size={16} strokeWidth={1.75} aria-label="Sign out" /> : <>{leaving ? "Signing out…" : "Sign out"} <LogOut size={14} strokeWidth={1.75} /></>}
      </button>
    </>
  );
}

/** Problems from saves and status changes. Inline form errors stay next to their fields. */
function NoticeBanner() {
  const notice = useSalonStore((s) => s.notice);
  const dismiss = useSalonStore((s) => s.dismissNotice);
  const pathname = usePathname();
  if (!notice) return null;
  return (
    <div
      role={notice.tone === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-3 border-b px-5 py-3 text-[13.5px] md:px-10",
        notice.tone === "error" ? "border-[#e8c9c9] bg-[#fbeeee] text-[#7a2424]" : "border-[#cfe3d5] bg-[#eef7f0] text-[#1f5c35]",
      )}
    >
      <p className="flex-1">
        {notice.text}
        {notice.signIn && (
          <>
            {" "}
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="font-medium underline underline-offset-2">
              Sign in again
            </Link>
          </>
        )}
      </p>
      <button type="button" aria-label="Dismiss" onClick={dismiss} className="rounded p-0.5 opacity-70 hover:opacity-100">
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

/** Settings edits save themselves after a short pause; this says whether that has happened. */
function SaveIndicator() {
  const { state, error } = useSalonStore((s) => s.settingsSave);
  const flush = useSalonStore((s) => s.flushSettings);
  const label = { saved: "All changes saved", pending: "Saving…", saving: "Saving…", error: "Not saved" }[state];
  return (
    <div
      aria-live="polite"
      className={clsx(
        "pointer-events-none fixed bottom-4 right-4 z-50 transition-opacity duration-300",
        state === "saved" ? "opacity-0" : "opacity-100",
      )}
    >
      <div
        className={clsx(
          "flex max-w-sm items-center gap-3 rounded-full border px-4 py-2 text-[13px] shadow-sm",
          state !== "saved" && "pointer-events-auto",
          state === "error" ? "border-[#e8c9c9] bg-[#fbeeee] text-[#7a2424]" : "border-ops-line bg-ops-surface text-ops-muted",
        )}
      >
        <span>
          {label}
          {state === "error" && error ? `: ${error}` : ""}
        </span>
        {state === "error" && (
          <button type="button" onClick={() => void flush()} className="font-medium underline underline-offset-2">
            Retry
          </button>
        )}
      </div>
    </div>
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

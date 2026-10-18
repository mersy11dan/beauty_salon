"use client";

import clsx from "clsx";
import { ArrowUpRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useHydrated } from "@/lib/hydration";
import { useSalonStore } from "@/lib/store";
import type { Role } from "@/lib/types";

export type OpsNavItem = { href: string; label: string; exact?: boolean };

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

  if (!hydrated || !allowed) {
    return <div className="min-h-dvh bg-ops-bg" aria-busy />;
  }

  return (
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
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-12">{children}</div>
      </main>
    </div>
  );
}

function HeaderLinks({
  session,
  signOut,
  compact,
}: {
  session: NonNullable<ReturnType<typeof useSalonStore.getState>["session"]>;
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

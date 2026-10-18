"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useHydrated } from "@/lib/hydration";
import { useCustomer } from "@/lib/store";

/** Sends signed-out guests to sign in or create an account, then back to this exact URL. */
export function CustomerGate({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const customer = useCustomer();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (!hydrated || customer) return;
    const qs = params.toString();
    const here = qs ? `${pathname}?${qs}` : pathname;
    router.replace(`/account?next=${encodeURIComponent(here)}`);
  }, [hydrated, customer, router, pathname, params]);

  if (!hydrated || !customer) return <div className="min-h-[60vh]" aria-busy />;
  return <>{children}</>;
}

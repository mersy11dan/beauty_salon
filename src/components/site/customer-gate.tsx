"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCustomer } from "@/lib/store";

/** Sends signed-out guests to sign in or create an account, then back to this exact URL. */
export function CustomerGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const customer = useCustomer();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (customer) return;
    const qs = params.toString();
    const here = qs ? `${pathname}?${qs}` : pathname;
    router.replace(`/account?next=${encodeURIComponent(here)}`);
  }, [customer, router, pathname, params]);

  if (!customer) return <div aria-busy>{fallback ?? <div className="min-h-[60vh]" />}</div>;
  return <>{children}</>;
}

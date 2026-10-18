"use client";

import { useEffect, useState } from "react";
import { DocumentMeta } from "@/components/site/document-meta";
import { createSalonStore, StoreContext, useSalonStore } from "./store";
import type { DataMode, SiteContent } from "./types";

/**
 * One store per page load. Demo sites start from the seed and swap in this
 * browser's saved changes a frame after mount (so server and first client
 * render match). Live sites start from the content the server just read, so
 * the first paint is already the client's own site.
 */
export function SalonProvider({
  mode,
  content,
  children,
}: {
  mode: DataMode;
  content: SiteContent | null;
  children: React.ReactNode;
}) {
  const [salon] = useState(() => createSalonStore(mode, content));
  useEffect(() => salon.start(), [salon]);

  useEffect(() => {
    if (mode !== "live") return;
    const warn = (e: BeforeUnloadEvent) => {
      const { status } = salon.store.getState().sync;
      if (status === "pending" || status === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [mode, salon]);

  return (
    <StoreContext.Provider value={salon.store}>
      <ReadyMeta />
      {children}
    </StoreContext.Provider>
  );
}

function ReadyMeta() {
  return useHydrated() ? <DocumentMeta /> : null;
}

export const useHydrated = () => useSalonStore((s) => s.ready);

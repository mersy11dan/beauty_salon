"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSalonStore } from "@/lib/store";

/**
 * Keeps the tab title and icon in step with the admin's edits, which the
 * server-rendered metadata can't see in demo mode (they live in this browser).
 */
export function DocumentMeta() {
  const name = useSalonStore((s) => s.settings.name);
  const title = useSalonStore((s) => s.settings.seo.title);
  const favicon = useSalonStore((s) => s.settings.faviconDataUrl);
  const pathname = usePathname();

  // Next rewrites the title after client navigations, sometimes after this effect has run, so re-apply on every head change.
  useEffect(() => {
    const want = title.trim() || name;
    if (!want) return;
    const apply = () => {
      if (document.title !== want) document.title = want;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [title, name]);

  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
    for (const link of links) {
      if (!link.dataset.defaultHref) link.dataset.defaultHref = link.getAttribute("href") ?? "";
      link.href = favicon || link.dataset.defaultHref;
    }
    if (favicon && links.length === 0) {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = favicon;
      link.dataset.defaultHref = "";
      document.head.appendChild(link);
    }
  }, [favicon, pathname]);

  return null;
}

"use client";

import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { themeStyle } from "@/components/site/theme-vars";
import { useSettings } from "@/lib/store";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  return (
    <SmoothScroll>
      <div style={themeStyle(settings.theme)} className="flex min-h-dvh flex-col bg-bg text-ink">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </SmoothScroll>
  );
}

import type { Metadata } from "next";
import { SalonProvider } from "@/lib/hydration";
import { getSiteState } from "@/server/site";
import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getSiteState();
  if (!content) {
    return {
      title: { default: "Beauty Salon", template: "%s · Beauty Salon" },
      description: "Nails, hair and makeup, by appointment.",
    };
  }
  const s = content.settings;
  const name = s.name || "Salon";
  return {
    title: { default: s.seo.title.trim() || name, template: `%s · ${name}` },
    description: s.seo.description || s.tagline || undefined,
    icons: s.faviconDataUrl ? { icon: s.faviconDataUrl } : undefined,
    openGraph: {
      title: s.seo.title.trim() || name,
      description: s.seo.description || s.tagline || undefined,
      siteName: name,
      images: s.hero.slides[0]?.src ? [{ url: s.hero.slides[0].src }] : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { mode, content } = await getSiteState();
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <SalonProvider mode={mode} content={content}>
          {children}
        </SalonProvider>
      </body>
    </html>
  );
}

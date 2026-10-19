import type { Metadata } from "next";
import { connection } from "next/server";
import { SalonProvider } from "@/lib/store";
import { getPublicData } from "@/server/data/public";
import { getInitialSnapshot } from "@/server/data/snapshot";
import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { settings: s } = await getPublicData();
  const name = s.name || "Beauty Salon";
  const title = s.seo.title.trim() || name;
  const description = s.seo.description || s.tagline || "Nails, hair and makeup, by appointment.";
  return {
    title: { default: title, template: `%s · ${name}` },
    description,
    icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
    openGraph: {
      title,
      description,
      siteName: name,
      images: s.hero.slides[0]?.src ? [{ url: s.hero.slides[0].src }] : undefined,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initial = await getInitialSnapshot();
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <SalonProvider initial={initial}>{children}</SalonProvider>
      </body>
    </html>
  );
}

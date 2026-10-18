import type { Metadata } from "next";
import { Bodoni_Moda, Manrope, Pinyon_Script } from "next/font/google";
import { connection } from "next/server";
import { SalonProvider } from "@/lib/store";
import { getPublicData } from "@/server/data/public";
import { getInitialSnapshot } from "@/server/data/snapshot";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

// Copperplate script (closest free match to the Edwardian-style reference).
const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: "400",
});

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { settings } = await getPublicData();
  const name = settings.name || "Beauty Salon";
  return {
    title: { default: name, template: `%s · ${name}` },
    description: settings.tagline || "Nails, hair and makeup, by appointment.",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initial = await getInitialSnapshot();
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${bodoni.variable} ${manrope.variable} ${pinyon.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <SalonProvider initial={initial}>{children}</SalonProvider>
      </body>
    </html>
  );
}

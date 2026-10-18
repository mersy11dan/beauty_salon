import type { Metadata } from "next";
import { Bodoni_Moda, Manrope, Noto_Serif_Ethiopic, Pinyon_Script } from "next/font/google";
import { StoreHydrator } from "@/lib/hydration";
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

// Amharic greeting on the home ticker. Not preloaded: only Ge'ez glyphs pull it in.
const ethiopic = Noto_Serif_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
  weight: "300",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Beauty Salon",
    template: "%s · Beauty Salon",
  },
  description: "Nails, hair and makeup, by appointment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${bodoni.variable} ${manrope.variable} ${pinyon.variable} ${ethiopic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <StoreHydrator>{children}</StoreHydrator>
      </body>
    </html>
  );
}

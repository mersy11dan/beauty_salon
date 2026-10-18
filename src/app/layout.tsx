import type { Metadata } from "next";
import { StoreHydrator } from "@/lib/hydration";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Beauty Salon",
    template: "%s · Beauty Salon",
  },
  description: "Nails, hair and makeup, by appointment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <StoreHydrator>{children}</StoreHydrator>
      </body>
    </html>
  );
}

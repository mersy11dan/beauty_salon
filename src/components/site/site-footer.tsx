"use client";

import Link from "next/link";
import { useSettings } from "@/lib/store";
import { SocialRow } from "./social-icons";

export function SiteFooter() {
  const settings = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      <div className="mx-auto max-w-6xl px-6">
        <div className="hairline-t py-14 md:py-16">
          <SocialRow socials={settings.socials} />
        </div>
        <div className="hairline-t flex flex-col items-center gap-3 py-7 text-center text-[12.5px] text-muted md:flex-row md:justify-between md:text-left">
          <p>
            © {year} {settings.name}. {settings.contact.address}.
          </p>
          <p className="flex items-center gap-5">
            <a href={`tel:${settings.contact.phone.replace(/[^+\d]/g, "")}`} className="hover:text-ink">
              {settings.contact.phone}
            </a>
            <Link href="/login" className="hover:text-ink">
              Staff sign in
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

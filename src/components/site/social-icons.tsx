import { siFacebook, siInstagram, siTiktok, siX } from "simple-icons";
import type { Socials } from "@/lib/types";

const ICONS: { key: keyof Socials; title: string; path: string }[] = [
  { key: "facebook", title: siFacebook.title, path: siFacebook.path },
  { key: "instagram", title: siInstagram.title, path: siInstagram.path },
  { key: "x", title: siX.title, path: siX.path },
  { key: "tiktok", title: siTiktok.title, path: siTiktok.path },
];

export function SocialRow({ socials, className }: { socials: Socials; className?: string }) {
  const visible = ICONS.filter((i) => socials[i.key]?.trim());
  if (visible.length === 0) return null;
  return (
    <ul className={className ?? "flex items-center justify-center gap-9"}>
      {visible.map((i) => (
        <li key={i.key}>
          <a
            href={socials[i.key]}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={i.title}
            className="hit-area group block rounded-full p-1 text-ink/70 transition-colors duration-300 hover:text-accent"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className="fill-current">
              <path d={i.path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

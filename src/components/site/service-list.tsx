"use client";

import clsx from "clsx";
import Link from "next/link";
import { formatDuration } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { Service } from "@/lib/types";

export function ServiceRows({
  services,
  bookable,
  compact,
  onHover,
}: {
  services: Service[];
  bookable: boolean;
  compact?: boolean;
  /** Fires with the hovered service, or null when the pointer leaves the list. */
  onHover?: (service: Service | null) => void;
}) {
  return (
    <ul className="hairline-t" onPointerLeave={onHover ? () => onHover(null) : undefined}>
      {services.map((s) => {
        const row = (
          <>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] text-ink">{s.name}</span>
              {!compact && s.note && <span className="mt-0.5 block text-[13.5px] text-muted">{s.note}</span>}
            </span>
            <span className="tabular w-20 shrink-0 text-right text-[13.5px] text-muted">
              {formatDuration(s.durationMin)}
            </span>
            <span className="tabular w-20 shrink-0 text-right text-[16px] text-ink">{formatMoney(s.price)}</span>
          </>
        );
        const cls = clsx(
          "hairline-b flex items-baseline gap-5",
          compact ? "py-3.5" : "py-4.5",
          bookable && "group transition-colors duration-300 hover:bg-soft -mx-3 px-3 rounded-md",
        );
        return (
          <li key={s.id} onPointerEnter={onHover ? () => onHover(s) : undefined}>
            {bookable ? (
              <Link href={`/book?service=${s.id}`} className={cls} aria-label={`Book ${s.name}`}>
                {row}
              </Link>
            ) : (
              <div className={cls}>{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function groupByCategory(services: Service[]) {
  const map = new Map<string, Service[]>();
  for (const s of services) {
    const list = map.get(s.category) ?? [];
    list.push(s);
    map.set(s.category, list);
  }
  return Array.from(map.entries());
}

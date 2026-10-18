import clsx from "clsx";
import { formatTime, WEEKDAY_NAMES } from "@/lib/dates";
import type { Hours, Weekday } from "@/lib/types";

const ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function HoursTable({ hours, today }: { hours: Hours; today?: Weekday }) {
  return (
    <dl className="hairline-t">
      {ORDER.map((d) => {
        const h = hours[d];
        const isToday = today === d;
        return (
          <div
            key={d}
            className={clsx(
              "hairline-b flex items-baseline justify-between gap-6 py-3 text-[15px]",
              isToday ? "text-ink" : "text-muted",
            )}
          >
            <dt className={clsx(isToday && "font-semibold")}>{WEEKDAY_NAMES[d]}</dt>
            <dd className="tabular">
              {h ? `${formatTime(h.open)} – ${formatTime(h.close)}` : "Closed"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

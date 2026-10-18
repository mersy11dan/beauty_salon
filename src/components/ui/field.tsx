import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-lg border border-line-strong/70 bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint transition-colors duration-200 hover:border-line-strong focus:border-ink focus:outline-none aria-invalid:border-[#9b2c2c]/60 disabled:opacity-50";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={htmlFor && `${htmlFor}-error`} className="text-[13px] text-[#9b2c2c]">
          {error}
        </p>
      ) : hint ? (
        <p id={htmlFor && `${htmlFor}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={clsx(control, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={clsx(control, "min-h-28 resize-y", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={clsx(control, "appearance-none pr-9 bg-no-repeat bg-[right_0.75rem_center] bg-[length:14px] [background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b6870' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")]", className)} {...rest}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={clsx("flex items-start justify-between gap-6 py-3.5", disabled && "opacity-50")}>
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-medium text-ink">{label}</span>
        {description && <span className="text-[13px] text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          aria-hidden
          className="h-6 w-10 rounded-full bg-line-strong transition-colors duration-300 ease-out-quart peer-checked:bg-ops-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ops-accent"
        />
        <span
          aria-hidden
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out-quart peer-checked:translate-x-4"
        />
      </span>
    </label>
  );
}

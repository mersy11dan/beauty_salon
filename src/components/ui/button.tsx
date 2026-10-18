import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,border-color,transform,opacity] duration-300 ease-out-quart active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45 select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "bg-transparent text-ink border border-line-strong hover:border-ink",
  ghost: "bg-transparent text-ink hover:bg-soft",
  danger: "bg-transparent text-[#9b2c2c] border border-[#9b2c2c]/30 hover:bg-[#9b2c2c]/6",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[14px]",
  lg: "h-13 px-8 text-[15px]",
};

type Common = { variant?: Variant; size?: Size; className?: string };

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: Common & ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={clsx(base, variants[variant], sizes[size], className)} {...rest} />
  );
}

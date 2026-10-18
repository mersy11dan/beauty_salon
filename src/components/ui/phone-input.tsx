"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { Ref } from "react";
import { checkPhone, COUNTRIES, countryByCode, detectCountry, formatNational, type PhoneKind, type PhoneValue } from "@/lib/phone";

/**
 * Country code picker joined to the number field. The picker is a native
 * select laid invisibly over its label, so it opens the platform list on
 * phones. Pasting "+251 911 …" switches the picker to match, and on blur a
 * valid number is tidied into its local layout ("0911 234 567").
 */
export function PhoneInput({
  id,
  value,
  onChange,
  onBlur,
  kind = "mobile",
  invalid,
  describedBy,
  inputRef,
  required,
}: {
  id: string;
  value: PhoneValue;
  onChange: (next: PhoneValue) => void;
  onBlur?: () => void;
  kind?: PhoneKind;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: Ref<HTMLInputElement>;
  required?: boolean;
}) {
  const country = countryByCode(value.country);

  return (
    <div
      className={clsx(
        "flex w-full items-stretch rounded-lg border bg-surface transition-colors duration-200 focus-within:border-ink",
        invalid ? "border-[#9b2c2c]/60" : "border-line-strong/70 hover:border-line-strong",
      )}
    >
      <div className="relative flex shrink-0 rounded-l-lg transition-colors duration-200 has-[select:focus-visible]:bg-soft">
        <select
          id={`${id}-country`}
          aria-label="Country code"
          value={country.code}
          onChange={(e) => onChange({ country: e.target.value, number: value.number })}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-l-lg text-base opacity-0"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} (+{c.dial})
            </option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none flex items-center gap-1.5 pl-3.5 pr-2.5 text-base text-ink md:text-[15px]">
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted">{country.code}</span>
          <span className="tabular">+{country.dial}</span>
          <ChevronDown className="size-3.5 text-muted" strokeWidth={1.75} />
        </span>
      </div>
      <span aria-hidden className="my-2.5 w-px shrink-0 bg-line-strong/70" />
      <input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required={required}
        placeholder={country.example}
        maxLength={24}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={value.number}
        onChange={(e) => onChange(detectCountry(e.target.value, country.code) ?? { country: country.code, number: e.target.value })}
        onBlur={() => {
          const check = checkPhone(value, kind);
          if (check.ok) {
            const tidy = formatNational(country.code, check.nsn);
            if (tidy !== value.number) onChange({ country: country.code, number: tidy });
          }
          onBlur?.();
        }}
        className="tabular min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2.5 text-base text-ink placeholder:text-faint focus:outline-none md:text-[15px]"
      />
    </div>
  );
}

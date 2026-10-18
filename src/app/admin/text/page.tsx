"use client";

import clsx from "clsx";
import { ArrowUpRight, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { COPY_GROUPS } from "@/lib/copy";
import { useSalonStore } from "@/lib/store";

type Row = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  long?: boolean;
  optional?: boolean;
  tokens?: readonly string[];
};

const GROUPS = COPY_GROUPS.map((g) => ({
  ...g,
  rows: Object.entries(g.fields).map(([key, f]) => ({ key, ...f }) as Row),
}));

export default function TextPage() {
  const copy = useSalonStore((s) => s.settings.copy);
  const update = useSalonStore((s) => s.updateSettings);
  const [query, setQuery] = useState("");

  const changed = Object.keys(copy).length;
  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      rows: g.rows.filter((r) => [r.label, r.value, copy[r.key] ?? "", g.title].some((s) => s.toLowerCase().includes(q))),
    })).filter((g) => g.rows.length > 0);
  }, [q, copy]);

  function set(key: string, value: string, fallback: string) {
    const next = { ...copy };
    if (value === fallback) delete next[key];
    else next[key] = value;
    update({ copy: next });
  }

  function reset(key: string) {
    const next = { ...copy };
    delete next[key];
    update({ copy: next });
  }

  return (
    <>
      <OpsTitle
        title="Site text"
        intro="Every button, label and message on the public site. Words in {braces} fill themselves in, like the salon name or a date. Headlines, services and team are edited on their own pages."
        action={
          changed > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (confirm(`Put all ${changed} changed phrases back to the original wording?`)) update({ copy: {} });
              }}
            >
              <RotateCcw size={14} strokeWidth={1.75} aria-hidden />
              Undo all {changed} changes
            </Button>
          ) : null
        }
      />

      <div className="mb-6 flex flex-col gap-4">
        <label className="relative block max-w-md">
          <span className="sr-only">Find a phrase</span>
          <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ops-muted" aria-hidden />
          <Input
            type="search"
            placeholder="Find a phrase, like “Book a time”"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </label>
        {!q && (
          <nav aria-label="Jump to a page" className="flex flex-wrap gap-1.5">
            {GROUPS.map((g) => {
              const n = g.rows.filter((r) => r.key in copy).length;
              return (
                <a
                  key={g.id}
                  href={`#text-${g.id}`}
                  className="rounded-full border border-ops-line px-3 py-1.5 text-[13px] text-ops-ink transition-colors hover:border-ops-accent"
                >
                  {g.title}
                  {n > 0 && <span className="ml-1.5 text-ops-muted">· {n} changed</span>}
                </a>
              );
            })}
          </nav>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <Card key={g.id} className="p-5">
            <section id={`text-${g.id}`} aria-labelledby={`text-${g.id}-title`} className="scroll-mt-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id={`text-${g.id}-title`} className="text-[15px] font-semibold text-ops-ink">
                    {g.title}
                  </h2>
                  <p className="mt-0.5 text-[13.5px] text-ops-muted">{g.description}</p>
                </div>
                <Link
                  href={g.href}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13px] text-ops-muted transition-colors hover:bg-ops-bg hover:text-ops-ink"
                >
                  View page <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden />
                </Link>
              </div>
              <ul className="divide-y divide-ops-line">
                {g.rows.map((r) => (
                  <TextRow
                    key={r.key}
                    row={r}
                    value={copy[r.key]}
                    onChange={(v) => set(r.key, v, r.value)}
                    onReset={() => reset(r.key)}
                  />
                ))}
              </ul>
            </section>
          </Card>
        ))}
        {groups.length === 0 && (
          <Card className="px-5 py-10 text-center text-[14.5px] text-ops-muted">Nothing matches “{query}”.</Card>
        )}
      </div>
    </>
  );
}

function TextRow({
  row,
  value,
  onChange,
  onReset,
}: {
  row: Row;
  value: string | undefined;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  const id = `copy-${row.key}`;
  const isChanged = value !== undefined;
  const shown = value ?? row.value;
  const blank = shown.trim() === "";
  const notes = [
    row.hint,
    row.tokens?.length ? `Fills in: ${row.tokens.map((t) => `{${t}}`).join(", ")}.` : "",
    blank ? (row.optional ? "Blank, so this is hidden on the site." : `Blank, so the site shows “${row.value}”.`) : "",
    isChanged && !blank ? `Original: “${row.value}”` : "",
  ].filter(Boolean);

  return (
    <li className="grid gap-2 py-3.5 md:grid-cols-[13rem_minmax(0,1fr)_auto] md:items-start md:gap-4">
      <label htmlFor={id} className="pt-2.5 text-[13.5px] font-medium text-ops-ink">
        {row.label}
        {row.optional && <span className="block text-[12px] font-normal text-ops-muted">Can be left blank</span>}
      </label>
      <div className="min-w-0">
        {row.long ? (
          <Textarea id={id} value={shown} onChange={(e) => onChange(e.target.value)} className="min-h-20 text-[14.5px]" />
        ) : (
          <Input id={id} value={shown} onChange={(e) => onChange(e.target.value)} className="text-[14.5px]" />
        )}
        {notes.length > 0 && (
          <p className={clsx("mt-1.5 text-[12.5px] leading-[1.5]", blank && !row.optional ? "text-[#8a5a1f]" : "text-ops-muted")}>
            {notes.join(" ")}
          </p>
        )}
      </div>
      <div className="md:pt-1">
        {isChanged && (
          <Button size="sm" variant="ghost" className="text-ops-muted" onClick={onReset}>
            Undo
          </Button>
        )}
      </div>
    </li>
  );
}

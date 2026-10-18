"use client";

import clsx from "clsx";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { ActionResult } from "@/lib/types";
import { Card } from "./ops-shell";
import { ImageInput } from "./image-input";

export type FieldSpec<T> = {
  key: keyof T & string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "date" | "checkbox" | "multiselect" | "image";
  options?: { value: string; label: string }[];
  hint?: string;
  required?: boolean;
  span?: 1 | 2;
};

export function EntityEditor<T extends { id: string }>({
  items,
  fields,
  blank,
  title,
  subtitle,
  thumb,
  onSave,
  onRemove,
  addLabel = "Add",
  emptyText = "Nothing here yet.",
}: {
  items: T[];
  fields: FieldSpec<T>[];
  blank: () => T;
  title: (item: T) => string;
  subtitle?: (item: T) => string;
  thumb?: (item: T) => string | null;
  onSave: (item: T) => Promise<ActionResult<unknown>>;
  onRemove: (id: string) => Promise<ActionResult<unknown>>;
  addLabel?: string;
  emptyText?: string;
}) {
  const [editing, setEditing] = useState<T | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const isNew = editing ? !items.some((i) => i.id === editing.id) : false;

  async function remove(item: T) {
    if (!window.confirm(`Remove “${title(item) || "this item"}”? This can't be undone.`)) return;
    setRemoving(item.id);
    const result = await onRemove(item.id);
    setRemoving(null);
    if (result.ok && editing?.id === item.id) setEditing(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {editing && (
        <Card className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-ops-muted">{isNew ? "New" : "Edit"}</p>
          <EntityForm
            value={editing}
            fields={fields}
            onChange={setEditing}
            onSubmit={async () => {
              const result = await onSave(editing);
              if (result.ok) setEditing(null);
              return result;
            }}
            onCancel={() => setEditing(null)}
          />
        </Card>
      )}

      <Card>
        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-[14.5px] text-ops-muted">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-ops-line">
            {items.map((item) => {
              const t = thumb?.(item);
              return (
                <li key={item.id} className={clsx("flex items-center gap-4 px-5 py-3.5 transition-opacity", removing === item.id && "opacity-50")}>
                  {thumb && (
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-ops-bg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {t && <img src={t} alt="" className="h-full w-full object-cover" />}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-ops-ink">{title(item)}</p>
                    {subtitle && <p className="truncate text-[13px] text-ops-muted">{subtitle(item)}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Edit" onClick={() => setEditing({ ...item })} className="rounded-md p-2 text-ops-muted hover:bg-ops-bg hover:text-ops-ink">
                      <Pencil size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove"
                      disabled={removing === item.id}
                      onClick={() => void remove(item)}
                      className="rounded-md p-2 text-ops-muted hover:bg-ops-bg hover:text-[#9b2c2c]"
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {!editing && (
        <div>
          <Button size="sm" className="bg-ops-accent text-white hover:bg-black" onClick={() => setEditing(blank())}>
            {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function EntityForm<T extends object>({
  value,
  fields,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  value: T;
  fields: FieldSpec<T>[];
  onChange: (v: T) => void;
  onSubmit: () => Promise<ActionResult<unknown>>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const busy = saving || uploads > 0;

  function set<K extends keyof T>(key: K, v: T[K]) {
    onChange({ ...value, [key]: v });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    for (const f of fields) {
      const v = value[f.key] as unknown;
      if (f.required && (v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0))) {
        setError(`${f.label} is required.`);
        return;
      }
    }
    setError("");
    setSaving(true);
    const result = await onSubmit();
    setSaving(false);
    if (!result.ok) {
      const label = fields.find((f) => f.key === result.field)?.label;
      setError(label && !result.error.startsWith(label) ? `${label}: ${result.error}` : result.error);
    }
  }

  const trackUpload = (on: boolean) => setUploads((n) => Math.max(0, n + (on ? 1 : -1)));

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const id = `f-${f.key}`;
        const raw = value[f.key] as unknown;
        const wrap = (child: React.ReactNode) => (
          <Field key={f.key} label={f.label} htmlFor={id} hint={f.hint} className={clsx(f.span === 2 && "sm:col-span-2")}>
            {child}
          </Field>
        );
        switch (f.type) {
          case "textarea":
            return wrap(<Textarea id={id} value={(raw as string) ?? ""} onChange={(e) => set(f.key, e.target.value as T[typeof f.key])} />);
          case "number":
            return wrap(<NumberInput id={id} value={typeof raw === "number" ? raw : 0} onChange={(n) => set(f.key, n as T[typeof f.key])} />);
          case "date":
            return wrap(<Input id={id} type="date" value={(raw as string) ?? ""} onChange={(e) => set(f.key, e.target.value as T[typeof f.key])} />);
          case "select":
            return wrap(
              <Select id={id} value={String(raw ?? "")} onChange={(e) => set(f.key, (f.options?.find((o) => o.value === e.target.value)?.value ?? e.target.value) as T[typeof f.key])}>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>,
            );
          case "checkbox":
            return (
              <label key={f.key} className={clsx("flex items-center gap-3 self-end pb-2 text-[15px] text-ops-ink", f.span === 2 && "sm:col-span-2")}>
                <input type="checkbox" checked={Boolean(raw)} onChange={(e) => set(f.key, e.target.checked as T[typeof f.key])} className="h-4 w-4 accent-ops-accent" />
                {f.label}
              </label>
            );
          case "multiselect": {
            const selected = (raw as string[]) ?? [];
            return (
              <fieldset key={f.key} className={clsx("flex flex-col gap-2", f.span === 2 && "sm:col-span-2")}>
                <legend className="mb-1.5 text-[13px] font-medium text-ops-ink">{f.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {f.options?.map((o) => {
                    const on = selected.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set(f.key, (on ? selected.filter((x) => x !== o.value) : [...selected, o.value]) as T[typeof f.key])}
                        className={clsx(
                          "h-8 rounded-full border px-3 text-[13px] transition-colors",
                          on ? "border-ops-accent bg-ops-accent text-white" : "border-ops-line text-ops-ink hover:border-ops-accent",
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                {f.hint && <p className="text-[13px] text-ops-muted">{f.hint}</p>}
              </fieldset>
            );
          }
          case "image":
            return wrap(
              <ImageInput
                id={id}
                value={(raw as string | null) || null}
                onChange={(v) => set(f.key, (v ?? (f.required ? "" : null)) as T[typeof f.key])}
                onBusyChange={trackUpload}
              />,
            );
          default:
            return wrap(<Input id={id} value={(raw as string) ?? ""} onChange={(e) => set(f.key, e.target.value as T[typeof f.key])} />);
        }
      })}
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={busy} className="bg-ops-accent text-white hover:bg-black">
          {saving ? "Saving…" : uploads > 0 ? "Uploading photo…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
        )}
        {error && (
          <p role="alert" className="text-[13px] text-[#9b2c2c]">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

const formatNumber = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/** Keeps what was typed ("12.", "") while the parent holds a number, so decimals can be entered. */
function NumberInput({ id, value, onChange }: { id: string; value: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState(() => formatNumber(value));
  const shown = Number(draft || 0) === value ? draft : formatNumber(value);
  return (
    <Input
      id={id}
      inputMode="decimal"
      value={shown}
      onChange={(e) => {
        const text = e.target.value.replace(",", ".");
        const n = Number(text || 0);
        if (!Number.isFinite(n)) return;
        setDraft(text);
        onChange(n);
      }}
    />
  );
}

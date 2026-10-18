"use client";

import clsx from "clsx";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
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
  onSave: (item: T) => void;
  onRemove: (id: string) => void;
  addLabel?: string;
  emptyText?: string;
}) {
  const [editing, setEditing] = useState<T | null>(null);
  const isNew = editing ? !items.some((i) => i.id === editing.id) : false;

  return (
    <div className="flex flex-col gap-4">
      {editing && (
        <Card className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-ops-muted">{isNew ? "New" : "Edit"}</p>
          <EntityForm
            value={editing}
            fields={fields}
            onChange={setEditing}
            onSubmit={() => {
              onSave(editing);
              setEditing(null);
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
                <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
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
                    <button type="button" aria-label="Remove" onClick={() => onRemove(item.id)} className="rounded-md p-2 text-ops-muted hover:bg-ops-bg hover:text-[#9b2c2c]">
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
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [error, setError] = useState("");

  function set<K extends keyof T>(key: K, v: T[K]) {
    onChange({ ...value, [key]: v });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    for (const f of fields) {
      const v = value[f.key] as unknown;
      if (f.required && (v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0))) {
        setError(`${f.label} is required.`);
        return;
      }
    }
    setError("");
    onSubmit();
  }

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
            return wrap(
              <Input id={id} inputMode="decimal" value={raw === undefined || raw === null ? "" : String(raw)} onChange={(e) => set(f.key, (e.target.value === "" ? 0 : Number(e.target.value)) as T[typeof f.key])} />,
            );
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
            return wrap(<ImageInput id={id} value={(raw as string | null) ?? null} onChange={(v) => set(f.key, v as T[typeof f.key])} />);
          default:
            return wrap(<Input id={id} value={(raw as string) ?? ""} onChange={(e) => set(f.key, e.target.value as T[typeof f.key])} />);
        }
      })}
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" size="sm" className="bg-ops-accent text-white hover:bg-black">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {error && <p className="text-[13px] text-[#9b2c2c]">{error}</p>}
      </div>
    </form>
  );
}

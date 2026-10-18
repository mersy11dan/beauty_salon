"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { PAYMENT_METHODS } from "@/lib/format";
import { useOps } from "@/lib/ops-store";
import { useSalonToday } from "@/lib/store";
import type { PaymentMethod, PaymentStatus } from "@/lib/types";

export function PaymentForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: { amount?: number; label?: string; appointmentId?: string | null; date?: string };
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const addPayment = useOps((s) => s.addPayment);
  const today = useSalonToday();
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [status, setStatus] = useState<PaymentStatus>("paid");
  const [date, setDate] = useState(initial?.date ?? today);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter an amount above zero.");
      return;
    }
    if (!label.trim()) {
      setError("Add a short label so this line makes sense later.");
      return;
    }
    setError("");
    setBusy(true);
    const result = await addPayment({
      amount: Math.round(n * 100) / 100,
      label: label.trim(),
      method,
      status,
      date,
      appointmentId: initial?.appointmentId ?? null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone?.();
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_8rem_10rem_8rem_9rem]">
      <Field label="What for" htmlFor="pay-label" className="sm:col-span-2 lg:col-span-1">
        <Input id="pay-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Gel manicure · Mahlet Girma" />
      </Field>
      <Field label="Amount (Br)" htmlFor="pay-amount">
        <Input id="pay-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      </Field>
      <Field label="Method" htmlFor="pay-method">
        <Select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Status" htmlFor="pay-status">
        <Select id="pay-status" value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)}>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </Select>
      </Field>
      <Field label="Date" htmlFor="pay-date">
        <Input id="pay-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-5">
        <Button type="submit" size="sm" disabled={busy} className="bg-ops-accent text-white hover:bg-black">
          {busy ? "Saving…" : "Save payment"}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
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

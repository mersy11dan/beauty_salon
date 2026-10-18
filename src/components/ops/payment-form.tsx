"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { todayISO } from "@/lib/dates";
import { useSalonStore } from "@/lib/store";
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
  const addPayment = useSalonStore((s) => s.addPayment);
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [status, setStatus] = useState<PaymentStatus>("paid");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter an amount above zero.");
      return;
    }
    if (!label.trim()) {
      setError("Add a short label so this line makes sense later.");
      return;
    }
    addPayment({
      amount: Math.round(n * 100) / 100,
      label: label.trim(),
      method,
      status,
      date,
      appointmentId: initial?.appointmentId ?? null,
    });
    onDone?.();
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_8rem_8rem_8rem_9rem]">
      <Field label="What for" htmlFor="pay-label" className="sm:col-span-2 lg:col-span-1">
        <Input id="pay-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Gel manicure · Maya Chen" />
      </Field>
      <Field label="Amount" htmlFor="pay-amount">
        <Input id="pay-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      </Field>
      <Field label="Method" htmlFor="pay-method">
        <Select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="transfer">Transfer</option>
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
        <Button type="submit" size="sm" className="bg-ops-accent text-white hover:bg-black">
          Save payment
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

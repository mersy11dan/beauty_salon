"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { PaymentForm } from "@/components/ops/payment-form";
import { PaidBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateShort, isSameWeek } from "@/lib/dates";
import { formatMoney, METHOD_LABEL } from "@/lib/format";
import { useOps } from "@/lib/ops-store";
import { useSalonStore, useSalonToday } from "@/lib/store";

export default function LedgerPage() {
  const ledgerOn = useSalonStore((s) => s.settings.modules.ledger);
  const payments = useOps((s) => s.payments);
  const updatePayment = useOps((s) => s.updatePayment);
  const removePayment = useOps((s) => s.removePayment);
  const [adding, setAdding] = useState(false);
  const today = useSalonToday();

  const totals = useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid");
    return {
      today: paid.filter((p) => p.date === today).reduce((a, p) => a + p.amount, 0),
      week: paid.filter((p) => isSameWeek(p.date, today)).reduce((a, p) => a + p.amount, 0),
      unpaid: payments.filter((p) => p.status === "unpaid").reduce((a, p) => a + p.amount, 0),
    };
  }, [payments, today]);

  const sorted = useMemo(
    () => payments.slice().sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)),
    [payments],
  );

  if (!ledgerOn) {
    return (
      <>
        <OpsTitle title="Payments" />
        <p className="text-[14.5px] text-ops-muted">The payment ledger is switched off for this salon.</p>
      </>
    );
  }

  return (
    <>
      <OpsTitle
        title="Payments"
        intro="A simple record of what was paid and how: cash, telebirr, M-PESA or bank transfer. Nothing here moves money; it is the book you would otherwise keep on paper."
        action={
          !adding && (
            <Button size="sm" className="bg-ops-accent text-white hover:bg-black" onClick={() => setAdding(true)}>
              Add payment
            </Button>
          )
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Paid today" value={formatMoney(totals.today)} />
        <Stat label="Paid this week" value={formatMoney(totals.week)} />
        <Stat label="Outstanding" value={formatMoney(totals.unpaid)} tone={totals.unpaid > 0 ? "warn" : undefined} />
      </div>

      {adding && (
        <Card className="mb-6 p-5">
          <PaymentForm onDone={() => setAdding(false)} onCancel={() => setAdding(false)} />
        </Card>
      )}

      <Card>
        {sorted.length === 0 ? (
          <p className="px-5 py-10 text-center text-[14.5px] text-ops-muted">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-[12px] uppercase tracking-[0.06em] text-ops-muted">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">What for</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Method</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ops-line">
              {sorted.map((p) => (
                <tr key={p.id} className="align-middle">
                  <td className="tabular whitespace-nowrap px-5 py-3.5 text-ops-muted">{formatDateShort(p.date)}</td>
                  <td className="px-5 py-3.5 text-ops-ink">
                    {p.label}
                    <span className="block text-[12.5px] text-ops-muted sm:hidden">{METHOD_LABEL[p.method]}</span>
                  </td>
                  <td className="hidden px-5 py-3.5 text-ops-muted sm:table-cell">{METHOD_LABEL[p.method]}</td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => void updatePayment(p.id, { status: p.status === "paid" ? "unpaid" : "paid" })}
                      title="Toggle paid / unpaid"
                      className="rounded-full focus-visible:outline-2"
                    >
                      <PaidBadge status={p.status} />
                    </button>
                  </td>
                  <td className="tabular whitespace-nowrap px-5 py-3.5 text-right font-medium text-ops-ink">{formatMoney(p.amount)}</td>
                  <td className="px-2 py-3.5">
                    <button
                      type="button"
                      aria-label="Delete payment"
                      onClick={() => {
                        if (window.confirm(`Delete “${p.label}” (${formatMoney(p.amount)})? This can't be undone.`)) void removePayment(p.id);
                      }}
                      className="rounded-md p-1.5 text-ops-muted transition-colors hover:bg-ops-bg hover:text-[#9b2c2c]"
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-[12.5px] text-ops-muted">{label}</p>
      <p className={`tabular mt-1 text-[22px] font-semibold tracking-[-0.01em] ${tone === "warn" ? "text-[#8a2f1f]" : "text-ops-ink"}`}>{value}</p>
    </Card>
  );
}

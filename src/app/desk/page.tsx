"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { PaymentForm } from "@/components/ops/payment-form";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addDays, formatDateLong, formatDateShort, hhmmOf, minutesOf } from "@/lib/dates";
import { useOps } from "@/lib/ops-store";
import { formatPhone, telHref } from "@/lib/phone";
import { useMoney, useTime } from "@/lib/site-hooks";
import { useSalonStore, useSalonToday } from "@/lib/store";
import type { Appointment } from "@/lib/types";

export default function DeskPage() {
  const today = useSalonToday();
  const [date, setDate] = useState(today);
  const appointments = useOps((s) => s.appointments);
  const ensureDay = useOps((s) => s.ensureDay);
  const dayStatus = useOps((s) => (date < s.since ? (s.extraDays[date] ?? "loading") : "loaded"));

  useEffect(() => {
    void ensureDay(date);
  }, [date, ensureDay]);
  const requested = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "requested" && a.date >= today)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [appointments, today],
  );
  const day = useMemo(
    () => appointments.filter((a) => a.date === date).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, date],
  );

  return (
    <>
      <OpsTitle title="Appointments" intro="Confirm new requests, then work through the day. Guests are told we confirm by phone or text." />

      {requested.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-ops-muted">
            Waiting for confirmation · {requested.length}
          </h2>
          <Card>
            <ul className="divide-y divide-ops-line">
              {requested.map((a) => (
                <AppointmentRow key={a.id} apt={a} showDate />
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ops-muted">
            {date === today ? "Today" : formatDateLong(date)}
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))} className="rounded-md p-2 text-ops-muted hover:bg-ops-surface hover:text-ops-ink">
              <ChevronLeft size={18} strokeWidth={1.75} />
            </button>
            <button type="button" onClick={() => setDate(today)} className={clsx("rounded-md px-3 py-1.5 text-[13.5px]", date === today ? "text-ops-muted" : "text-ops-ink hover:bg-ops-surface")}>
              Today
            </button>
            <button type="button" aria-label="Next day" onClick={() => setDate(addDays(date, 1))} className="rounded-md p-2 text-ops-muted hover:bg-ops-surface hover:text-ops-ink">
              <ChevronRight size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <Card>
          {dayStatus === "loading" ? (
            <p className="px-5 py-10 text-center text-[14.5px] text-ops-muted" aria-busy>
              Loading {formatDateShort(date)}…
            </p>
          ) : dayStatus === "error" ? (
            <p className="px-5 py-10 text-center text-[14.5px] text-ops-muted">
              {formatDateShort(date)} couldn&apos;t be loaded.{" "}
              <button type="button" onClick={() => void ensureDay(date)} className="font-medium text-ops-ink underline underline-offset-2">
                Try again
              </button>
            </p>
          ) : day.length === 0 ? (
            <p className="px-5 py-10 text-center text-[14.5px] text-ops-muted">Nothing booked for {formatDateShort(date)}.</p>
          ) : (
            <ul className="divide-y divide-ops-line">
              {day.map((a) => (
                <AppointmentRow key={a.id} apt={a} />
              ))}
            </ul>
          )}
        </Card>
      </section>
    </>
  );
}

function AppointmentRow({ apt, showDate }: { apt: Appointment; showDate?: boolean }) {
  const service = useSalonStore((s) => s.services.find((x) => x.id === apt.serviceId));
  const who = useSalonStore((s) => s.staff.find((x) => x.id === apt.staffId));
  const ledgerOn = useSalonStore((s) => s.settings.modules.ledger);
  const paid = useOps((s) => s.payments.some((p) => p.appointmentId === apt.id));
  const setStatus = useOps((s) => s.setAppointmentStatus);
  const [paying, setPaying] = useState(false);
  const formatMoney = useMoney();
  const formatTime = useTime();

  const end = hhmmOf(minutesOf(apt.time) + apt.durationMin);
  const faded = apt.status === "cancelled";

  return (
    <li className={clsx("px-5 py-4", faded && "opacity-60")}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
        <div className="tabular w-40 shrink-0 text-[14px] text-ops-ink">
          {showDate && <div className="text-[12.5px] text-ops-muted">{formatDateShort(apt.date)}</div>}
          <span className="whitespace-nowrap">
            {formatTime(apt.time)} – {formatTime(end)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[15px] font-medium text-ops-ink">{apt.guestName}</p>
            <StatusBadge status={apt.status} />
            {paid && <span className="text-[12px] text-[#1f5c35]">Paid</span>}
          </div>
          <p className="mt-0.5 text-[13.5px] text-ops-muted">
            {service?.name ?? "Service removed"}
            {who ? ` · ${who.name}` : ""}
            {service ? ` · ${formatMoney(service.price)}` : ""}
            {" · "}
            <a href={telHref(apt.guestPhone)} className="tabular whitespace-nowrap hover:text-ops-ink">{formatPhone(apt.guestPhone)}</a>
          </p>
          {apt.note && <p className="mt-1.5 text-[13.5px] italic text-ops-muted">“{apt.note}”</p>}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
          {apt.status === "requested" && (
            <Button size="sm" className="bg-ops-accent text-white hover:bg-black" onClick={() => setStatus(apt.id, "confirmed")}>
              Confirm
            </Button>
          )}
          {apt.status === "confirmed" && (
            <Button size="sm" variant="secondary" onClick={() => setStatus(apt.id, "completed")}>
              Mark done
            </Button>
          )}
          {ledgerOn && (apt.status === "confirmed" || apt.status === "completed") && !paid && (
            <Button size="sm" variant="ghost" onClick={() => setPaying((v) => !v)}>
              Record payment
            </Button>
          )}
          {(apt.status === "requested" || apt.status === "confirmed") && (
            <Button size="sm" variant="ghost" className="text-ops-muted" onClick={() => setStatus(apt.id, "cancelled")}>
              Cancel
            </Button>
          )}
          {apt.status === "cancelled" && (
            <Button size="sm" variant="ghost" className="text-ops-muted" onClick={() => setStatus(apt.id, "requested")}>
              Restore
            </Button>
          )}
        </div>
      </div>
      {paying && (
        <div className="mt-4 rounded-lg bg-ops-bg p-4">
          <PaymentForm
            initial={{
              amount: service?.price,
              label: `${service?.name ?? "Service"} · ${apt.guestName}`,
              appointmentId: apt.id,
              date: apt.date,
            }}
            onDone={() => setPaying(false)}
            onCancel={() => setPaying(false)}
          />
        </div>
      )}
    </li>
  );
}

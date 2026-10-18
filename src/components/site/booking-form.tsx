"use client";

import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  formatDateLong,
  formatDateShort,
  formatDuration,
  formatTime,
  hhmmOf,
  minutesOf,
  todayISO,
} from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { availableSlots, upcomingOpenDates } from "@/lib/slots";
import { useSalonStore } from "@/lib/store";
import type { Appointment } from "@/lib/types";
import { groupByCategory } from "./service-list";

const ANYONE = "__anyone__";

function Step({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="hairline-t py-8 md:py-10">
      <div className="mb-5 flex items-baseline gap-3">
        <span className={clsx("tabular text-[13px]", done ? "text-accent" : "text-faint")}>{n}</span>
        <h2 className="font-display text-display-md text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Chip({
  selected,
  disabled,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        "h-10 rounded-full border px-4 text-[14px] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-35",
        selected ? "border-ink bg-ink text-bg" : "border-line-strong bg-transparent text-ink hover:border-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function BookingForm() {
  const params = useSearchParams();
  const settings = useSalonStore((s) => s.settings);
  const services = useSalonStore((s) => s.services);
  const staff = useSalonStore((s) => s.staff);
  const appointments = useSalonStore((s) => s.appointments);
  const createAppointment = useSalonStore((s) => s.createAppointment);

  const staffOn = settings.modules.staff && staff.length > 0;

  const [serviceId, setServiceId] = useState<string>(params.get("service") ?? "");
  const [rawStaffId, setStaffId] = useState<string>(params.get("staff") ?? ANYONE);
  const [rawDate, setDate] = useState<string>("");
  const [rawTime, setTime] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; time?: string }>({});
  const [done, setDone] = useState<Appointment | null>(null);

  const service = services.find((s) => s.id === serviceId) ?? null;

  const eligibleStaff = useMemo(
    () => (service ? staff.filter((m) => m.serviceIds.length === 0 || m.serviceIds.includes(service.id)) : staff),
    [service, staff],
  );

  // Derived rather than synced: a stale choice simply falls back.
  const staffId = rawStaffId !== ANYONE && !eligibleStaff.some((m) => m.id === rawStaffId) ? ANYONE : rawStaffId;

  const today = todayISO();
  const dates = useMemo(() => upcomingOpenDates(settings.hours, today, 10), [settings.hours, today]);
  const date = rawDate || dates[0] || "";

  const slots = useMemo(() => {
    if (!service || !date) return [];
    const now = new Date();
    const notBefore =
      date === today ? hhmmOf(Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30) : undefined;
    return availableSlots({
      date,
      durationMin: service.durationMin,
      hours: settings.hours,
      appointments,
      staffId: staffOn && staffId !== ANYONE ? staffId : null,
      staffPool: staffOn ? eligibleStaff.map((m) => m.id) : [],
      capacity: settings.capacity,
      notBefore,
    });
  }, [service, date, today, settings.hours, settings.capacity, appointments, staffOn, staffId, eligibleStaff]);

  const time = slots.includes(rawTime) ? rawTime : "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Add the name we should ask for.";
    if (phone.replace(/\D/g, "").length < 7) next.phone = "Add a phone number we can reach you on.";
    if (!time) next.time = "Pick a time.";
    setErrors(next);
    if (Object.keys(next).length || !service) return;

    const apt = createAppointment({
      guestName: name.trim(),
      guestPhone: phone.trim(),
      serviceId: service.id,
      staffId: staffOn && staffId !== ANYONE ? staffId : null,
      date,
      time,
      durationMin: service.durationMin,
      note: note.trim() || undefined,
    });
    setDone(apt);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (done && service) {
    const who = staff.find((m) => m.id === done.staffId);
    const end = hhmmOf(minutesOf(done.time) + done.durationMin);
    return (
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-10 md:pt-16">
        <div className="max-w-[60ch]">
          <h1 className="font-display text-display-xl text-balance text-ink">Requested. We will confirm shortly.</h1>
          <p className="mt-6 text-[16.5px] leading-[1.6] text-muted">
            Someone at the desk will text or call {done.guestPhone} to confirm. If you need to change anything before
            then, call {settings.contact.phone}.
          </p>
        </div>
        <dl className="mt-12 grid max-w-xl gap-y-4 text-[15.5px] sm:grid-cols-[9rem_1fr]">
          <dt className="text-muted">Service</dt>
          <dd className="text-ink">
            {service.name} · {formatDuration(service.durationMin)} · {formatMoney(service.price)}
          </dd>
          {who && (
            <>
              <dt className="text-muted">With</dt>
              <dd className="text-ink">{who.name}</dd>
            </>
          )}
          <dt className="text-muted">When</dt>
          <dd className="text-ink">
            {formatDateLong(done.date)}, {formatTime(done.time)} to {formatTime(end)}
          </dd>
          <dt className="text-muted">Where</dt>
          <dd className="text-ink">{settings.contact.address}</dd>
          <dt className="text-muted">Payment</dt>
          <dd className="text-ink">At the desk, after the appointment. Cash, card or transfer.</dd>
        </dl>
        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="secondary">
            Back to the homepage
          </ButtonLink>
          <Button
            variant="ghost"
            onClick={() => {
              setDone(null);
              setTime("");
              setName("");
              setPhone("");
              setNote("");
            }}
          >
            Book another
          </Button>
        </div>
      </div>
    );
  }

  const groups = groupByCategory(services);

  return (
    <form onSubmit={submit} noValidate className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <Step n={1} title="What would you like?" done={!!service}>
          <Field label="Service" htmlFor="service">
            <Select id="service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">Choose a service</option>
              {groups.map(([cat, list]) => (
                <optgroup key={cat} label={cat}>
                  {list.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {formatDuration(s.durationMin)} · {formatMoney(s.price)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          {service?.note && <p className="mt-3 text-[13.5px] text-muted">{service.note}</p>}
        </Step>

        {staffOn && (
          <Step n={2} title="With whom?" done={!!service}>
            <div className="flex flex-wrap gap-2">
              <Chip selected={staffId === ANYONE} onClick={() => setStaffId(ANYONE)}>
                Anyone available
              </Chip>
              {eligibleStaff.map((m) => (
                <Chip key={m.id} selected={staffId === m.id} onClick={() => setStaffId(m.id)}>
                  {m.name}
                </Chip>
              ))}
            </div>
            {service && eligibleStaff.length === 0 && (
              <p className="mt-3 text-[13.5px] text-muted">No one is assigned to this service yet. We will match you on the day.</p>
            )}
          </Step>
        )}

        <Step n={staffOn ? 3 : 2} title="When?" done={!!time}>
          <div className={clsx("flex flex-col gap-6", !service && "pointer-events-none opacity-45")}>
            <div>
              <p className="mb-3 text-[13px] font-medium text-ink">Day</p>
              <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6">
                {dates.map((d) => (
                  <Chip key={d} selected={date === d} onClick={() => setDate(d)} className="shrink-0">
                    {d === today ? "Today" : formatDateShort(d)}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-[13px] font-medium text-ink">Time</p>
              {service ? (
                slots.length ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {slots.map((t) => (
                      <Chip key={t} selected={time === t} onClick={() => setTime(t)} className="tabular w-full">
                        {formatTime(t)}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14.5px] text-muted">Nothing free on this day for {service.name.toLowerCase()}. Try another day.</p>
                )
              ) : (
                <p className="text-[14.5px] text-muted">Choose a service first.</p>
              )}
              {errors.time && <p className="mt-2 text-[13px] text-[#9b2c2c]">{errors.time}</p>}
            </div>
          </div>
        </Step>

        <Step n={staffOn ? 4 : 3} title="Your details">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={errors.name}>
              <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone} hint="We confirm by text or call.">
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Anything we should know" htmlFor="note" className="sm:col-span-2">
              <Textarea
                id="note"
                placeholder="Allergies, a reference photo you will bring, running late from work…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
          </div>
        </Step>
      </div>

      <aside className="lg:col-span-5">
        <div className="rounded-[16px] bg-surface p-7 shadow-[0_10px_30px_-18px_rgba(30,24,28,0.25)] lg:sticky lg:top-20">
          <h2 className="font-display text-display-md text-ink">Your booking</h2>
          <dl className="mt-6 flex flex-col gap-3.5 text-[15px]">
            <Row label="Service" value={service ? service.name : "—"} />
            <Row label="Takes" value={service ? formatDuration(service.durationMin) : "—"} />
            {staffOn && (
              <Row label="With" value={staffId === ANYONE ? "Anyone available" : staff.find((m) => m.id === staffId)?.name ?? "—"} />
            )}
            <Row label="When" value={time ? `${formatDateShort(date)}, ${formatTime(time)}` : date ? formatDateShort(date) : "—"} />
            <Row label="Price" value={service ? formatMoney(service.price) : "—"} strong />
          </dl>
          <p className="mt-5 text-[13px] leading-[1.55] text-muted">Pay at the desk. Nothing is charged online.</p>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={!service}>
            Request this time
          </Button>
        </div>
      </aside>
    </form>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="text-muted">{label}</dt>
      <dd className={clsx("text-right text-ink", strong && "font-semibold")}>{value}</dd>
    </div>
  );
}

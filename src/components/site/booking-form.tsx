"use client";

import clsx from "clsx";
import { Check, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { fill, type Copy } from "@/lib/copy";
import {
  formatDateLong,
  formatDateShort,
  formatDuration,
  fromISODate,
  hhmmOf,
  minutesOf,
  MONTHS_SHORT,
  todayISO,
  WEEKDAY_SHORT,
} from "@/lib/dates";
import { useCopy, useMoney, useTime } from "@/lib/site-hooks";
import { availableSlots, upcomingOpenDates } from "@/lib/slots";
import { useCustomer, useSalonStore } from "@/lib/store";
import type { Appointment } from "@/lib/types";
import { Avatar } from "./home-sections";
import { PageTitle } from "./section";
import { groupByCategory } from "./service-list";

const ANYONE = "__anyone__";

/** Minutes since midnight, end exclusive. */
const PERIODS: { label: keyof Copy; from: number; until: number }[] = [
  { label: "bookMorning", from: 0, until: 12 * 60 },
  { label: "bookAfternoon", from: 12 * 60, until: 17 * 60 },
  { label: "bookEvening", from: 17 * 60, until: 24 * 60 },
];

const LABEL = "text-[11.5px] font-semibold uppercase tracking-[0.22em]";

/** The radio itself is visually hidden, so its label carries the keyboard focus ring. */
const RING =
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent";

const PRESS =
  "transition-[background-color,border-color,color,transform] duration-300 ease-out-quart active:scale-[0.97]";

export function BookingIntro() {
  const copy = useCopy();
  return <PageTitle title={copy.bookTitle} intro={copy.bookIntro} />;
}

function Step({
  id,
  n,
  total,
  title,
  done,
  children,
}: {
  id: string;
  n: number;
  total: number;
  title: string;
  done?: boolean;
  children: ReactNode;
}) {
  const copy = useCopy();
  return (
    <Reveal y={16} amount={0.1}>
      <section aria-labelledby={`${id}-title`} className="hairline-t py-9 md:py-11">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className={clsx(LABEL, "mb-1.5 text-accent")}>{fill(copy.bookStep, { n, total })}</p>
            <h2 id={`${id}-title`} className="font-display text-display-md text-ink">
              {title}
              {done && <span className="sr-only"> (done)</span>}
            </h2>
          </div>
          <span
            aria-hidden
            className={clsx(
              "mb-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-[opacity,transform] duration-500 ease-out-expo",
              done ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          >
            <Check className="size-4" strokeWidth={2.25} />
          </span>
        </div>
        {children}
      </section>
    </Reveal>
  );
}

function Choice({
  name,
  value,
  checked,
  onChoose,
  className,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChoose: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={clsx("cursor-pointer select-none", RING, className)}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChoose} className="sr-only" />
      {children}
    </label>
  );
}

function RadioMark({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-300",
        checked ? "border-accent" : "border-line-strong",
        className,
      )}
    >
      <span
        className={clsx(
          "size-2.5 rounded-full bg-accent transition-transform duration-300 ease-out-expo",
          checked ? "scale-100" : "scale-0",
        )}
      />
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string | null | false }) {
  return (
    <div className="hairline-b flex items-baseline justify-between gap-6 py-3 text-[15px]">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={clsx("text-right", value ? "text-ink" : "text-faint")}>
        {value || (
          <>
            <span aria-hidden>—</span>
            <span className="sr-only">Not chosen yet</span>
          </>
        )}
      </dd>
    </div>
  );
}

type Errors = { name?: string; phone?: string; time?: string };

const phoneOk = (v: string) => v.replace(/\D/g, "").length >= 7;

export function BookingForm() {
  const params = useSearchParams();
  const settings = useSalonStore((s) => s.settings);
  const services = useSalonStore((s) => s.services);
  const staff = useSalonStore((s) => s.staff);
  const appointments = useSalonStore((s) => s.appointments);
  const createAppointment = useSalonStore((s) => s.createAppointment);
  const customer = useCustomer();
  const signOutCustomer = useSalonStore((s) => s.signOutCustomer);
  const copy = useCopy();
  const formatMoney = useMoney();
  const formatTime = useTime();

  const staffOn = settings.modules.staff && staff.length > 0;

  const [serviceId, setServiceId] = useState<string>(params.get("service") ?? "");
  const [rawStaffId, setStaffId] = useState<string>(params.get("staff") ?? ANYONE);
  const [rawCategory, setCategory] = useState<string | null>(null);
  const [rawDate, setDate] = useState<string>("");
  const [rawTime, setTime] = useState<string>("");
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<Appointment | null>(null);
  const [sending, setSending] = useState(false);

  const timeRef = useRef<HTMLFieldSetElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const groups = useMemo(() => groupByCategory(services), [services]);

  // Open on the category that matches what the visitor arrived with.
  const arrivedWith = staff.find((m) => m.id === params.get("staff"));
  const suggestedCategory =
    service?.category ?? services.find((s) => arrivedWith?.serviceIds.includes(s.id))?.category;
  const category =
    rawCategory && groups.some(([c]) => c === rawCategory) ? rawCategory : (suggestedCategory ?? groups[0]?.[0] ?? "");
  const visibleServices = groups.find(([c]) => c === category)?.[1] ?? [];

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

  const periods = useMemo(
    () =>
      PERIODS.map((p) => ({
        label: copy[p.label],
        slots: slots.filter((t) => minutesOf(t) >= p.from && minutesOf(t) < p.until),
      })).filter((p) => p.slots.length > 0),
    [slots, copy],
  );

  useEffect(() => {
    if (done) doneRef.current?.focus({ preventScroll: true });
  }, [done]);

  const clearError = (key: keyof Errors) => setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  function focusInvalid(el: HTMLElement | null) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    const next: Errors = {};
    if (!time) next.time = copy.bookErrTime;
    if (!name.trim()) next.name = copy.bookErrName;
    if (!phoneOk(phone)) next.phone = copy.bookErrPhone;
    setErrors(next);
    if (next.time) return focusInvalid(timeRef.current);
    if (next.name) return focusInvalid(nameRef.current);
    if (next.phone) return focusInvalid(phoneRef.current);
    if (!service) return;

    setSending(true);
    const r = await createAppointment({
      customerId: customer?.id,
      guestName: name.trim(),
      guestPhone: phone.trim(),
      serviceId: service.id,
      staffId: staffOn && staffId !== ANYONE ? staffId : null,
      date,
      time,
      durationMin: service.durationMin,
      note: note.trim() || undefined,
    });
    setSending(false);
    if (r.ok) {
      setDone(r.appointment);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // "auth" clears the guest, and the account gate around this form takes over.
    if (r.error === "auth") return;
    if (r.error === "taken") setTime("");
    setErrors({ time: r.error === "taken" ? copy.bookTaken : fill(copy.bookFailed, { phone: settings.contact.phone }) });
    focusInvalid(timeRef.current);
  }

  if (done && service) {
    const who = staff.find((m) => m.id === done.staffId);
    const end = hhmmOf(minutesOf(done.time) + done.durationMin);
    const tel = settings.contact.phone.replace(/[^+\d]/g, "");
    return (
      <div ref={doneRef} tabIndex={-1} className="focus:outline-none">
        <PageTitle
          label={copy.doneLabel}
          title={fill(copy.doneTitle, { name: done.guestName.split(/\s+/)[0] })}
          intro={copy.doneIntro ? fill(copy.doneIntro, { phone: done.guestPhone, salonPhone: settings.contact.phone }) : undefined}
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 md:pb-28 lg:grid-cols-12 lg:gap-16">
          <Reveal y={16} className="lg:col-span-7">
            <div className="rounded-[18px] border border-line bg-surface p-7 md:p-9">
              <p className={clsx(LABEL, "text-accent")}>{copy.doneVisit}</p>
              <p className="mt-3 font-display text-display-md text-balance text-ink">{formatDateLong(done.date)}</p>
              <p className="tabular mt-1.5 text-[16px] text-muted">
                {fill(copy.doneTimeRange, { start: formatTime(done.time), end: formatTime(end) })}
              </p>
              <dl className="hairline-t mt-7">
                <SummaryRow label={copy.bookRowService} value={service.name} />
                <SummaryRow label={copy.bookRowTakes} value={formatDuration(service.durationMin)} />
                {staffOn && <SummaryRow label={copy.bookRowWith} value={who ? who.name : copy.doneAnyone} />}
                <SummaryRow label={copy.bookRowPrice} value={formatMoney(service.price)} />
              </dl>
              {copy.donePayment && <p className="mt-5 text-[13.5px] leading-[1.55] text-muted">{copy.donePayment}</p>}
            </div>
          </Reveal>

          <Reveal y={16} delay={0.1} className="lg:col-span-5">
            <p className={clsx(LABEL, "mb-3 text-accent")}>{copy.doneFindUs}</p>
            <address className="flex flex-col gap-4 not-italic">
              <p className="text-[17px] leading-[1.5] text-ink">{settings.contact.address}</p>
              <p className="flex flex-col gap-1 text-[15.5px] text-muted">
                {settings.contact.phone && (
                  <a href={`tel:${tel}`} className="w-fit hover:text-ink">
                    {settings.contact.phone}
                  </a>
                )}
                {settings.contact.email && (
                  <a href={`mailto:${settings.contact.email}`} className="w-fit hover:text-ink">
                    {settings.contact.email}
                  </a>
                )}
              </p>
              {settings.contact.mapUrl && (
                <a
                  href={settings.contact.mapUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink"
                >
                  {copy.homeVisitMaps}
                  <span aria-hidden className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                    →
                  </span>
                </a>
              )}
            </address>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink href="/" variant="secondary">
                {copy.doneHome}
              </ButtonLink>
              <Button
                variant="ghost"
                onClick={() => {
                  setDone(null);
                  setTime("");
                  setName(customer?.name ?? "");
                  setPhone(customer?.phone ?? "");
                  setNote("");
                  setErrors({});
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {copy.doneAnother}
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    );
  }

  const total = staffOn ? 4 : 3;
  const detailsDone = !!name.trim() && phoneOk(phone);
  const end = service && time ? hhmmOf(minutesOf(time) + service.durationMin) : "";
  const staffName = staffId === ANYONE ? copy.bookAnyoneNote : staff.find((m) => m.id === staffId)?.name;
  const hint = !service
    ? copy.bookHintService
    : !time
      ? copy.bookHintTime
      : !detailsDone
        ? copy.bookHintDetails
        : copy.bookHintReady;

  return (
    <>
      <BookingIntro />
      <form onSubmit={submit} noValidate className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 md:pb-28 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Step id="service" n={1} total={total} title={copy.bookStepService} done={!!service}>
            {groups.length > 1 && (
              <div role="group" aria-label="Filter services by category" className="mb-3 flex flex-wrap gap-x-7">
                {groups.map(([cat]) => {
                  const on = cat === category;
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setCategory(cat)}
                      className={clsx(
                        LABEL,
                        "relative cursor-pointer rounded-sm py-2.5 transition-colors duration-500",
                        on ? "text-accent" : "text-muted hover:text-ink",
                      )}
                    >
                      {cat}
                      <span
                        aria-hidden
                        className={clsx(
                          "absolute inset-x-0 bottom-1.5 h-px origin-left bg-accent transition-transform duration-700 ease-out-expo",
                          on ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            )}
            <fieldset>
              <legend className="sr-only">{groups.length > 1 ? `${category} services` : "Services"}</legend>
              <div className="hairline-t">
                {visibleServices.map((s) => {
                  const on = s.id === serviceId;
                  return (
                    <Choice
                      key={s.id}
                      name="service"
                      value={s.id}
                      checked={on}
                      onChoose={() => setServiceId(s.id)}
                      className={clsx(
                        "hairline-b -mx-3 flex items-start gap-4 rounded-md px-3 py-4 transition-colors duration-300",
                        on ? "bg-soft" : "hover:bg-soft",
                      )}
                    >
                      <RadioMark checked={on} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] leading-6 text-ink">{s.name}</span>
                        <span className={clsx("mt-0.5 block text-[13.5px] text-muted", !s.note && "sm:hidden")}>
                          <span className="sm:hidden">
                            {formatDuration(s.durationMin)}
                            {s.note && " · "}
                          </span>
                          {s.note}
                        </span>
                      </span>
                      <span className="tabular hidden w-20 shrink-0 text-right text-[13.5px] leading-6 text-muted sm:block">
                        {formatDuration(s.durationMin)}
                      </span>
                      <span className="tabular w-16 shrink-0 text-right text-[16px] leading-6 text-ink">
                        {formatMoney(s.price)}
                      </span>
                    </Choice>
                  );
                })}
              </div>
            </fieldset>
            {services.length === 0 && (
              <p className="text-[14.5px] text-muted">{copy.bookNoServices}</p>
            )}
          </Step>

          {staffOn && (
            <Step id="staff" n={2} total={total} title={copy.bookStepStaff} done={!!service}>
              <fieldset>
                <legend className="sr-only">Who you would like to see</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[{ id: ANYONE, name: copy.bookAnyone, role: copy.bookAnyoneNote, photo: null }, ...eligibleStaff].map(
                    (m) => {
                      const on = staffId === m.id;
                      return (
                        <Choice
                          key={m.id}
                          name="staff"
                          value={m.id}
                          checked={on}
                          onChoose={() => setStaffId(m.id)}
                          className={clsx(
                            "flex items-center gap-3.5 rounded-[14px] border p-3.5 pr-4",
                            PRESS,
                            on ? "border-accent bg-soft" : "border-line bg-surface hover:border-line-strong",
                          )}
                        >
                          {m.id === ANYONE ? (
                            <span
                              aria-hidden
                              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent"
                            >
                              <Users className="size-[18px]" strokeWidth={1.75} />
                            </span>
                          ) : (
                            <Avatar name={m.name} photo={m.photo} size={44} />
                          )}
                          <span className="flex min-w-0 flex-1 flex-col leading-tight">
                            <span className="text-[15px] text-ink">{m.name}</span>
                            <span className="mt-1 text-[12.5px] text-muted">{m.role}</span>
                          </span>
                          <RadioMark checked={on} />
                        </Choice>
                      );
                    },
                  )}
                </div>
              </fieldset>
              {service && eligibleStaff.length === 0 && (
                <p className="mt-3 text-[13.5px] text-muted">{copy.bookNoStaff}</p>
              )}
            </Step>
          )}

          <Step id="when" n={staffOn ? 3 : 2} total={total} title={copy.bookStepWhen} done={!!time}>
            <div className="flex flex-col gap-8">
              <fieldset>
                <legend className={clsx(LABEL, "mb-3 text-muted")}>{copy.bookDay}</legend>
                {dates.length ? (
                  <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                    {dates.map((d) => {
                      const on = d === date;
                      const dt = fromISODate(d);
                      return (
                        <Choice
                          key={d}
                          name="date"
                          value={d}
                          checked={on}
                          onChoose={() => setDate(d)}
                          className={clsx(
                            "flex flex-col items-center rounded-[14px] border px-1 py-3",
                            PRESS,
                            on
                              ? "border-accent bg-accent text-accent-ink"
                              : "border-line bg-surface text-ink hover:border-line-strong",
                          )}
                        >
                          <span
                            className={clsx(
                              "text-[10.5px] font-semibold uppercase tracking-[0.16em]",
                              on ? "text-accent-ink/80" : "text-muted",
                            )}
                          >
                            {d === today ? copy.bookToday : WEEKDAY_SHORT[dt.getDay()]}
                          </span>
                          <span className="font-display mt-1.5 text-[length:calc(1.65rem*var(--display-scale))] leading-none">{dt.getDate()}</span>
                          <span className={clsx("mt-1 text-[12px]", on ? "text-accent-ink/80" : "text-muted")}>
                            {MONTHS_SHORT[dt.getMonth()]}
                          </span>
                        </Choice>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[14.5px] text-muted">{fill(copy.bookNoDays, { phone: settings.contact.phone })}</p>
                )}
              </fieldset>

              <fieldset
                ref={timeRef}
                tabIndex={-1}
                aria-describedby={errors.time ? "time-error" : undefined}
                className="focus:outline-none"
              >
                <legend className={clsx(LABEL, "mb-3 text-muted")}>{copy.bookTime}</legend>
                {!service ? (
                  <p className="text-[14.5px] text-muted">{copy.bookPickServiceFirst}</p>
                ) : periods.length === 0 ? (
                  <p className="text-[14.5px] text-muted">
                    {fill(copy.bookNothingFree, { date: formatDateShort(date), service: service.name.toLowerCase() })}
                  </p>
                ) : (
                  <div className="flex flex-col gap-5">
                    {periods.map((p) => (
                      <div key={p.label}>
                        <p className="mb-2.5 text-[13px] text-muted">{p.label}</p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                          {p.slots.map((t) => {
                            const on = t === time;
                            return (
                              <Choice
                                key={t}
                                name="time"
                                value={t}
                                checked={on}
                                onChoose={() => {
                                  setTime(t);
                                  clearError("time");
                                }}
                                className={clsx(
                                  "tabular flex h-11 items-center justify-center rounded-full border text-[14px]",
                                  PRESS,
                                  on
                                    ? "border-accent bg-accent text-accent-ink"
                                    : "border-line-strong text-ink hover:border-ink",
                                )}
                              >
                                {formatTime(t)}
                              </Choice>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.time && (
                  <p id="time-error" className="mt-3 text-[13px] text-[#9b2c2c]">
                    {errors.time}
                  </p>
                )}
              </fieldset>
            </div>
          </Step>

          <Step id="details" n={total} total={total} title={copy.bookStepDetails} done={detailsDone}>
            {customer && (
              <p className="mb-5 text-[14px] text-muted">
                {fill(copy.bookSignedIn, { email: customer.email })}{" "}
                <button
                  type="button"
                  onClick={signOutCustomer}
                  className="cursor-pointer font-medium text-accent hover:text-accent-hover"
                >
                  {copy.bookSignOut}
                </button>
              </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={copy.bookName} htmlFor="name" error={errors.name}>
                <Input
                  ref={nameRef}
                  id="name"
                  autoComplete="name"
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) clearError("name");
                  }}
                />
              </Field>
              <Field label={copy.bookPhone} htmlFor="phone" error={errors.phone} hint={copy.bookPhoneHint || undefined}>
                <Input
                  ref={phoneRef}
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : copy.bookPhoneHint ? "phone-hint" : undefined}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneOk(e.target.value)) clearError("phone");
                  }}
                />
              </Field>
              <Field label={copy.bookNote} htmlFor="note" className="sm:col-span-2">
                <Textarea
                  id="note"
                  placeholder={copy.bookNotePlaceholder}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
            </div>
          </Step>
        </div>

        <aside className="lg:col-span-5">
          <Reveal y={16} delay={0.1} amount={0} className="lg:sticky lg:top-20">
            <div className="rounded-[18px] border border-line bg-surface p-7 md:p-8">
              {copy.bookSummaryLabel && <p className={clsx(LABEL, "text-accent")}>{copy.bookSummaryLabel}</p>}
              <h2 className="font-script mt-1 text-script-md text-ink">{copy.bookSummaryTitle}</h2>
              <dl className="hairline-t mt-5">
                <SummaryRow label={copy.bookRowService} value={service?.name} />
                <SummaryRow label={copy.bookRowTakes} value={service && formatDuration(service.durationMin)} />
                {staffOn && <SummaryRow label={copy.bookRowWith} value={staffName} />}
                <SummaryRow label={copy.bookRowDay} value={date && (date === today ? copy.bookToday : formatDateShort(date))} />
                <SummaryRow label={copy.bookRowTime} value={time && `${formatTime(time)} – ${formatTime(end)}`} />
              </dl>
              <div className="mt-6 flex items-baseline justify-between gap-6">
                <p className="text-[14px] text-muted">{copy.bookToPay}</p>
                <p className="tabular font-display text-[length:calc(2.1rem*var(--display-scale))] leading-none text-ink">
                  {service ? formatMoney(service.price) : "—"}
                </p>
              </div>
              <Button type="submit" size="lg" className="mt-7 w-full" disabled={!service || sending} aria-busy={sending}>
                {sending ? copy.bookSending : copy.bookSubmit}
              </Button>
              <p aria-live="polite" className="mt-3.5 text-center text-[13px] leading-[1.55] text-muted">
                {hint}
              </p>
            </div>
          </Reveal>
        </aside>
      </form>
    </>
  );
}

"use client";

import clsx from "clsx";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { BUILDER_PHASES, builderSteps, type BuilderStep, type SiteMode } from "@/lib/builder";
import { pickContent, seedContent } from "@/lib/content";
import { useOps } from "@/lib/ops-store";
import { useSalonStore, useSalonToday } from "@/lib/store";

/** The admin home: the steps that turn the sample salon into a client's site, and how far along each is. */
export function SiteBuilder({ staffLogin }: { staffLogin: boolean }) {
  const mode: SiteMode = useSalonStore((s) => s.demoMode) ? "demo" : "live";
  const name = useSalonStore((s) => s.settings.name);
  const settings = useSalonStore((s) => s.settings);
  const services = useSalonStore((s) => s.services);
  const staff = useSalonStore((s) => s.staff);
  const portfolio = useSalonStore((s) => s.portfolio);
  const reviews = useSalonStore((s) => s.reviews);
  const offers = useSalonStore((s) => s.offers);
  const appointments = useOps((s) => s.appointments);
  const live = mode === "live";

  const seed = useMemo(() => seedContent(), []);
  const steps = useMemo(
    () => builderSteps(pickContent({ settings, services, staff, portfolio, reviews, offers }), seed, { mode, staffLogin }),
    [settings, services, staff, portfolio, reviews, offers, seed, mode, staffLogin],
  );

  const counted = steps.filter((s) => s.applies && !s.optional);
  const doneCount = counted.filter((s) => s.done).length;
  const next = counted.find((s) => !s.done);
  const pct = counted.length ? Math.round((doneCount / counted.length) * 100) : 0;

  const today = useSalonToday();
  const waiting = appointments.filter((a) => a.status === "requested" && a.date >= today).length;
  const booked = appointments.filter((a) => a.date === today && a.status !== "cancelled").length;

  return (
    <>
      <OpsTitle
        title="Site builder"
        intro={
          live
            ? `This is ${name}'s own website. Work through the steps below; every edit goes public as soon as the badge says saved.`
            : "Turn this demo into a client's website in three stages. Each step shows whether you have changed it from the sample salon yet."
        }
      />

      <Card className="mb-8 overflow-hidden">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ops-muted">
              {doneCount === counted.length ? "Every step is done" : `${doneCount} of ${counted.length} steps done`}
            </p>
            <div
              role="progressbar"
              aria-label="Site builder progress"
              aria-valuemin={0}
              aria-valuemax={counted.length}
              aria-valuenow={doneCount}
              className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-ops-bg md:w-80"
            >
              <div className="h-full rounded-full bg-ops-accent transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {next ? (
            <Link
              href={next.href}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-ops-accent px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-black md:self-auto"
            >
              Next: {next.title}
              <ArrowRight size={16} strokeWidth={1.75} />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[#1f5c35]">
              <Check size={16} strokeWidth={2} /> Ready to hand over
            </span>
          )}
        </div>
        <div className={clsx("border-t border-ops-line px-5 py-3.5 text-[13.5px] md:px-6", live ? "bg-[#f1f8f2] text-[#1f5130]" : "bg-ops-bg text-ops-muted")}>
          {live ? (
            <>This website has its own database. Bookings, payments and guest accounts here belong to this client only.</>
          ) : (
            <>
              You are editing the <strong className="font-medium text-ops-ink">demo</strong>. Visitors to this demo see every change, but no client
              does until you launch the site on their own deployment. Save a site file from{" "}
              <Link href="/admin/launch" className="font-medium text-ops-ink underline underline-offset-2">
                Launch
              </Link>{" "}
              to keep a copy of each client&apos;s site.
            </>
          )}
        </div>
      </Card>

      <ol className="flex flex-col gap-8">
        {BUILDER_PHASES.map((phase, pi) => {
          const items = steps.filter((s) => s.phase === phase.id && (s.applies || s.id !== "access"));
          return (
            <li key={phase.id}>
              <div className="mb-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ops-muted">Stage {pi + 1}</p>
                <h2 className="mt-0.5 text-[18px] font-semibold tracking-[-0.01em] text-ops-ink">{phase.title}</h2>
                <p className="mt-0.5 text-[13.5px] text-ops-muted">{phase.blurb}</p>
              </div>
              <Card>
                <ul className="divide-y divide-ops-line">
                  {items.map((step) => (
                    <StepRow key={step.id} step={step} n={steps.indexOf(step) + 1} isNext={step === next} />
                  ))}
                </ul>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Stat label="Booked today" value={String(booked)} href="/desk" />
        <Stat label="Waiting for confirmation" value={String(waiting)} href="/desk" />
      </div>
    </>
  );
}

function StepRow({ step, n, isNext }: { step: BuilderStep; n: number; isNext: boolean }) {
  const setMark = useSalonStore((s) => s.updateSettings);
  const checklist = useSalonStore((s) => s.settings.checklist);
  const toggle = () => setMark({ checklist: { ...checklist, [step.id]: !step.marked } });

  const status = !step.applies
    ? "Page switched off"
    : step.changed
      ? "Changed"
      : step.marked
        ? "Marked done"
        : step.optional
          ? "Optional"
          : "Still the sample";

  return (
    <li className={clsx("flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-5", !step.applies && "opacity-55", isNext && "bg-ops-bg/60")}>
      <span
        aria-hidden
        className={clsx(
          "grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold",
          step.done ? "bg-ops-accent text-white" : "border border-ops-line text-ops-muted",
        )}
      >
        {step.done ? <Check size={15} strokeWidth={2.25} /> : n}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Link href={step.href} className="text-[15px] font-medium text-ops-ink hover:underline hover:underline-offset-2">
            {step.title}
          </Link>
          <span
            className={clsx(
              "rounded-full px-2 py-px text-[11.5px]",
              step.done ? "bg-[#e3f1e6] text-[#1f5130]" : "bg-ops-bg text-ops-muted ring-1 ring-ops-line",
            )}
          >
            <span className="sr-only">Status: </span>
            {status}
          </span>
        </div>
        <p className="mt-0.5 text-[13.5px] text-ops-muted">{step.blurb}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:justify-end">
        {step.applies && !step.changed && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={step.marked}
            className="rounded-full px-3 py-1.5 text-[13px] text-ops-muted transition-colors hover:bg-ops-bg hover:text-ops-ink"
          >
            {step.marked ? "Undo" : "Mark done"}
          </button>
        )}
        <Link
          href={step.href}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
            isNext ? "bg-ops-accent text-white hover:bg-black" : "border border-ops-line text-ops-ink hover:border-ops-ink",
          )}
        >
          Open <ArrowRight size={14} strokeWidth={1.75} />
        </Link>
      </div>
    </li>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="px-5 py-4 transition-colors hover:border-ops-accent/40">
        <p className="text-[12.5px] text-ops-muted">{label}</p>
        <p className="tabular mt-1 text-[22px] font-semibold tracking-[-0.01em] text-ops-ink">{value}</p>
      </Card>
    </Link>
  );
}

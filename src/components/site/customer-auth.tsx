"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useHydrated } from "@/lib/hydration";
import { DEMO_CUSTOMER } from "@/lib/seed";
import { useCustomer, useSalonStore } from "@/lib/store";
import { PageTitle } from "./section";

type Mode = "sign-in" | "create";

type Errors = { name?: string; phone?: string; email?: string; password?: string };

/** Same-site paths only, so `?next=` can't send anyone to another origin or a `javascript:` URL. */
function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/book";
  return raw;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CustomerAuth() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const customer = useCustomer();
  const signInCustomer = useSalonStore((s) => s.signInCustomer);
  const createCustomer = useSalonStore((s) => s.createCustomer);

  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>(params.get("mode") === "create" ? "create" : "sign-in");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (hydrated && customer) router.replace(next);
  }, [hydrated, customer, router, next]);

  if (!hydrated || customer) return <div className="min-h-[60vh]" aria-busy />;

  function switchTo(m: Mode) {
    setMode(m);
    setErrors({});
    setPassword("");
  }

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!signInCustomer(email, password)) {
      setErrors({ password: "That email and password do not match." });
    }
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (!name.trim()) found.name = "Add the name we should ask for.";
    if (phone.replace(/\D/g, "").length < 7) found.phone = "Add a phone number we can reach you on.";
    if (!EMAIL_RE.test(email.trim())) found.email = "Add an email address, like name@example.com.";
    if (password.length < 6) found.password = "Use at least 6 characters.";
    setErrors(found);
    if (Object.keys(found).length) return;
    if (!createCustomer({ name, phone, email, password })) {
      setErrors({ email: "There is already an account with this email. Sign in instead." });
    }
  }

  return (
    <>
      <PageTitle
        title="Before you book"
        intro="Sign in, or create an account if it is your first time. We keep your details so the next booking takes seconds."
      />
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="max-w-md rounded-[16px] bg-surface p-7 shadow-[0_10px_30px_-18px_rgba(30,24,28,0.25)] md:p-8">
          <div role="group" aria-label="Account" className="grid grid-cols-2 gap-1 rounded-full border border-line-strong p-1">
            {(
              [
                ["sign-in", "Sign in"],
                ["create", "Create account"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => switchTo(m)}
                className={clsx(
                  "h-10 rounded-full text-[14px] font-medium transition-colors duration-300",
                  mode === m ? "bg-ink text-bg" : "text-ink/70 hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "sign-in" ? (
            <form onSubmit={signIn} noValidate className="mt-7 flex flex-col gap-5">
              <Field label="Email" htmlFor="signin-email">
                <Input id="signin-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Password" htmlFor="signin-password" error={errors.password}>
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" size="lg" className="mt-1 w-full">
                Sign in and continue
              </Button>
              <p className="text-center text-[14px] text-muted">
                First time here?{" "}
                <button type="button" onClick={() => switchTo("create")} className="font-medium text-accent hover:text-accent-hover">
                  Create an account
                </button>
              </p>
              <div className="hairline-t pt-5 text-[13px] text-muted">
                <p>
                  Demo guest:{" "}
                  <button
                    type="button"
                    className="text-ink hover:text-accent"
                    onClick={() => {
                      setEmail(DEMO_CUSTOMER.email);
                      setPassword(DEMO_CUSTOMER.password);
                    }}
                  >
                    {DEMO_CUSTOMER.email} · {DEMO_CUSTOMER.password}
                  </button>
                </p>
                <p className="mt-1">Select it to fill the form.</p>
              </div>
            </form>
          ) : (
            <form onSubmit={create} noValidate className="mt-7 flex flex-col gap-5">
              <Field label="Name" htmlFor="create-name" error={errors.name}>
                <Input id="create-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Phone" htmlFor="create-phone" error={errors.phone} hint="We confirm bookings by text or call.">
                <Input
                  id="create-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
              <Field label="Email" htmlFor="create-email" error={errors.email}>
                <Input id="create-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Password" htmlFor="create-password" error={errors.password} hint="At least 6 characters.">
                <Input
                  id="create-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" size="lg" className="mt-1 w-full">
                Create account and continue
              </Button>
              <p className="text-center text-[14px] text-muted">
                Already have an account?{" "}
                <button type="button" onClick={() => switchTo("sign-in")} className="font-medium text-accent hover:text-accent-hover">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
        <p className="mt-6 text-[13px] text-muted">
          Work at the salon?{" "}
          <Link href="/login" className="text-ink hover:text-accent">
            Staff sign in
          </Link>
        </p>
      </div>
    </>
  );
}

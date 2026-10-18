"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { DEMO_CUSTOMER } from "@/lib/demo";
import { safeNext } from "@/lib/format";
import { useCustomer, useSalonStore } from "@/lib/store";
import { PageTitle } from "./section";

type Mode = "sign-in" | "create";

type Errors = { name?: string; phone?: string; email?: string; password?: string };

const PASSWORD_MIN = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Links an input to the `${id}-error` / `${id}-hint` text that `Field` renders. */
function fieldAria(id: string, error?: string, hasHint = false) {
  return {
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  };
}

const TEXT_BUTTON = "cursor-pointer font-medium text-accent hover:text-accent-hover";

export function CustomerAuth() {
  const router = useRouter();
  const params = useSearchParams();
  const customer = useCustomer();
  const demoMode = useSalonStore((s) => s.demoMode);
  const signInCustomer = useSalonStore((s) => s.signInCustomer);
  const signUpCustomer = useSalonStore((s) => s.signUpCustomer);

  const next = safeNext(params.get("next"), "/book");
  const [mode, setMode] = useState<Mode>(params.get("mode") === "create" ? "create" : "sign-in");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (customer) router.replace(next);
  }, [customer, router, next]);

  if (customer) return <div className="min-h-[60vh]" aria-busy />;

  function switchTo(m: Mode) {
    setMode(m);
    setErrors({});
    setPassword("");
  }

  /** Server errors name the field they belong to; anything else shows under the password. */
  function showServerError(error: string, field?: string) {
    const key: keyof Errors = field === "name" || field === "phone" || field === "email" ? field : "password";
    setErrors({ [key]: error });
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setErrors({ password: "Enter your email and password." });
      return;
    }
    setBusy(true);
    setErrors({});
    const result = await signInCustomer(email, password);
    setBusy(false);
    if (!result.ok) showServerError(result.error, result.field);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const found: Errors = {};
    if (!name.trim()) found.name = "Add the name we should ask for.";
    if (phone.replace(/\D/g, "").length < 7) found.phone = "Add a phone number we can reach you on.";
    if (!EMAIL_RE.test(email.trim())) found.email = "Add an email address, like name@example.com.";
    if (password.length < PASSWORD_MIN) found.password = `Use at least ${PASSWORD_MIN} characters.`;
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const result = await signUpCustomer({ name, phone, email, password });
    setBusy(false);
    if (!result.ok) showServerError(result.error, result.field);
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
                  "h-10 cursor-pointer rounded-full text-[14px] font-medium transition-colors duration-300",
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
                  {...fieldAria("signin-password", errors.password)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" size="lg" className="mt-1 w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in and continue"}
              </Button>
              <p className="text-center text-[14px] text-muted">
                First time here?{" "}
                <button type="button" onClick={() => switchTo("create")} className={TEXT_BUTTON}>
                  Create an account
                </button>
              </p>
              {demoMode && (
              <div className="hairline-t pt-5 text-[13px] text-muted">
                <p>
                  Demo guest:{" "}
                  <button
                    type="button"
                    className="cursor-pointer text-ink hover:text-accent"
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
              )}
            </form>
          ) : (
            <form onSubmit={create} noValidate className="mt-7 flex flex-col gap-5">
              <Field label="Name" htmlFor="create-name" error={errors.name}>
                <Input
                  id="create-name"
                  autoComplete="name"
                  {...fieldAria("create-name", errors.name)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Phone" htmlFor="create-phone" error={errors.phone} hint="We confirm bookings by text or call.">
                <Input
                  id="create-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...fieldAria("create-phone", errors.phone, true)}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
              <Field label="Email" htmlFor="create-email" error={errors.email}>
                <Input
                  id="create-email"
                  type="email"
                  autoComplete="email"
                  {...fieldAria("create-email", errors.email)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Password" htmlFor="create-password" error={errors.password} hint={`At least ${PASSWORD_MIN} characters.`}>
                <Input
                  id="create-password"
                  type="password"
                  autoComplete="new-password"
                  {...fieldAria("create-password", errors.password, true)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" size="lg" className="mt-1 w-full" disabled={busy}>
                {busy ? "Creating your account…" : "Create account and continue"}
              </Button>
              <p className="text-center text-[14px] text-muted">
                Already have an account?{" "}
                <button type="button" onClick={() => switchTo("sign-in")} className={TEXT_BUTTON}>
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

"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useHydrated } from "@/lib/hydration";
import { DEMO_CUSTOMER } from "@/lib/seed";
import { useCopy } from "@/lib/site-hooks";
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
  const hydrated = useHydrated();
  const customer = useCustomer();
  const signInCustomer = useSalonStore((s) => s.signInCustomer);
  const createCustomer = useSalonStore((s) => s.createCustomer);
  const demoHints = useSalonStore((s) => s.mode === "demo" && s.settings.demoHints);
  const copy = useCopy();

  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>(params.get("mode") === "create" ? "create" : "sign-in");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && customer) router.replace(next);
  }, [hydrated, customer, router, next]);

  if (!hydrated || customer) return <div className="min-h-[60vh]" aria-busy />;

  function switchTo(m: Mode) {
    setMode(m);
    setErrors({});
    setPassword("");
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await signInCustomer(email, password);
    setBusy(false);
    if (!ok) setErrors({ password: copy.accountErrMatch });
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (!name.trim()) found.name = copy.accountErrName;
    if (phone.replace(/\D/g, "").length < 7) found.phone = copy.accountErrPhone;
    if (!EMAIL_RE.test(email.trim())) found.email = copy.accountErrEmail;
    if (password.length < 6) found.password = copy.accountErrPassword;
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const r = await createCustomer({ name, phone, email, password });
    setBusy(false);
    if (!r.ok) setErrors(r.error === "exists" ? { email: copy.accountErrExists } : { password: "Could not reach the salon. Try again in a moment." });
  }

  return (
    <>
      <PageTitle title={copy.accountTitle} intro={copy.accountIntro} />
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="max-w-md rounded-[16px] bg-surface p-7 shadow-[0_10px_30px_-18px_rgba(30,24,28,0.25)] md:p-8">
          <div role="group" aria-label="Account" className="grid grid-cols-2 gap-1 rounded-full border border-line-strong p-1">
            {(
              [
                ["sign-in", copy.accountTabSignIn],
                ["create", copy.accountTabCreate],
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
              <Field label={copy.accountEmail} htmlFor="signin-email">
                <Input id="signin-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label={copy.accountPassword} htmlFor="signin-password" error={errors.password}>
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
                {copy.accountSignInButton}
              </Button>
              <p className="text-center text-[14px] text-muted">
                {copy.accountFirstTime}{" "}
                <button type="button" onClick={() => switchTo("create")} className={TEXT_BUTTON}>
                  {copy.accountCreateLink}
                </button>
              </p>
              {demoHints && (
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
              <Field label={copy.accountName} htmlFor="create-name" error={errors.name}>
                <Input
                  id="create-name"
                  autoComplete="name"
                  {...fieldAria("create-name", errors.name)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label={copy.accountPhone} htmlFor="create-phone" error={errors.phone} hint={copy.accountPhoneHint || undefined}>
                <Input
                  id="create-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...fieldAria("create-phone", errors.phone, !!copy.accountPhoneHint)}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
              <Field label={copy.accountEmail} htmlFor="create-email" error={errors.email}>
                <Input
                  id="create-email"
                  type="email"
                  autoComplete="email"
                  {...fieldAria("create-email", errors.email)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label={copy.accountPassword} htmlFor="create-password" error={errors.password} hint={copy.accountPasswordHint || undefined}>
                <Input
                  id="create-password"
                  type="password"
                  autoComplete="new-password"
                  {...fieldAria("create-password", errors.password, !!copy.accountPasswordHint)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button type="submit" size="lg" className="mt-1 w-full" disabled={busy}>
                {copy.accountCreateButton}
              </Button>
              <p className="text-center text-[14px] text-muted">
                {copy.accountHaveOne}{" "}
                <button type="button" onClick={() => switchTo("sign-in")} className={TEXT_BUTTON}>
                  {copy.accountSignInLink}
                </button>
              </p>
            </form>
          )}
        </div>
        {copy.accountStaff && (
          <p className="mt-6 text-[13px] text-muted">
            {copy.accountStaff}{" "}
            <Link href="/login" className="text-ink hover:text-accent">
              {copy.accountStaffLink}
            </Link>
          </p>
        )}
      </div>
    </>
  );
}

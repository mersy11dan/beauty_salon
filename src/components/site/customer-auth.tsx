"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PhoneInput } from "@/components/ui/phone-input";
import { useHydrated } from "@/lib/hydration";
import { checkPhone, DEFAULT_COUNTRY, phoneHint, type PhoneValue } from "@/lib/phone";
import { DEMO_CUSTOMER } from "@/lib/seed";
import { useCustomer, useSalonStore } from "@/lib/store";
import { checkEmail, checkName, checkNewPassword, PASSWORD_MIN, suggestEmail } from "@/lib/validation";
import { PageTitle } from "./section";

type Mode = "sign-in" | "create";

type Key = "name" | "phone" | "email" | "password";
type Errors = Partial<Record<Key, string>>;

/** Same-site paths only, so `?next=` can't send anyone to another origin or a `javascript:` URL. */
function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/book";
  return raw;
}

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

  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>(params.get("mode") === "create" ? "create" : "sign-in");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<PhoneValue>({ country: DEFAULT_COUNTRY, number: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hydrated && customer) router.replace(next);
  }, [hydrated, customer, router, next]);

  if (!hydrated || customer) return <div className="min-h-[60vh]" aria-busy />;

  const validators: Record<Key, () => string | undefined> = {
    name: () => checkName(name),
    phone: () => {
      const r = checkPhone(phone);
      return r.ok ? undefined : r.error;
    },
    email: () => checkEmail(email),
    password: () => (mode === "create" ? checkNewPassword(password) : password ? undefined : "Enter your password."),
  };

  const setError = (key: Key, message: string | undefined) =>
    setErrors((prev) => (prev[key] === message ? prev : { ...prev, [key]: message }));

  /** Blur: only judge a field once something is in it. Empty fields wait for submit. */
  const blurCheck = (key: Key, filled: boolean) => () => {
    if (filled) setError(key, validators[key]());
  };

  /** While a field shows an error, re-check it on every keystroke so it clears the moment it's fixed. */
  const liveCheck = (key: Key, run: () => string | undefined) => {
    if (errors[key]) setError(key, run());
  };

  function switchTo(m: Mode) {
    setMode(m);
    setErrors({});
    setPassword("");
  }

  function firstInvalid(found: Errors, order: Key[]) {
    const key = order.find((k) => found[k]);
    if (!key) return false;
    const fields = { name: nameRef, phone: phoneRef, email: emailRef, password: passwordRef };
    fields[key].current?.focus();
    return true;
  }

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    const found: Errors = { email: validators.email(), password: validators.password() };
    setErrors(found);
    if (firstInvalid(found, ["email", "password"])) return;
    if (!signInCustomer(email, password)) {
      setErrors({ password: "That email and password do not match." });
      passwordRef.current?.focus();
    }
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    const order: Key[] = ["name", "phone", "email", "password"];
    const found = Object.fromEntries(order.map((k) => [k, validators[k]()])) as Errors;
    setErrors(found);
    if (firstInvalid(found, order)) return;
    const checked = checkPhone(phone);
    if (!checked.ok) return;
    if (!createCustomer({ name, phone: checked.e164, email, password })) {
      setErrors({ email: "There is already an account with this email. Sign in instead." });
      emailRef.current?.focus();
    }
  }

  const suggestion = errors.email ? null : suggestEmail(email);
  const emailField = (id: string) => (
    <Field label="Email" htmlFor={id} error={errors.email}>
      <Input
        ref={emailRef}
        id={id}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="name@gmail.com"
        {...fieldAria(id, errors.email, !!suggestion)}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          liveCheck("email", () => checkEmail(e.target.value));
        }}
        onBlur={blurCheck("email", !!email.trim())}
      />
      {suggestion && (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          Did you mean{" "}
          <button type="button" className={TEXT_BUTTON} onClick={() => setEmail(suggestion)}>
            {suggestion}
          </button>
          ?
        </p>
      )}
    </Field>
  );

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
              {emailField("signin-email")}
              <Field label="Password" htmlFor="signin-password" error={errors.password}>
                <Input
                  ref={passwordRef}
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  {...fieldAria("signin-password", errors.password)}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value) setError("password", undefined);
                  }}
                />
              </Field>
              <Button type="submit" size="lg" className="mt-1 w-full">
                Sign in and continue
              </Button>
              <p className="text-center text-[14px] text-muted">
                First time here?{" "}
                <button type="button" onClick={() => switchTo("create")} className={TEXT_BUTTON}>
                  Create an account
                </button>
              </p>
              <div className="hairline-t pt-5 text-[13px] text-muted">
                <p>
                  Demo guest:{" "}
                  <button
                    type="button"
                    className="cursor-pointer text-ink hover:text-accent"
                    onClick={() => {
                      setEmail(DEMO_CUSTOMER.email);
                      setPassword(DEMO_CUSTOMER.password);
                      setErrors({});
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
              <Field label="Full name" htmlFor="create-name" error={errors.name}>
                <Input
                  ref={nameRef}
                  id="create-name"
                  autoComplete="name"
                  placeholder="Selam Tesfaye"
                  {...fieldAria("create-name", errors.name)}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    liveCheck("name", () => checkName(e.target.value));
                  }}
                  onBlur={blurCheck("name", !!name.trim())}
                />
              </Field>
              <Field label="Mobile number" htmlFor="create-phone" error={errors.phone} hint={`${phoneHint(phone.country)} We confirm bookings by SMS or a call.`}>
                <PhoneInput
                  id="create-phone"
                  inputRef={phoneRef}
                  value={phone}
                  invalid={!!errors.phone}
                  describedBy={errors.phone ? "create-phone-error" : "create-phone-hint"}
                  onChange={(v) => {
                    setPhone(v);
                    liveCheck("phone", () => {
                      const r = checkPhone(v);
                      return r.ok ? undefined : r.error;
                    });
                  }}
                  onBlur={blurCheck("phone", !!phone.number.trim())}
                />
              </Field>
              {emailField("create-email")}
              <Field label="Password" htmlFor="create-password" error={errors.password} hint={`At least ${PASSWORD_MIN} characters.`}>
                <Input
                  ref={passwordRef}
                  id="create-password"
                  type="password"
                  autoComplete="new-password"
                  {...fieldAria("create-password", errors.password, true)}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    liveCheck("password", () => checkNewPassword(e.target.value));
                  }}
                  onBlur={blurCheck("password", !!password)}
                />
              </Field>
              <Button type="submit" size="lg" className="mt-1 w-full">
                Create account and continue
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

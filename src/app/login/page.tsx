"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useHydrated } from "@/lib/hydration";
import { useSalonStore } from "@/lib/store";
import { checkEmail } from "@/lib/validation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const session = useSalonStore((s) => s.session);
  const signIn = useSalonStore((s) => s.signIn);
  const accounts = useSalonStore((s) => s.accounts);
  const name = useSalonStore((s) => s.settings.name);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [error, setError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const next = params.get("next");

  useEffect(() => {
    if (hydrated && session) router.replace(next ?? (session.role === "admin" ? "/admin" : "/desk"));
  }, [hydrated, session, router, next]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const badEmail = checkEmail(email);
    setEmailError(badEmail);
    if (badEmail) {
      setError("");
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      setError("Enter your password.");
      passwordRef.current?.focus();
      return;
    }
    const role = signIn(email, password);
    if (!role) {
      setError("That email and password do not match. Check the demo logins below.");
      passwordRef.current?.focus();
      return;
    }
    router.replace(next ?? (role === "admin" ? "/admin" : "/desk"));
  }

  const fill = (account: { email: string; password: string }) => {
    setEmail(account.email);
    setPassword(account.password);
    setEmailError(undefined);
    setError("");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-ops-bg text-ops-ink">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <Link href="/" className="font-display text-[15px] uppercase tracking-[0.16em] text-ops-ink">
          {name}
        </Link>
        <h1 className="mt-8 text-[26px] font-semibold tracking-[-0.015em]">Sign in</h1>
        <p className="mt-1.5 text-[14.5px] text-ops-muted">For salon staff and the site administrator.</p>

        <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
          <Field label="Email" htmlFor="email" error={emailError}>
            <Input
              ref={emailRef}
              id="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(checkEmail(e.target.value));
              }}
              onBlur={() => email.trim() && setEmailError(checkEmail(email))}
            />
          </Field>
          <Field label="Password" htmlFor="password" error={error}>
            <Input
              ref={passwordRef}
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-describedby={error ? "password-error" : undefined}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
            />
          </Field>
          <Button type="submit" size="lg" className="mt-2 bg-ops-accent text-white hover:bg-black">
            Sign in
          </Button>
        </form>

        <div className="mt-10 rounded-xl border border-ops-line bg-ops-surface p-5 text-[13.5px]">
          <p className="font-medium text-ops-ink">Demo logins</p>
          <dl className="mt-3 grid grid-cols-[5rem_1fr] gap-y-2 text-ops-muted">
            <dt>Admin</dt>
            <dd>
              <button type="button" className="text-left hover:text-ops-ink" onClick={() => fill(accounts.admin)}>
                {accounts.admin.email} · {accounts.admin.password}
              </button>
            </dd>
            <dt>Staff</dt>
            <dd>
              <button type="button" className="text-left hover:text-ops-ink" onClick={() => fill(accounts.staff)}>
                {accounts.staff.email} · {accounts.staff.password}
              </button>
            </dd>
          </dl>
          <p className="mt-3 text-ops-muted">Select one to fill the form.</p>
        </div>
      </div>
    </div>
  );
}

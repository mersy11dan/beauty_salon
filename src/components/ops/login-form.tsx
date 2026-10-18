"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { DEMO_ACCOUNTS } from "@/lib/demo";
import { useSalonStore } from "@/lib/store";

export function LoginForm({ next, demoMode }: { next: string; demoMode: boolean }) {
  const router = useRouter();
  const signIn = useSalonStore((s) => s.signIn);
  const name = useSalonStore((s) => s.settings.name);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await signIn(email, password);
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    router.replace(next || (result.data.role === "admin" ? "/admin" : "/desk"));
  }

  const fill = (a: { email: string; password: string }) => {
    setEmail(a.email);
    setPassword(a.password);
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
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" htmlFor="password" error={error}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-describedby={error ? "password-error" : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" disabled={busy} className="mt-2 bg-ops-accent text-white hover:bg-black">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {demoMode && (
          <div className="mt-10 rounded-xl border border-ops-line bg-ops-surface p-5 text-[13.5px]">
            <p className="font-medium text-ops-ink">Demo logins</p>
            <dl className="mt-3 grid grid-cols-[5rem_1fr] gap-y-2 text-ops-muted">
              <dt>Admin</dt>
              <dd>
                <button type="button" className="text-left hover:text-ops-ink" onClick={() => fill(DEMO_ACCOUNTS.admin)}>
                  {DEMO_ACCOUNTS.admin.email} · {DEMO_ACCOUNTS.admin.password}
                </button>
              </dd>
              <dt>Staff</dt>
              <dd>
                <button type="button" className="text-left hover:text-ops-ink" onClick={() => fill(DEMO_ACCOUNTS.staff)}>
                  {DEMO_ACCOUNTS.staff.email} · {DEMO_ACCOUNTS.staff.password}
                </button>
              </dd>
            </dl>
            <p className="mt-3 text-ops-muted">Select one to fill the form.</p>
          </div>
        )}
      </div>
    </div>
  );
}

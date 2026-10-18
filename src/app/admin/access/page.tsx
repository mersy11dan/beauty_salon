"use client";

import { useState } from "react";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useSalonStore } from "@/lib/store";

export default function AccessPage() {
  const mode = useSalonStore((s) => s.mode);
  const accounts = useSalonStore((s) => s.accounts);
  const setStaffAccount = useSalonStore((s) => s.setStaffAccount);
  const resetDemo = useSalonStore((s) => s.resetDemo);
  const live = mode === "live";
  const [email, setEmail] = useState(accounts.staff.email);
  const [password, setPassword] = useState(accounts.staff.password);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      setStatus({ ok: false, text: "Add an email and a password of at least 6 characters." });
      return;
    }
    setBusy(true);
    const error = await setStaffAccount(email.trim(), password);
    setBusy(false);
    setStatus(error ? { ok: false, text: error } : { ok: true, text: "Saved" });
    if (!error && live) setPassword("");
    if (!error) setTimeout(() => setStatus(null), 2500);
  }

  return (
    <>
      <OpsTitle
        title="Access and data"
        intro={live ? "Who can open the desk and the admin on this website." : "Who can open the desk, and a way back to the demo data."}
      />
      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Staff login</h2>
          <p className="mb-4 text-[13.5px] text-ops-muted">
            {live
              ? accounts.staff.email
                ? `One shared login for the desk. Staff currently sign in as ${accounts.staff.email}. Saving a new password signs out anyone using the old one.`
                : "One shared login for the desk. Nobody can sign in to the desk until you create it here."
              : "One shared login for the desk."}
          </p>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="staff-email">
              <Input id="staff-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={live ? "New password" : "Password"} htmlFor="staff-password" hint="At least 6 characters.">
              <Input
                id="staff-password"
                type={live ? "password" : "text"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" size="sm" disabled={busy} className="bg-ops-accent text-white hover:bg-black">
                {busy ? "Saving…" : "Save login"}
              </Button>
              {status && (
                <span role={status.ok ? "status" : "alert"} className={status.ok ? "text-[13.5px] text-[#1f5c35]" : "text-[13.5px] text-[#9b2c2c]"}>
                  {status.text}
                </span>
              )}
            </div>
          </form>
          <p className="mt-4 text-[13.5px] text-ops-muted">
            Admin login: {accounts.admin.email}
            {live && (
              <>
                <br />
                To change it, edit <code className="text-ops-ink">ADMIN_EMAIL</code> and <code className="text-ops-ink">ADMIN_PASSWORD</code> in this
                project&apos;s Vercel settings, then redeploy. Changing the password signs every admin out.
              </>
            )}
          </p>
        </Card>

        {live ? (
          <Card className="p-5">
            <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Where the data lives</h2>
            <p className="text-[13.5px] text-ops-muted">
              This website has its own database. Bookings, payments and guest accounts made here are never shared with the demo or with any other
              client&apos;s website. Guest passwords are stored scrambled, so nobody can read them, including you.
            </p>
          </Card>
        ) : (
          <Card className="p-5">
            <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Demo data</h2>
            <p className="mb-4 text-[13.5px] text-ops-muted">
              This demo keeps everything in this browser. Resetting puts back the sample salon, services, bookings, guest accounts and payments, and
              clears any colours or words you changed.
            </p>
            {confirmReset ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    resetDemo();
                    setConfirmReset(false);
                  }}
                >
                  Yes, reset everything
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                  Keep my changes
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setConfirmReset(true)}>
                Reset to demo data
              </Button>
            )}
          </Card>
        )}
      </div>
    </>
  );
}

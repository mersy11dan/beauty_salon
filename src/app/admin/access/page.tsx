"use client";

import { useState } from "react";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useSalonStore } from "@/lib/store";

export default function AccessPage() {
  const accounts = useSalonStore((s) => s.accounts);
  const setStaffAccount = useSalonStore((s) => s.setStaffAccount);
  const resetDemo = useSalonStore((s) => s.resetDemo);
  const [email, setEmail] = useState(accounts.staff.email);
  const [password, setPassword] = useState(accounts.staff.password);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) return;
    setStaffAccount(email.trim(), password);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <OpsTitle title="Access and data" intro="Who can open the desk, and a way back to the demo data." />
      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Staff login</h2>
          <p className="mb-4 text-[13.5px] text-ops-muted">One shared login for the desk. In the live version each person gets their own.</p>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="staff-email">
              <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password" htmlFor="staff-password" hint="At least 6 characters.">
              <Input id="staff-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" size="sm" className="bg-ops-accent text-white hover:bg-black">
                Save login
              </Button>
              {saved && <span className="text-[13.5px] text-[#1f5c35]">Saved</span>}
            </div>
          </form>
          <p className="mt-4 text-[13.5px] text-ops-muted">Admin login: {accounts.admin.email}</p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Demo data</h2>
          <p className="mb-4 text-[13.5px] text-ops-muted">
            This demo keeps everything in this browser. Resetting puts back the sample salon, services, bookings and payments, and clears any colours or words you changed.
          </p>
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="danger" onClick={() => { resetDemo(); setConfirmReset(false); }}>
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
      </div>
    </>
  );
}

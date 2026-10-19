"use client";

import clsx from "clsx";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { call } from "@/lib/call";
import { useSalonStore } from "@/lib/store";
import type { Role, Session, StaffAccount } from "@/lib/types";
import { checkEmail, checkNewPassword, PASSWORD_MIN } from "@/lib/validation";
import { createStaffAccount, deleteStaffAccount, updateStaffAccount } from "@/server/actions/accounts";
import { changeOwnPassword } from "@/server/actions/auth";
import { Card, OpsTitle } from "./ops-shell";

const ROLE_LABEL: Record<Role, string> = { admin: "Admin", staff: "Desk" };
const PRIMARY = "bg-ops-accent text-white hover:bg-black";

type Draft = { id?: string; name: string; email: string; role: Role; password: string };
const blank = (): Draft => ({ name: "", email: "", role: "staff", password: "" });

export function AccessPanel({ me, initialAccounts, demoMode }: { me: NonNullable<Session>; initialAccounts: StaffAccount[]; demoMode: boolean }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [draft, setDraft] = useState<Draft | null>(null);

  return (
    <>
      <OpsTitle title="Access and data" intro="Who can open the desk and the admin, and your own password." />
      <div className="flex flex-col gap-6">
        <OwnPassword me={me} />

        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-ops-ink">Staff logins</h2>
              <p className="mt-1 text-[13.5px] text-ops-muted">
                Give each person their own login. Desk logins see bookings and payments; admins can also change the site.
              </p>
            </div>
            {!draft && (
              <Button size="sm" className={PRIMARY} onClick={() => setDraft(blank())}>
                Add a login
              </Button>
            )}
          </div>

          {draft && !draft.id && (
            <AccountForm
              draft={draft}
              onChange={setDraft}
              onCancel={() => setDraft(null)}
              onSaved={(a) => {
                setAccounts((list) => [...list, a]);
                setDraft(null);
              }}
            />
          )}

          <ul className="divide-y divide-ops-line rounded-lg border border-ops-line">
            {accounts.map((a) =>
              draft?.id === a.id ? (
                <li key={a.id} className="p-4">
                  <AccountForm
                    draft={draft}
                    isSelf={a.id === me.id}
                    onChange={setDraft}
                    onCancel={() => setDraft(null)}
                    onSaved={(saved) => {
                      setAccounts((list) => list.map((x) => (x.id === saved.id ? saved : x)));
                      setDraft(null);
                    }}
                  />
                </li>
              ) : (
                <AccountRow
                  key={a.id}
                  account={a}
                  isSelf={a.id === me.id}
                  onEdit={() => setDraft({ id: a.id, name: a.name, email: a.email, role: a.role, password: "" })}
                  onRemoved={() => setAccounts((list) => list.filter((x) => x.id !== a.id))}
                />
              ),
            )}
          </ul>
        </Card>

        {demoMode && <DemoReset />}
      </div>
    </>
  );
}

function AccountRow({ account, isSelf, onEdit, onRemoved }: { account: StaffAccount; isSelf: boolean; onEdit: () => void; onRemoved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm(`Remove the login for ${account.email}? They will be signed out straight away.`)) return;
    setBusy(true);
    setError("");
    const result = await call(() => deleteStaffAccount(account.id));
    setBusy(false);
    if (result.ok) onRemoved();
    else setError(result.error);
  }

  return (
    <li className={clsx("flex flex-wrap items-center gap-3 px-4 py-3", busy && "opacity-60")}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] text-ops-ink">
          {account.name || account.email}
          {isSelf && <span className="text-ops-muted"> (you)</span>}
        </p>
        <p className="truncate text-[13px] text-ops-muted">{account.email}</p>
        {error && (
          <p role="alert" className="mt-1 text-[13px] text-[#9b2c2c]">
            {error}
          </p>
        )}
      </div>
      <span className="rounded-full bg-ops-bg px-2.5 py-1 text-[12px] font-medium text-ops-muted">{ROLE_LABEL[account.role]}</span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label={`Edit ${account.email}`} onClick={onEdit} className="rounded-md p-2 text-ops-muted hover:bg-ops-bg hover:text-ops-ink">
          <Pencil size={15} strokeWidth={1.75} />
        </button>
        {!isSelf && (
          <button
            type="button"
            aria-label={`Remove ${account.email}`}
            disabled={busy}
            onClick={() => void remove()}
            className="rounded-md p-2 text-ops-muted hover:bg-ops-bg hover:text-[#9b2c2c]"
          >
            <Trash2 size={15} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </li>
  );
}

function AccountForm({
  draft,
  isSelf,
  onChange,
  onCancel,
  onSaved,
}: {
  draft: Draft;
  isSelf?: boolean;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSaved: (a: StaffAccount) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const editing = !!draft.id;
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return setError({ text: "Add a name so you can tell logins apart.", field: "name" });
    const emailError = checkEmail(draft.email);
    if (emailError) return setError({ text: emailError, field: "email" });
    const passwordError = editing && !draft.password ? undefined : checkNewPassword(draft.password);
    if (passwordError) return setError({ text: passwordError, field: "password" });
    setBusy(true);
    setError(null);
    const result = await call(() =>
      draft.id
        ? updateStaffAccount({ id: draft.id, name: draft.name, email: draft.email, role: draft.role, password: draft.password })
        : createStaffAccount({ name: draft.name, email: draft.email, role: draft.role, password: draft.password }),
    );
    setBusy(false);
    if (result.ok) onSaved(result.data);
    else setError({ text: result.error, field: result.field });
  }

  const errorFor = (field: string) => (error?.field === field ? error.text : undefined);
  const id = (k: string) => `acct-${draft.id ?? "new"}-${k}`;

  return (
    <form onSubmit={submit} noValidate className="mb-4 grid gap-4 sm:grid-cols-2">
      <Field label="Name" htmlFor={id("name")} error={errorFor("name")}>
        <Input id={id("name")} autoComplete="off" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <Field label="Email" htmlFor={id("email")} error={errorFor("email")}>
        <Input id={id("email")} type="email" autoComplete="off" autoCapitalize="none" spellCheck={false} value={draft.email} onChange={(e) => set({ email: e.target.value })} />
      </Field>
      <Field label="Access" htmlFor={id("role")} error={errorFor("role")} hint={isSelf ? "You can't remove your own admin access." : undefined}>
        <Select id={id("role")} value={draft.role} disabled={isSelf} onChange={(e) => set({ role: e.target.value as Role })}>
          <option value="staff">Desk: bookings and payments</option>
          <option value="admin">Admin: everything</option>
        </Select>
      </Field>
      <Field
        label={editing ? "New password" : "Password"}
        htmlFor={id("password")}
        error={errorFor("password")}
        hint={editing ? "Leave blank to keep the current one. A new password signs them out everywhere." : `At least ${PASSWORD_MIN} characters. Share it with them in person.`}
      >
        <Input id={id("password")} type="text" autoComplete="new-password" value={draft.password} onChange={(e) => set({ password: e.target.value })} />
      </Field>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={busy} className={PRIMARY}>
          {busy ? "Saving…" : editing ? "Save changes" : "Create login"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        {error && !["name", "email", "role", "password"].includes(error.field ?? "") && (
          <p role="alert" className="text-[13px] text-[#9b2c2c]">
            {error.text}
          </p>
        )}
      </div>
    </form>
  );
}

function OwnPassword({ me }: { me: NonNullable<Session> }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setDone(false);
    const nextError = checkNewPassword(next);
    if (nextError) return setError({ text: nextError, field: "next" });
    if (next !== confirm) return setError({ text: "The two new passwords don't match.", field: "confirm" });
    setBusy(true);
    setError(null);
    const result = await call(() => changeOwnPassword({ current, next }));
    setBusy(false);
    if (!result.ok) return setError({ text: result.error, field: result.field });
    setCurrent("");
    setNext("");
    setConfirm("");
    setDone(true);
  }

  const errorFor = (field: string) => (error?.field === field ? error.text : undefined);

  return (
    <Card className="p-5">
      <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Your password</h2>
      <p className="mb-4 text-[13.5px] text-ops-muted">Signed in as {me.email}. Changing it signs you out on every other device.</p>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-3">
        <Field label="Current password" htmlFor="pw-current" error={errorFor("current")}>
          <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" htmlFor="pw-next" error={errorFor("next")} hint={`At least ${PASSWORD_MIN} characters.`}>
          <Input id="pw-next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="New password again" htmlFor="pw-confirm" error={errorFor("confirm")}>
          <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-3">
          <Button type="submit" size="sm" disabled={busy || !current || !next} className={PRIMARY}>
            {busy ? "Saving…" : "Change password"}
          </Button>
          {done && <span className="text-[13.5px] text-[#1f5c35]">Password changed</span>}
          {error && !["current", "next", "confirm"].includes(error.field ?? "") && (
            <p role="alert" className="text-[13px] text-[#9b2c2c]">
              {error.text}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}

function DemoReset() {
  const resetDemo = useSalonStore((s) => s.resetDemo);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function reset() {
    setBusy(true);
    const result = await resetDemo();
    if (result.ok) {
      window.location.reload();
      return;
    }
    setBusy(false);
    setConfirming(false);
  }

  return (
    <Card className="p-5">
      <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Demo data</h2>
      <p className="mb-4 text-[13.5px] text-ops-muted">
        This is the demo site. Resetting puts back the sample salon, services, bookings, guest accounts and payments, and clears any colours or words you
        changed. Staff logins stay as they are.
      </p>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="danger" disabled={busy} onClick={() => void reset()}>
            {busy ? "Resetting…" : "Yes, reset everything"}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
            Keep my changes
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>
          Reset to demo data
        </Button>
      )}
    </Card>
  );
}

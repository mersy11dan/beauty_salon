"use client";

import clsx from "clsx";
import { Check, Copy, Download, ExternalLink, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { uploadPhoto } from "@/components/ops/image-input";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/field";
import { mapImages, packageFileName, readPackage } from "@/lib/content";
import { useSalonStore } from "@/lib/store";
import type { SiteContent } from "@/lib/types";

const PRIMARY = "bg-ops-accent text-white hover:bg-black";

export default function LaunchPage() {
  const live = !useSalonStore((s) => s.demoMode);

  return (
    <>
      <OpsTitle
        title="Launch"
        intro={
          live
            ? "This is a client's own website, with its own database and photo storage. Load the design you made on the demo, then connect the client's domain."
            : "Put this design on its own website for the client: their own web address, database and photo storage, with nothing shared with the demo or any other client."
        }
      />
      <div className="flex flex-col gap-6">
        {live ? (
          <>
            <Section n={1} title="Load the site file">
              <ImportSite />
            </Section>
            <Section n={2} title="Connect the domain and hand over">
              <HandOver live />
            </Section>
            <Section n={3} title="Keep a backup">
              <p className="mb-4 text-[13.5px] text-ops-muted">
                Downloads everything on this website except bookings, payments and accounts, photos included. Load it into the demo to reuse
                the design, or into a new deployment to move the site.
              </p>
              <ExportSite label="Download backup" />
            </Section>
          </>
        ) : (
          <>
            <Section n={1} title="Save the site file">
              <p className="mb-4 text-[13.5px] text-ops-muted">
                One file with everything you edited: name, logo, colours, fonts, every piece of text, services, team, photos, reviews, offers
                and opening hours. Bookings, payments and accounts are not included; they belong to the demo.
              </p>
              <ExportSite label="Download site file" />
            </Section>
            <Section n={2} title="Create the client's own website">
              <DeployGuide />
            </Section>
            <Section n={3} title="Load the file on the new website">
              <p className="text-[13.5px] text-ops-muted">
                Sign in to the new website&apos;s admin, open <strong className="font-medium text-ops-ink">Launch</strong> there and choose the
                file from step 1. Photos upload into the client&apos;s own photo storage. You can also load a site file here, on the demo, to
                carry on editing a design you saved earlier:
              </p>
              <div className="mt-4">
                <ImportSite />
              </div>
            </Section>
            <Section n={4} title="Connect the domain and hand over">
              <HandOver live={false} />
            </Section>
            <NextClient />
            <DemoHints />
          </>
        )}
      </div>
    </>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 md:p-6">
      <div className="mb-3 flex items-center gap-3">
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-ops-accent text-[13px] font-semibold text-white">
          {n}
        </span>
        <h2 className="text-[16px] font-semibold text-ops-ink">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h2>
      </div>
      {children}
    </Card>
  );
}

// --- Export ---------------------------------------------------------------------

function ExportSite({ label }: { label: string }) {
  const name = useSalonStore((s) => s.settings.name);
  const flushSettings = useSalonStore((s) => s.flushSettings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setBusy(true);
    setError("");
    try {
      if (!(await flushSettings())) throw new Error("Your latest changes haven't saved yet, so the file would miss them. Try again in a moment.");
      let res: Response;
      try {
        res = await fetch("/api/site-file", { cache: "no-store" });
      } catch {
        throw new Error("Couldn't reach the server. Check the connection and try again.");
      }
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? "The site file couldn't be made. Try again in a moment.");
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = packageFileName(name);
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The site file couldn't be made. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" className={PRIMARY} disabled={busy} onClick={download}>
        <Download size={15} strokeWidth={1.75} />
        {busy ? "Preparing…" : label}
      </Button>
      <span className="text-[13px] text-ops-muted">{packageFileName(name)}</span>
      {error && (
        <p role="alert" className="basis-full text-[13px] text-[#9b2c2c]">
          {error}
        </p>
      )}
    </div>
  );
}

// --- Import ---------------------------------------------------------------------

type Picked = { content: SiteContent; name: string; file: string };

function ImportSite() {
  const replaceContent = useSalonStore((s) => s.replaceContent);
  const current = useSalonStore((s) => s.settings.name);
  const ref = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function choose(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    const r = readPackage(await file.text());
    if (!r.ok) {
      setPicked(null);
      setMessage({ ok: false, text: r.error });
      return;
    }
    setPicked({ content: r.content, name: r.name, file: file.name });
  }

  async function apply() {
    if (!picked) return;
    setMessage(null);
    try {
      const inline = new Set<string>();
      await mapImages(picked.content, async (src) => {
        if (src.startsWith("data:")) inline.add(src);
        return src;
      });
      let done = 0;
      const content = await mapImages(picked.content, async (src) => {
        if (!src.startsWith("data:")) return src;
        setProgress(`Uploading photo ${done + 1} of ${inline.size}…`);
        const url = await uploadPhoto(await (await fetch(src)).blob());
        done += 1;
        return url;
      });
      setProgress("Saving the website…");
      const r = await replaceContent(content);
      if (!r.ok) throw new Error(r.error);
      setMessage({ ok: true, text: `Loaded ${picked.name}. Every page now shows this design.` });
      setPicked(null);
    } catch (e) {
      setMessage({
        ok: false,
        text: `Nothing was replaced. ${e instanceof Error && e.message ? e.message : "Check the connection and try again."}`,
      });
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Choose a site file"
        onChange={(e) => {
          void choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {picked ? (
        <div className="rounded-lg border border-ops-line bg-ops-bg p-4">
          <p className="text-[14px] text-ops-ink">
            {current && current !== picked.name ? (
              <>
                Replace everything on this website ({current}) with <strong className="font-semibold">{picked.name}</strong>?
              </>
            ) : (
              <>
                Replace everything on this website with the saved copy of <strong className="font-semibold">{picked.name}</strong>?
              </>
            )}
          </p>
          <p className="mt-1 text-[13px] text-ops-muted">
            From {picked.file}. Bookings, payments, guest accounts and staff logins stay as they are.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" className={PRIMARY} disabled={!!progress} onClick={apply}>
              {progress ?? `Yes, load ${picked.name}`}
            </Button>
            <Button size="sm" variant="ghost" disabled={!!progress} onClick={() => setPicked(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => ref.current?.click()}>
          <Upload size={15} strokeWidth={1.75} />
          Choose site file
        </Button>
      )}
      {message && (
        <p role={message.ok ? "status" : "alert"} className={clsx("mt-3 text-[13.5px]", message.ok ? "text-[#1f5c35]" : "text-[#9b2c2c]")}>
          {message.text}
        </p>
      )}
    </div>
  );
}

// --- Deploy guide -----------------------------------------------------------------

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        await navigator.clipboard?.writeText(text).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-ops-muted transition-colors hover:bg-ops-bg hover:text-ops-ink"
    >
      {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const ENV_VARS = [
  { name: "DATABASE_URL", what: "Added by Vercel when you connect the Neon database. Check that it is listed." },
  { name: "CLOUDINARY_URL", what: "The client's Cloudinary API environment variable, starting with cloudinary://. Photos are stored there." },
  { name: "ADMIN_EMAIL", what: "The email you (or the client) will sign in to the admin with." },
  { name: "ADMIN_PASSWORD", what: "A long password, at least 8 characters. Different for every client." },
  { name: "ADMIN_NAME", what: "Optional. The name shown in the admin." },
  { name: "DEMO_MODE", what: "false. Demo logins and Reset demo data stay off on a live website." },
  { name: "DATABASE_POOL_MAX", what: "3. Keeps the number of database connections low on Vercel." },
];

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="flex list-decimal flex-col gap-3.5 pl-5 text-[14px] leading-[1.55] text-ops-ink marker:text-ops-muted">{children}</ol>;
}

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium underline underline-offset-2">
      {children}
      <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
    </a>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[13px]">{children}</span>;
}

function DeployGuide() {
  return (
    <>
      <p className="mb-4 text-[13.5px] text-ops-muted">
        Each client gets a separate deployment of this same code, with its own Postgres database, its own photo storage and its own admin
        login. All three have free plans.
      </p>
      <Steps>
        <li>
          Open <Ext href="https://vercel.com/new">vercel.com/new</Ext> and import this same GitHub repository again. Name the project after the
          client, for example <Code>rose-studio</Code>. Do not deploy into the demo project. The first deploy stops with a message asking for a
          database; that is expected.
        </li>
        <li>
          In the new project, open <strong className="font-medium">Storage</strong>, create a <strong className="font-medium">Neon</strong>{" "}
          Postgres database (the free plan is enough to start) in the region closest to the salon, and connect it to the project with{" "}
          <strong className="font-medium">Preview</strong> branching on, so test deployments never touch the live data. Use a new database for
          every client, so no two clients ever share data. Then, under <strong className="font-medium">Settings → Functions</strong>, set the
          function region to the same place.
        </li>
        <li>
          Create a <Ext href="https://cloudinary.com">Cloudinary</Ext> account for the client and copy the{" "}
          <strong className="font-medium">API environment variable</strong> from <strong className="font-medium">Settings → API Keys</strong>.
        </li>
        <li>
          In the project&apos;s <strong className="font-medium">Settings → Environment Variables</strong>, add:
          <div className="mt-2.5 overflow-hidden rounded-lg border border-ops-line">
            <table className="w-full text-[13px]">
              <tbody className="divide-y divide-ops-line">
                {ENV_VARS.map((v) => (
                  <tr key={v.name} className="align-top">
                    <td className="whitespace-nowrap py-2.5 pl-3 pr-2">
                      <span className="font-mono text-[12.5px] text-ops-ink">{v.name}</span>
                      <CopyButton text={v.name} label={v.name} />
                    </td>
                    <td className="py-2.5 pr-3 text-ops-muted">{v.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </li>
        <li>
          Open <strong className="font-medium">Deployments</strong> and choose <strong className="font-medium">Redeploy</strong> on the latest one.
          This deploy creates the tables, the admin login and the sample salon as a starting point; the site file replaces the sample in the
          next step. It never adds the demo logins.
        </li>
        <li>
          Open the new website&apos;s <Code>/login</Code> page and sign in with the ADMIN_EMAIL and ADMIN_PASSWORD you chose. The admin shows a
          green <strong className="font-medium">Live</strong> chip instead of Demo.
        </li>
      </Steps>
      <p className="mt-4 rounded-lg bg-ops-bg px-4 py-3 text-[13px] text-ops-muted">
        Good to know: every client website runs the code on this repository&apos;s main branch, so a fix pushed there reaches all of them on their
        next deploy, and each deploy brings that client&apos;s database up to date by itself. Client
        websites are commercial, so they need a Vercel Pro plan, a project in the client&apos;s own Vercel account, or another host such as
        Netlify.
      </p>
    </>
  );
}

function HandOver({ live }: { live: boolean }) {
  const access = live ? (
    <Link href="/admin/access" className="font-medium underline underline-offset-2">
      Access and data
    </Link>
  ) : (
    <strong className="font-medium">Access and data</strong>
  );
  return (
    <Steps>
      <li>
        In the client&apos;s Vercel project, open <strong className="font-medium">Settings → Domains</strong> and add their domain, for example{" "}
        <Code>rosestudio.com</Code>. Buy it there, or add the records Vercel shows at the company where the domain was bought. The site works on
        its <Code>.vercel.app</Code> address in the meantime.
      </li>
      <li>Under {access} on the client&apos;s website, create the desk login their staff will use for bookings and payments.</li>
      <li>Give the client their logins. They can change their own password under {access} once signed in.</li>
      <li>
        Back here, tick <strong className="font-medium">{live ? "Domain and hand-over" : "Launch on its own website"}</strong> as done on the{" "}
        <Link href="/admin" className="font-medium underline underline-offset-2">
          Site builder
        </Link>{" "}
        page.
      </li>
    </Steps>
  );
}

// --- Demo only ----------------------------------------------------------------------

function NextClient() {
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
    <Card className="p-5 md:p-6">
      <h2 className="text-[16px] font-semibold text-ops-ink">Start the next client</h2>
      <p className="mb-4 mt-1 text-[13.5px] text-ops-muted">
        Puts the demo back to the sample salon, with its sample bookings and guests, so you can begin a new design. Staff logins stay as they
        are. Download the site file first if you want to come back to this one.
      </p>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="danger" disabled={busy} onClick={() => void reset()}>
            {busy ? "Resetting…" : "Yes, start from the sample"}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
            Keep this design
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>
          Start from the sample salon
        </Button>
      )}
    </Card>
  );
}

function DemoHints() {
  const on = useSalonStore((s) => s.settings.demoHints);
  const updateSettings = useSalonStore((s) => s.updateSettings);
  return (
    <Card className="px-5 md:px-6">
      <Toggle
        label="Show demo logins on the sign-in pages"
        description="Handy while you show the demo to a prospective client. Live websites never show them."
        checked={on}
        onChange={(v) => updateSettings({ demoHints: v })}
      />
    </Card>
  );
}

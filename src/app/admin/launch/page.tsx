"use client";

import clsx from "clsx";
import { Check, Copy, Download, ExternalLink, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/field";
import { makePackage, mapImages, packageFileName, pickContent, readPackage } from "@/lib/content";
import { useSalonStore, useSalonStoreApi } from "@/lib/store";
import type { SiteContent } from "@/lib/types";
import { saveSite, uploadImage } from "@/server/actions";

const PRIMARY = "bg-ops-accent text-white hover:bg-black";

export default function LaunchPage() {
  const mode = useSalonStore((s) => s.mode);
  const live = mode === "live";

  return (
    <>
      <OpsTitle
        title="Launch"
        intro={
          live
            ? "This website is live with its own database. Load the design you made in the demo, then connect the client's domain."
            : "Put this design on its own website for the client: their own web address and their own database, with nothing shared with the demo or any other client."
        }
      />
      <div className="flex flex-col gap-6">
        {live ? (
          <>
            <Section n={1} title="Load the site file">
              <ImportSite />
            </Section>
            <Section n={2} title="Connect the domain and hand over">
              <HandOver />
            </Section>
            <Section n={3} title="Keep a backup">
              <p className="mb-4 text-[13.5px] text-ops-muted">
                Downloads everything on this website except bookings, payments and guest accounts, photos included. Load it into the demo to
                reuse the design, or into a new deployment to move the site.
              </p>
              <ExportSite label="Download backup" />
            </Section>
          </>
        ) : (
          <>
            <Section n={1} title="Save the site file">
              <p className="mb-4 text-[13.5px] text-ops-muted">
                One file with everything you edited: name, logo, colours, fonts, every piece of text, services, team, photos, reviews, offers
                and opening hours. Bookings, payments and guest accounts are not included; they belong to the demo.
              </p>
              <ExportSite label="Download site file" />
            </Section>
            <Section n={2} title="Create the client's own website">
              <DeployGuide />
            </Section>
            <Section n={3} title="Load the file on the new website">
              <p className="text-[13.5px] text-ops-muted">
                Sign in to the new website&apos;s admin, open <strong className="font-medium text-ops-ink">Launch</strong> there and choose the
                file from step 1. Photos upload into the client&apos;s own database. You can also load a site file here, in the demo, to carry
                on editing a design you saved earlier:
              </p>
              <div className="mt-4">
                <ImportSite />
              </div>
            </Section>
            <Section n={4} title="Connect the domain and hand over">
              <HandOver />
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

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function ExportSite({ label }: { label: string }) {
  const store = useSalonStoreApi();
  const name = useSalonStore((s) => s.settings.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setBusy(true);
    setError("");
    try {
      // Uploaded photos live in this site's database; the file carries them inline so it works anywhere.
      const content = await mapImages(pickContent(store.getState()), async (src) => {
        if (!src.startsWith("/api/media/")) return src;
        const res = await fetch(src);
        if (!res.ok) throw new Error(src);
        return blobToDataUrl(await res.blob());
      });
      const blob = new Blob([JSON.stringify(makePackage(content))], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = packageFileName(content.settings.name);
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setError("Some photos could not be fetched, so the file was not saved. Check the connection and try again.");
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
  const store = useSalonStoreApi();
  const mode = useSalonStore((s) => s.mode);
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
    if (mode !== "live") {
      try {
        store.getState().replaceContent(picked.content);
        setMessage({ ok: true, text: `Loaded ${picked.name}. Every page now shows this design.` });
      } catch {
        setMessage({
          ok: false,
          text: "Loaded, but this browser ran out of room to keep all the photos, so they will be gone after a reload. Load the file on the client's live website instead, where there is no such limit.",
        });
      }
      setPicked(null);
      return;
    }

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
        const r = await uploadImage(src);
        if (!r.ok) throw new Error(r.error);
        done += 1;
        return r.url;
      });
      setProgress("Saving the website…");
      const r = await saveSite(content);
      if (!r.ok) throw new Error(r.error);
      store.getState().replaceContent(r.content);
      setMessage({ ok: true, text: `${picked.name} is now live on this website.` });
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
            From {picked.file}. Bookings, payments, guest accounts and logins stay as they are.
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

function randomSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const ENV_VARS = [
  { name: "ADMIN_EMAIL", what: "The email you (or the client) will sign in to the admin with." },
  { name: "ADMIN_PASSWORD", what: "A long password only you know. Different for every client." },
  { name: "SESSION_SECRET", what: "Random text that keeps logins secure. Generate one below." },
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

function DeployGuide() {
  const [secret, setSecret] = useState<string | null>(null);
  return (
    <>
      <p className="mb-4 text-[13.5px] text-ops-muted">
        Each client gets a separate Vercel project built from this same code, with its own database and its own admin login.
      </p>
      <Steps>
        <li>
          Open <Ext href="https://vercel.com/new">vercel.com/new</Ext> and import this same GitHub repository again. Name the project after
          the client, for example <span className="font-mono text-[13px]">rose-studio</span>. Do not deploy the existing demo project.
        </li>
        <li>
          In the new project, open <strong className="font-medium">Storage</strong>, create an{" "}
          <strong className="font-medium">Upstash for Redis</strong> database (the free plan is enough to start) and connect it to the project.
          Vercel adds the database settings for you. Create a new database for every client, so no two clients ever share data.
        </li>
        <li>
          Open <strong className="font-medium">Settings → Environment Variables</strong> and add these three:
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
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSecret(randomSecret())}>
              {secret ? "Generate another" : "Generate a SESSION_SECRET"}
            </Button>
            {secret && (
              <span className="flex min-w-0 items-center gap-1 rounded-md bg-ops-bg px-2 py-1">
                <code className="truncate font-mono text-[12px] text-ops-ink">{secret}</code>
                <CopyButton text={secret} label="secret" />
              </span>
            )}
          </div>
        </li>
        <li>
          Deploy. If the project was already deployed before you added the database and variables, open{" "}
          <strong className="font-medium">Deployments</strong> and choose <strong className="font-medium">Redeploy</strong> so they take
          effect.
        </li>
        <li>
          Open the new website&apos;s <span className="font-mono text-[13px]">/login</span> page and sign in with the ADMIN_EMAIL and
          ADMIN_PASSWORD you chose. The admin shows a green <strong className="font-medium">Live</strong> chip when the database is connected.
        </li>
      </Steps>
      <p className="mt-4 rounded-lg bg-ops-bg px-4 py-3 text-[13px] text-ops-muted">
        Good to know: every client website runs the code on this repository&apos;s main branch, so a fix pushed there reaches all of them on
        their next deploy. Client websites are commercial, so they need a Vercel Pro plan, or a project in the client&apos;s own Vercel account.
      </p>
    </>
  );
}

function HandOver() {
  const mode = useSalonStore((s) => s.mode);
  return (
    <Steps>
      <li>
        In the client&apos;s Vercel project, open <strong className="font-medium">Settings → Domains</strong> and add their domain, for example{" "}
        <span className="font-mono text-[13px]">rosestudio.com</span>. Buy it there, or add the records Vercel shows at the company where the
        domain was bought. The site works on its <span className="font-mono text-[13px]">.vercel.app</span> address in the meantime.
      </li>
      <li>
        Under{" "}
        {mode === "live" ? (
          <Link href="/admin/access" className="font-medium underline underline-offset-2">
            Access and data
          </Link>
        ) : (
          <strong className="font-medium">Access and data</strong>
        )}{" "}
        on the client&apos;s website, create the desk login their staff will use for bookings and payments.
      </li>
      <li>
        Give the client their logins. To change the admin login later, edit ADMIN_EMAIL and ADMIN_PASSWORD in Vercel and redeploy.
      </li>
      <li>
        Back here, tick <strong className="font-medium">{mode === "live" ? "Domain and hand-over" : "Launch on its own website"}</strong> as
        done on the{" "}
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
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <Card className="p-5 md:p-6">
      <h2 className="text-[16px] font-semibold text-ops-ink">Start the next client</h2>
      <p className="mb-4 mt-1 text-[13.5px] text-ops-muted">
        Puts the demo back to the sample salon so you can begin a new design. Download the site file first if you want to come back to this
        one.
      </p>
      {confirm ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              resetDemo();
              setConfirm(false);
              setDone(true);
            }}
          >
            Yes, start from the sample
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
            Keep this design
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="secondary" onClick={() => setConfirm(true)}>
            Start from the sample salon
          </Button>
          {done && (
            <span role="status" className="text-[13.5px] text-[#1f5c35]">
              Back to the sample salon.
            </span>
          )}
        </div>
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

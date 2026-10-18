import { redirect } from "next/navigation";
import { LoginForm } from "@/components/ops/login-form";
import { safeNext } from "@/lib/format";
import { getStaffSession } from "@/server/auth/session";
import { env } from "@/server/env";

export const metadata = { title: "Staff sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const raw = (await searchParams).next;
  const next = safeNext(typeof raw === "string" ? raw : null, "");
  const session = await getStaffSession();
  if (session) redirect(next || (session.role === "admin" ? "/admin" : "/desk"));
  return <LoginForm next={next} demoMode={env().DEMO_MODE} />;
}

import { redirect } from "next/navigation";
import { AccessPanel } from "@/components/ops/access-panel";
import { getStaffSession } from "@/server/auth/session";
import { loadStaffAccounts } from "@/server/data/accounts";
import { env } from "@/server/env";

export default async function AccessPage() {
  // Pages render alongside their layout, so this page checks the login itself before reading accounts.
  const session = await getStaffSession();
  if (!session) redirect("/login?next=/admin/access");
  if (session.role !== "admin") redirect("/desk");
  return <AccessPanel me={session} initialAccounts={await loadStaffAccounts()} demoMode={env().DEMO_MODE} />;
}

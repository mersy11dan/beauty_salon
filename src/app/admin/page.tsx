import { redirect } from "next/navigation";
import { SiteBuilder } from "@/components/ops/site-builder";
import { getStaffSession } from "@/server/auth/session";
import { loadStaffAccounts } from "@/server/data/accounts";

export default async function AdminHome() {
  // Pages render alongside their layout, so this page checks the login itself before reading accounts.
  const session = await getStaffSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin") redirect("/desk");
  const accounts = await loadStaffAccounts();
  return <SiteBuilder staffLogin={accounts.some((a) => a.role === "staff")} />;
}

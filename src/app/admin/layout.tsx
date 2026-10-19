import { OpsShell } from "@/components/ops/ops-shell";
import { enterOpsArea } from "@/server/data/ops-area";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, ops } = await enterOpsArea("/admin", ["admin"]);
  return (
    <OpsShell area="Admin" session={session} ops={ops}>
      {children}
    </OpsShell>
  );
}

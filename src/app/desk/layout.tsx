import { OpsShell } from "@/components/ops/ops-shell";
import { enterOpsArea } from "@/server/data/ops-area";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const { session, ops } = await enterOpsArea("/desk", ["staff", "admin"]);
  return (
    <OpsShell area="Desk" session={session} ops={ops}>
      {children}
    </OpsShell>
  );
}

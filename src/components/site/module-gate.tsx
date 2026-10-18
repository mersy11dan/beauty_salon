"use client";

import { ButtonLink } from "@/components/ui/button";
import { useCopy } from "@/lib/site-hooks";
import { useModules } from "@/lib/store";
import type { ModuleKey } from "@/lib/types";

export function ModuleGate({ module, children }: { module: ModuleKey; children: React.ReactNode }) {
  const modules = useModules();
  const copy = useCopy();
  if (modules[module]) return <>{children}</>;
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-24 md:py-32">
      <h1 className="font-display text-display-lg text-ink">{copy.offTitle}</h1>
      {copy.offBody && <p className="max-w-[48ch] text-[16px] leading-[1.6] text-muted">{copy.offBody}</p>}
      <ButtonLink href="/" variant="secondary">
        {copy.offButton}
      </ButtonLink>
    </div>
  );
}

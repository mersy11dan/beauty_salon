"use client";

import { Suspense } from "react";
import { CustomerAuth } from "@/components/site/customer-auth";
import { ModuleGate } from "@/components/site/module-gate";

export default function AccountPage() {
  return (
    <ModuleGate module="booking">
      <Suspense fallback={null}>
        <CustomerAuth />
      </Suspense>
    </ModuleGate>
  );
}

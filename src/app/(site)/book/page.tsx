"use client";

import { Suspense } from "react";
import { BookingForm } from "@/components/site/booking-form";
import { CustomerGate } from "@/components/site/customer-gate";
import { ModuleGate } from "@/components/site/module-gate";
import { PageTitle } from "@/components/site/section";

export default function BookPage() {
  return (
    <ModuleGate module="booking">
      <Suspense fallback={null}>
        <CustomerGate>
          <PageTitle title="Book a time" intro="Takes about a minute. We confirm by text or call, and you pay at the desk." />
          <BookingForm />
        </CustomerGate>
      </Suspense>
    </ModuleGate>
  );
}

"use client";

import { Suspense } from "react";
import { BookingForm, BookingIntro } from "@/components/site/booking-form";
import { ModuleGate } from "@/components/site/module-gate";

export default function BookPage() {
  return (
    <ModuleGate module="booking">
      <Suspense fallback={<BookingIntro />}>
        <BookingForm />
      </Suspense>
    </ModuleGate>
  );
}

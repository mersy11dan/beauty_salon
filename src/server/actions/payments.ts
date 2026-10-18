"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ActionResult, Payment, PaymentStatus } from "@/lib/types";
import { getPublicData } from "../data/public";
import { toPayment } from "../data/ops";
import { db } from "../db";
import { appointments, payments } from "../db/schema";
import { newId } from "../ids";
import { entityId, paymentSchema } from "../validation";
import { asStaff, fail, ok, parseInput } from "./util";

const LEDGER_OFF = "The payment ledger is switched off for this salon.";

function ledgerAction<T>(name: string, fn: () => Promise<ActionResult<T>>) {
  return asStaff(name, ["admin", "staff"], async () => {
    if (!(await getPublicData()).settings.modules.ledger) return fail(LEDGER_OFF);
    return fn();
  });
}

export type NewPayment = Omit<Payment, "id" | "createdAt">;

export async function addPayment(input: NewPayment): Promise<ActionResult<Payment>> {
  return ledgerAction("addPayment", async () => {
    const parsed = parseInput(paymentSchema, input);
    if ("failure" in parsed) return parsed.failure;
    const p = parsed.data;
    let appointmentId = p.appointmentId;
    if (appointmentId) {
      const [apt] = await db.select({ id: appointments.id }).from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
      if (!apt) appointmentId = null;
    }
    const [row] = await db
      .insert(payments)
      .values({ id: newId("pay"), amount: Math.round(p.amount * 100) / 100, label: p.label, method: p.method, status: p.status, date: p.date, appointmentId })
      .returning();
    return ok(toPayment(row));
  });
}

export async function setPaymentStatus(id: string, status: PaymentStatus): Promise<ActionResult<Payment>> {
  return ledgerAction("setPaymentStatus", async () => {
    const parsed = parseInput(z.object({ id: entityId, status: z.enum(["paid", "unpaid"]) }), { id, status });
    if ("failure" in parsed) return parsed.failure;
    const [row] = await db.update(payments).set({ status: parsed.data.status }).where(eq(payments.id, parsed.data.id)).returning();
    if (!row) return fail("That payment was removed. Refresh to see the latest list.");
    return ok(toPayment(row));
  });
}

export async function deletePayment(id: string): Promise<ActionResult> {
  return ledgerAction("deletePayment", async () => {
    const parsed = parseInput(entityId, id);
    if ("failure" in parsed) return parsed.failure;
    await db.delete(payments).where(eq(payments.id, parsed.data));
    return ok(null);
  });
}

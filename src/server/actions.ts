"use server";

import { addDays, todayISO } from "@/lib/dates";
import { uid } from "@/lib/format";
import { availableSlots } from "@/lib/slots";
import type {
  Appointment,
  AppointmentStatus,
  Customer,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Session,
  SiteContent,
} from "@/lib/types";
import {
  adminVersion,
  checkPassword,
  endGuestSession,
  endOpsSession,
  fingerprint,
  hashPassword,
  readGuestId,
  readOpsToken,
  sameText,
  startGuestSession,
  startOpsSession,
} from "./auth";
import { adminCredentials, isLive } from "./env";
import {
  customerByEmail,
  customerById,
  deletePayment,
  getAppointment,
  getPayment,
  insertCustomer,
  listAppointments,
  listPayments,
  putMedia,
  readContent,
  readRev,
  readStaffLogin,
  saveAppointment,
  savePayment,
  writeContent,
  writeStaffLogin,
} from "./repo";

type Fail<E extends string = string> = { ok: false; error: E };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const STATUSES: AppointmentStatus[] = ["requested", "confirmed", "completed", "cancelled"];
const METHODS: PaymentMethod[] = ["cash", "card", "transfer"];
const PAY_STATUSES: PaymentStatus[] = ["paid", "unpaid"];

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const normalizeEmail = (v: unknown) => text(v, 200).toLowerCase();
const phoneOk = (v: string) => v.replace(/\D/g, "").length >= 7;
/** Slows down password guessing without a rate-limit store. */
const pause = () => new Promise((r) => setTimeout(r, 400 + Math.random() * 300));

function requireLive() {
  if (!isLive()) throw new Error("This site has no database yet.");
}

async function currentOps(): Promise<Session> {
  const t = await readOpsToken();
  if (!t) return null;
  if (t.role === "admin") {
    const admin = adminCredentials();
    return admin && admin.email === t.email && t.v === adminVersion() ? { role: "admin", email: t.email } : null;
  }
  const staff = await readStaffLogin();
  return staff && staff.email === t.email && t.v === fingerprint(staff.hash) ? { role: "staff", email: t.email } : null;
}

async function currentCustomer(): Promise<Customer | null> {
  const id = await readGuestId();
  const c = id ? await customerById(id) : null;
  return c ? { ...c, password: "" } : null;
}

/** Thrown errors reach the browser without their message in production, so staff writes report failures instead. */
async function opsCheck(admin = false): Promise<Fail | null> {
  if (!isLive()) return { ok: false, error: "This site has no database yet." };
  const s = await currentOps();
  if (s && (!admin || s.role === "admin")) return null;
  return { ok: false, error: "You were signed out. Sign in again, then repeat the last change." };
}

const NOT_SAVED: Fail = { ok: false, error: "That change could not be saved. Reload the page and try again." };

// --- Loading ------------------------------------------------------------------

export type LiveSnapshot = {
  session: Session;
  customer: Customer | null;
  /** Full bookings for staff; for everyone else only the busy times, without names or numbers. */
  appointments: Appointment[];
  payments: Payment[];
  months: string[];
  staffEmail: string | null;
  rev: number;
};

export async function loadLive(months: string[]): Promise<LiveSnapshot> {
  requireLive();
  const wanted = Array.from(new Set(months.filter((m) => MONTH_RE.test(m)))).slice(0, 12);
  const [session, customer] = await Promise.all([currentOps(), currentCustomer()]);
  if (session) {
    const [appointments, payments, rev, staff] = await Promise.all([
      listAppointments(wanted),
      listPayments(wanted),
      readRev(),
      session.role === "admin" ? readStaffLogin() : Promise.resolve(null),
    ]);
    return { session, customer, appointments, payments, months: wanted, staffEmail: staff?.email ?? null, rev };
  }
  const from = addDays(todayISO(), -1);
  const busy = (await listAppointments(wanted))
    .filter((a) => a.date >= from && a.status !== "cancelled")
    .map(
      (a): Appointment => ({
        id: a.id,
        serviceId: "",
        staffId: a.staffId,
        date: a.date,
        time: a.time,
        durationMin: a.durationMin,
        status: a.status,
        guestName: "",
        guestPhone: "",
        createdAt: "",
      }),
    );
  return { session: null, customer, appointments: busy, payments: [], months: wanted, staffEmail: null, rev: 0 };
}

export async function readRevision(): Promise<number | null> {
  if (!isLive() || !(await currentOps())) return null;
  return readRev();
}

// --- Site content (admin) -----------------------------------------------------

export async function saveSite(content: SiteContent): Promise<{ ok: true; content: SiteContent } | Fail> {
  const denied = await opsCheck(true);
  if (denied) return denied;
  try {
    return { ok: true, content: await writeContent(content) };
  } catch {
    return { ok: false, error: "The database did not accept the change. Try again in a moment." };
  }
}

export async function uploadImage(dataUrl: string): Promise<{ ok: true; url: string } | Fail> {
  const denied = await opsCheck(true);
  if (denied) return denied;
  try {
    return { ok: true, url: await putMedia(dataUrl) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

// --- Staff and admin sign-in -----------------------------------------------------

export async function opsSignIn(
  emailRaw: string,
  password: string,
): Promise<{ ok: true; session: NonNullable<Session> } | Fail<"match" | "setup">> {
  requireLive();
  const email = normalizeEmail(emailRaw);
  const admin = adminCredentials();
  if (admin && sameText(email, admin.email) && sameText(String(password), admin.password)) {
    await startOpsSession("admin", email, adminVersion());
    return { ok: true, session: { role: "admin", email } };
  }
  const staff = await readStaffLogin();
  if (staff && staff.email === email && (await checkPassword(String(password), staff.hash))) {
    await startOpsSession("staff", email, fingerprint(staff.hash));
    return { ok: true, session: { role: "staff", email } };
  }
  await pause();
  return { ok: false, error: admin ? "match" : "setup" };
}

export async function opsSignOut() {
  await endOpsSession();
}

export async function saveStaffLogin(emailRaw: string, password: string): Promise<{ ok: true } | Fail> {
  const denied = await opsCheck(true);
  if (denied) return denied;
  const email = normalizeEmail(emailRaw);
  if (!EMAIL_RE.test(email) || typeof password !== "string" || password.length < 6) {
    return { ok: false, error: "Use a real email and a password of at least 6 characters." };
  }
  if (email === adminCredentials()?.email) return { ok: false, error: "Use a different email from the admin login." };
  await writeStaffLogin({ email, hash: await hashPassword(password) });
  return { ok: true };
}

// --- Guests -------------------------------------------------------------------------

export async function guestSignUp(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
}): Promise<{ ok: true; customer: Customer } | Fail<"exists" | "invalid">> {
  requireLive();
  const name = text(input.name, 120);
  const phone = text(input.phone, 40);
  const email = normalizeEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  if (!name || !phoneOk(phone) || !EMAIL_RE.test(email) || password.length < 6 || password.length > 200) {
    return { ok: false, error: "invalid" };
  }
  const customer: Customer = { id: uid("cus"), name, phone, email, password: await hashPassword(password), createdAt: new Date().toISOString() };
  if (!(await insertCustomer(customer))) return { ok: false, error: "exists" };
  await startGuestSession(customer.id);
  return { ok: true, customer: { ...customer, password: "" } };
}

export async function guestSignIn(emailRaw: string, password: string): Promise<{ ok: true; customer: Customer } | Fail> {
  requireLive();
  const c = await customerByEmail(normalizeEmail(emailRaw));
  if (!c || !(await checkPassword(String(password), c.password))) {
    await pause();
    return { ok: false, error: "match" };
  }
  await startGuestSession(c.id);
  return { ok: true, customer: { ...c, password: "" } };
}

export async function guestSignOut() {
  await endGuestSession();
}

// --- Bookings ---------------------------------------------------------------------------

export async function requestBooking(input: {
  serviceId: string;
  staffId: string | null;
  date: string;
  time: string;
  guestName: string;
  guestPhone: string;
  note?: string;
}): Promise<{ ok: true; appointment: Appointment } | Fail<"taken" | "auth" | "invalid" | "closed">> {
  requireLive();
  const customer = await currentCustomer();
  if (!customer) return { ok: false, error: "auth" };
  const { settings, services, staff } = await readContent();
  if (!settings.modules.booking) return { ok: false, error: "closed" };

  const service = services.find((s) => s.id === input.serviceId);
  const guestName = text(input.guestName, 120);
  const guestPhone = text(input.guestPhone, 40);
  const note = text(input.note, 1000);
  const today = todayISO();
  if (
    !service ||
    !guestName ||
    !phoneOk(guestPhone) ||
    !DATE_RE.test(input.date) ||
    !TIME_RE.test(input.time) ||
    input.date < addDays(today, -1) ||
    input.date > addDays(today, 180)
  ) {
    return { ok: false, error: "invalid" };
  }

  const staffOn = settings.modules.staff && staff.length > 0;
  const eligible = staff.filter((m) => m.serviceIds.length === 0 || m.serviceIds.includes(service.id));
  const staffId = staffOn && input.staffId ? input.staffId : null;
  if (staffId && !eligible.some((m) => m.id === staffId)) return { ok: false, error: "invalid" };

  const slots = availableSlots({
    date: input.date,
    durationMin: service.durationMin,
    hours: settings.hours,
    appointments: await listAppointments([input.date.slice(0, 7)]),
    staffId,
    staffPool: staffOn ? eligible.map((m) => m.id) : [],
    capacity: settings.capacity,
  });
  if (!slots.includes(input.time)) return { ok: false, error: "taken" };

  const appointment: Appointment = {
    id: uid("apt"),
    customerId: customer.id,
    guestName,
    guestPhone,
    serviceId: service.id,
    staffId,
    date: input.date,
    time: input.time,
    durationMin: service.durationMin,
    status: "requested",
    ...(note ? { note } : {}),
    createdAt: new Date().toISOString(),
  };
  await saveAppointment(appointment);
  return { ok: true, appointment };
}

export async function changeAppointmentStatus(id: string, status: AppointmentStatus): Promise<{ ok: true } | Fail> {
  const denied = await opsCheck();
  if (denied) return denied;
  if (!STATUSES.includes(status)) return NOT_SAVED;
  const apt = await getAppointment(String(id));
  if (!apt) return { ok: false, error: "That item was removed on another device. Reload the page." };
  await saveAppointment({ ...apt, status });
  return { ok: true };
}

// --- Payments ------------------------------------------------------------------------------

function cleanPayment(p: Partial<Payment>): Omit<Payment, "id" | "createdAt"> | null {
  const amount = Math.round(Number(p.amount) * 100) / 100;
  const label = text(p.label, 200);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000 || !label) return null;
  if (!METHODS.includes(p.method as PaymentMethod) || !PAY_STATUSES.includes(p.status as PaymentStatus)) return null;
  if (typeof p.date !== "string" || !DATE_RE.test(p.date)) return null;
  const appointmentId = typeof p.appointmentId === "string" ? p.appointmentId.slice(0, 80) : null;
  return { amount, label, method: p.method as PaymentMethod, status: p.status as PaymentStatus, date: p.date, appointmentId };
}

export async function addPaymentLive(input: Omit<Payment, "id" | "createdAt"> & { id?: string }): Promise<{ ok: true; payment: Payment } | Fail> {
  const denied = await opsCheck();
  if (denied) return denied;
  const clean = cleanPayment(input);
  if (!clean) return NOT_SAVED;
  const id = typeof input.id === "string" && /^[\w-]{1,80}$/.test(input.id) ? input.id : uid("pay");
  const payment: Payment = { ...clean, id, createdAt: new Date().toISOString() };
  await savePayment(payment);
  return { ok: true, payment };
}

export async function updatePaymentLive(id: string, patch: Partial<Payment>): Promise<{ ok: true } | Fail> {
  const denied = await opsCheck();
  if (denied) return denied;
  const current = await getPayment(String(id));
  if (!current) return { ok: false, error: "That item was removed on another device. Reload the page." };
  const clean = cleanPayment({ ...current, ...patch, appointmentId: current.appointmentId });
  if (!clean) return NOT_SAVED;
  await savePayment({ ...current, ...clean }, current.date);
  return { ok: true };
}

export async function removePaymentLive(id: string): Promise<{ ok: true } | Fail> {
  const denied = await opsCheck();
  if (denied) return denied;
  const current = await getPayment(String(id));
  if (current) await deletePayment(current);
  return { ok: true };
}

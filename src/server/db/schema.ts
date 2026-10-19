import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Settings } from "@/lib/types";

export const staffRole = pgEnum("staff_role", ["admin", "staff"]);
export const appointmentStatus = pgEnum("appointment_status", ["requested", "confirmed", "completed", "cancelled"]);
export const paymentMethod = pgEnum("payment_method", ["cash", "card", "transfer", "telebirr", "mpesa"]);
export const paymentStatus = pgEnum("payment_status", ["paid", "unpaid"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const money = (name: string) => numeric(name, { precision: 10, scale: 2, mode: "number" });

/** One row (id = 1) holding the whole Settings document. */
export const siteSettings = pgTable(
  "site_settings",
  {
    id: smallint("id").primaryKey().default(1),
    data: jsonb("data").$type<Settings>().notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [check("site_settings_singleton", sql`${t.id} = 1`)],
);

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  durationMin: integer("duration_min").notNull(),
  price: money("price").notNull(),
  note: text("note"),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio").notNull().default(""),
  photoUrl: text("photo_url"),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const staffServices = pgTable(
  "staff_services",
  {
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.staffId, t.serviceId] }), index("staff_services_service_idx").on(t.serviceId)],
);

export const portfolioItems = pgTable("portfolio_items", {
  id: text("id").primaryKey(),
  src: text("src").notNull(),
  alt: text("alt").notNull().default(""),
  caption: text("caption").notNull(),
  category: text("category").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    author: text("author").notNull(),
    text: text("text").notNull(),
    rating: smallint("rating").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check("reviews_rating_range", sql`${t.rating} between 1 and 5`)],
);

export const offers = pgTable("offers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  until: date("until", { mode: "string" }).notNull(),
  active: boolean("active").notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Guests who book on the public site. Emails are stored lower-cased. */
export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Desk and admin logins. Emails are stored lower-cased. */
export const staffUsers = pgTable("staff_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  role: staffRole("role").notNull().default("staff"),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** `id` is the SHA-256 of the cookie token, so a leaked table can't be replayed as cookies. */
export const customerSessions = pgTable(
  "customer_sessions",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("customer_sessions_customer_idx").on(t.customerId)],
);

export const staffSessions = pgTable(
  "staff_sessions",
  {
    id: text("id").primaryKey(),
    staffUserId: text("staff_user_id")
      .notNull()
      .references(() => staffUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("staff_sessions_user_idx").on(t.staffUserId)],
);

export const appointments = pgTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    guestName: text("guest_name").notNull(),
    guestPhone: text("guest_phone").notNull(),
    /** Not a foreign key: a booking outlives the service being removed from the menu. */
    serviceId: text("service_id").notNull(),
    staffId: text("staff_id").references(() => staff.id, { onDelete: "set null" }),
    date: date("date", { mode: "string" }).notNull(),
    time: text("time").notNull(),
    durationMin: integer("duration_min").notNull(),
    status: appointmentStatus("status").notNull().default("requested"),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("appointments_date_idx").on(t.date),
    index("appointments_status_date_idx").on(t.status, t.date),
    index("appointments_customer_idx").on(t.customerId),
    check("appointments_time_format", sql`${t.time} ~ '^[0-2][0-9]:[0-5][0-9]$'`),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    amount: money("amount").notNull(),
    method: paymentMethod("method").notNull(),
    status: paymentStatus("status").notNull(),
    appointmentId: text("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    label: text("label").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("payments_date_idx").on(t.date),
    index("payments_appointment_idx").on(t.appointmentId),
    index("payments_status_idx").on(t.status),
  ],
);

/** Every uploaded photo, so unused ones can be removed from storage later. */
export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey(),
    driver: text("driver").notNull(),
    key: text("key").notNull(),
    url: text("url").notNull().unique(),
    contentType: text("content_type").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: createdAt(),
  },
  (t) => [index("media_created_idx").on(t.createdAt)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

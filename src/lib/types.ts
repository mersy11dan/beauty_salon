export type ModuleKey =
  | "services"
  | "portfolio"
  | "staff"
  | "booking"
  | "ledger"
  | "reviews"
  | "offers";

export type Modules = Record<ModuleKey, boolean>;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** "09:00" style 24h strings. null = closed. */
export type DayHours = { open: string; close: string } | null;

export type Hours = Record<Weekday, DayHours>;

export type Theme = {
  background: string;
  ink: string;
  accent: string;
  surface: string;
};

export type Socials = {
  facebook: string;
  instagram: string;
  x: string;
  tiktok: string;
};

export type HeroSlide = {
  id: string;
  label: string;
  src: string;
  alt: string;
};

export type Settings = {
  name: string;
  tagline: string;
  logoDataUrl: string | null;
  theme: Theme;
  modules: Modules;
  hero: {
    headline: string;
    paragraph: string;
    slides: HeroSlide[];
  };
  about: {
    heading: string;
    body: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    mapUrl: string;
  };
  hours: Hours;
  /** Concurrent bookings allowed when no staff member is chosen. */
  capacity: number;
  socials: Socials;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  durationMin: number;
  price: number;
  note?: string;
};

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
  serviceIds: string[];
};

export type PortfolioItem = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  category: string;
};

export type Review = {
  id: string;
  author: string;
  text: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string;
};

export type Offer = {
  id: string;
  title: string;
  detail: string;
  until: string;
  active: boolean;
};

export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "completed"
  | "cancelled";

export type Appointment = {
  id: string;
  /** Set when the guest booked while signed in to their account. */
  customerId?: string;
  guestName: string;
  guestPhone: string;
  serviceId: string;
  staffId: string | null;
  /** ISO date "YYYY-MM-DD" */
  date: string;
  /** "HH:MM" */
  time: string;
  durationMin: number;
  status: AppointmentStatus;
  note?: string;
  createdAt: string;
};

export type PaymentMethod = "cash" | "card" | "transfer";
export type PaymentStatus = "paid" | "unpaid";

export type Payment = {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  appointmentId: string | null;
  label: string;
  date: string;
  createdAt: string;
};

export type Role = "admin" | "staff";

export type Session = { role: Role; email: string } | null;

/** A guest's own account on the public site. Separate from staff and admin logins. */
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
};

export type SalonData = {
  settings: Settings;
  services: Service[];
  staff: StaffMember[];
  portfolio: PortfolioItem[];
  reviews: Review[];
  offers: Offer[];
  appointments: Appointment[];
  payments: Payment[];
  customers: Customer[];
};

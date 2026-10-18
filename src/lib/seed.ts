import { addDays, todayISO } from "./dates";
import type { Hours, SalonData, Service } from "./types";

export const DEMO_ACCOUNTS = {
  admin: { email: "admin@beautysalon.demo", password: "admin1234" },
  staff: { email: "desk@beautysalon.demo", password: "desk1234" },
};

const hours: Hours = {
  0: null,
  1: { open: "09:00", close: "19:00" },
  2: { open: "09:00", close: "19:00" },
  3: { open: "09:00", close: "19:00" },
  4: { open: "09:00", close: "20:00" },
  5: { open: "09:00", close: "20:00" },
  6: { open: "10:00", close: "18:00" },
};

const services: Service[] = [
  { id: "svc_manicure", name: "Classic manicure", category: "Nails", durationMin: 45, price: 35 },
  { id: "svc_gel", name: "Gel manicure", category: "Nails", durationMin: 60, price: 55, note: "Lasts up to three weeks" },
  { id: "svc_pedicure", name: "Pedicure", category: "Nails", durationMin: 60, price: 50 },
  { id: "svc_nailart", name: "Nail art", category: "Nails", durationMin: 20, price: 15, note: "Added to any manicure" },
  { id: "svc_cut", name: "Cut and blow-dry", category: "Hair", durationMin: 60, price: 70 },
  { id: "svc_mencut", name: "Short cut", category: "Hair", durationMin: 30, price: 35 },
  { id: "svc_colour", name: "Full-head colour", category: "Hair", durationMin: 120, price: 140 },
  { id: "svc_balayage", name: "Balayage", category: "Hair", durationMin: 180, price: 220, note: "Includes toner and blow-dry" },
  { id: "svc_blowdry", name: "Blow-dry", category: "Hair", durationMin: 45, price: 45 },
  { id: "svc_daymakeup", name: "Day makeup", category: "Makeup", durationMin: 45, price: 65 },
  { id: "svc_eveningmakeup", name: "Evening makeup", category: "Makeup", durationMin: 60, price: 90 },
  { id: "svc_bridal", name: "Bridal trial", category: "Makeup", durationMin: 90, price: 150 },
  { id: "svc_brows", name: "Brow shape and tint", category: "Makeup", durationMin: 30, price: 30 },
];

export function createSeed(): SalonData {
  const today = todayISO();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  const now = new Date().toISOString();

  return {
    settings: {
      name: "Beauty Salon",
      tagline: "Nails, hair and makeup, by appointment",
      logoDataUrl: null,
      theme: {
        background: "#F5F1F2",
        ink: "#1E181C",
        accent: "#6E2B3F",
        surface: "#FFFFFF",
      },
      modules: {
        services: true,
        portfolio: true,
        staff: true,
        booking: true,
        ledger: true,
        reviews: true,
        offers: true,
      },
      hero: {
        headline: "Come in as you are. Leave finished.",
        paragraph:
          "A small salon for nails, hair and makeup. Pick a time that suits you, and pay when you are here.",
        slides: [
          { id: "slide_nails", label: "Nails", src: "/media/hero/nails.webp", alt: "A hand with almond-shaped nude gel nails resting on a knitted sleeve" },
          { id: "slide_hair", label: "Hair", src: "/media/hero/hair.webp", alt: "Long brown hair being shaped around a round brush" },
          { id: "slide_makeup", label: "Makeup", src: "/media/hero/makeup.webp", alt: "A powder brush with a swirl of peach blush in the air" },
        ],
      },
      about: {
        heading: "Three chairs, one small room, no rush.",
        body:
          "We opened because we wanted a salon where you are not passed between people. The person who greets you does your nails, or your hair, or your face, start to finish. Bring a reference photo, or bring nothing and tell us about your week.",
      },
      contact: {
        phone: "+1 (555) 014-2200",
        email: "hello@beautysalon.demo",
        address: "14 Linden Row, Second floor",
        mapUrl: "https://maps.google.com/?q=14+Linden+Row",
      },
      hours,
      capacity: 3,
      socials: {
        facebook: "https://facebook.com/",
        instagram: "https://instagram.com/",
        x: "",
        tiktok: "https://tiktok.com/",
      },
    },
    services,
    staff: [
      {
        id: "stf_amara",
        name: "Amara Osei",
        role: "Nail artist",
        bio: "Twelve years on nails. Known for clean cuticle work and natural shapes that last.",
        photo: null,
        serviceIds: ["svc_manicure", "svc_gel", "svc_pedicure", "svc_nailart"],
      },
      {
        id: "stf_lena",
        name: "Lena Novak",
        role: "Stylist and colourist",
        bio: "Trained in Prague and Milan. Soft, lived-in colour and cuts that grow out well.",
        photo: null,
        serviceIds: ["svc_cut", "svc_mencut", "svc_colour", "svc_balayage", "svc_blowdry"],
      },
      {
        id: "stf_yara",
        name: "Yara Haddad",
        role: "Makeup artist",
        bio: "Editorial and bridal. Skin first, then colour. Brings her own kit for trials.",
        photo: null,
        serviceIds: ["svc_daymakeup", "svc_eveningmakeup", "svc_bridal", "svc_brows"],
      },
    ],
    portfolio: [
      { id: "pf_1", src: "/media/hero/nails.webp", alt: "Nude almond gel nails", caption: "Almond gel, sheer nude", category: "Nails" },
      { id: "pf_2", src: "/media/hero/hair.webp", alt: "Round-brush blow-dry on long brown hair", caption: "Round-brush blow-dry", category: "Hair" },
      { id: "pf_3", src: "/media/hero/makeup.webp", alt: "Powder brush with peach blush", caption: "Peach cream blush", category: "Makeup" },
      { id: "pf_4", src: "/media/hero/hair.webp", alt: "Warm brunette balayage", caption: "Warm brunette balayage", category: "Hair" },
      { id: "pf_5", src: "/media/hero/nails.webp", alt: "Short natural manicure", caption: "Short natural manicure", category: "Nails" },
      { id: "pf_6", src: "/media/hero/makeup.webp", alt: "Soft evening makeup", caption: "Soft evening look", category: "Makeup" },
    ],
    reviews: [
      { id: "rv_1", author: "Priya S.", rating: 5, date: addDays(today, -6), text: "Amara shaped my nails exactly the way I had in my head and could not describe. Three weeks later, no lifting." },
      { id: "rv_2", author: "Daniel K.", rating: 5, date: addDays(today, -12), text: "Walked in for a short cut on a Thursday evening. In and out in half an hour, and it still looks sharp." },
      { id: "rv_3", author: "Hana M.", rating: 4, date: addDays(today, -20), text: "Bridal trial with Yara was calm and unhurried. She wrote down every product so I could buy the lipstick." },
      { id: "rv_4", author: "Teodora V.", rating: 5, date: addDays(today, -31), text: "Lena talked me out of going too light and she was right. Best colour I have had." },
    ],
    offers: [
      { id: "of_1", title: "Gel manicure and pedicure together", detail: "Book both in one visit and save $15.", until: addDays(today, 21), active: true },
      { id: "of_2", title: "First visit, 10% off", detail: "For any service on your first appointment. Mention it at the desk.", until: addDays(today, 60), active: true },
    ],
    appointments: [
      { id: "apt_1", guestName: "Maya Chen", guestPhone: "+1 555 010 3301", serviceId: "svc_gel", staffId: "stf_amara", date: today, time: "10:00", durationMin: 60, status: "confirmed", createdAt: now },
      { id: "apt_2", guestName: "Ruth Adeyemi", guestPhone: "+1 555 010 4419", serviceId: "svc_cut", staffId: "stf_lena", date: today, time: "11:30", durationMin: 60, status: "confirmed", createdAt: now },
      { id: "apt_3", guestName: "Sofia Marin", guestPhone: "+1 555 010 7782", serviceId: "svc_daymakeup", staffId: "stf_yara", date: today, time: "14:00", durationMin: 45, status: "requested", note: "Wedding guest, soft look", createdAt: now },
      { id: "apt_4", guestName: "Jonas Berg", guestPhone: "+1 555 010 9023", serviceId: "svc_mencut", staffId: "stf_lena", date: today, time: "16:00", durationMin: 30, status: "requested", createdAt: now },
      { id: "apt_5", guestName: "Elif Kaya", guestPhone: "+1 555 010 2217", serviceId: "svc_balayage", staffId: "stf_lena", date: tomorrow, time: "09:30", durationMin: 180, status: "confirmed", createdAt: now },
      { id: "apt_6", guestName: "Grace Oduya", guestPhone: "+1 555 010 6650", serviceId: "svc_pedicure", staffId: "stf_amara", date: tomorrow, time: "13:00", durationMin: 60, status: "requested", createdAt: now },
      { id: "apt_7", guestName: "Noor Rahman", guestPhone: "+1 555 010 8804", serviceId: "svc_brows", staffId: "stf_yara", date: yesterday, time: "12:00", durationMin: 30, status: "completed", createdAt: now },
      { id: "apt_8", guestName: "Ivan Petrov", guestPhone: "+1 555 010 1176", serviceId: "svc_blowdry", staffId: "stf_lena", date: yesterday, time: "17:00", durationMin: 45, status: "cancelled", createdAt: now },
    ],
    payments: [
      { id: "pay_1", amount: 30, method: "card", status: "paid", appointmentId: "apt_7", label: "Brow shape and tint · Noor Rahman", date: yesterday, createdAt: now },
      { id: "pay_2", amount: 55, method: "cash", status: "paid", appointmentId: null, label: "Gel manicure · walk-in", date: yesterday, createdAt: now },
      { id: "pay_3", amount: 140, method: "transfer", status: "unpaid", appointmentId: null, label: "Full-head colour · deposit pending", date: today, createdAt: now },
    ],
  };
}

import { addDays, todayISO } from "./dates";
import type { Hours, PortfolioItem, SalonData, Service } from "./types";

export const DEMO_ACCOUNTS = {
  admin: { email: "admin@beautysalon.demo", password: "admin1234" },
  staff: { email: "desk@beautysalon.demo", password: "desk1234" },
};

export const DEMO_CUSTOMER = { email: "mahlet.girma@example.com", password: "guest1234" };

/** Long weekdays, a busy Saturday for weddings, and Sunday afternoons after church. */
const hours: Hours = {
  0: { open: "11:00", close: "17:00" },
  1: { open: "08:30", close: "19:30" },
  2: { open: "08:30", close: "19:30" },
  3: { open: "08:30", close: "19:30" },
  4: { open: "08:30", close: "19:30" },
  5: { open: "08:30", close: "19:30" },
  6: { open: "08:00", close: "20:00" },
};

/** Prices in birr, pitched at a boutique salon in Bole (mid-2020s Addis rates). */
const services: Service[] = [
  { id: "svc_manicure", name: "Classic manicure", category: "Nails", durationMin: 45, price: 600 },
  { id: "svc_gel", name: "Gel manicure", category: "Nails", durationMin: 60, price: 1200, note: "Lasts up to three weeks" },
  { id: "svc_pedicure", name: "Pedicure", category: "Nails", durationMin: 60, price: 1000, note: "With a scrub and a short foot massage" },
  { id: "svc_nailart", name: "Nail art", category: "Nails", durationMin: 20, price: 300, note: "Added to any manicure" },
  { id: "svc_cut", name: "Cut and blow-dry", category: "Hair", durationMin: 60, price: 1200 },
  { id: "svc_blowdry", name: "Wash and blow-dry", category: "Hair", durationMin: 45, price: 700 },
  { id: "svc_shuruba", name: "Shuruba", category: "Hair", durationMin: 120, price: 1500, note: "Traditional cornrows, albaso included. Extensions priced on the day" },
  { id: "svc_mencut", name: "Short cut", category: "Hair", durationMin: 30, price: 500 },
  { id: "svc_colour", name: "Full-head colour", category: "Hair", durationMin: 120, price: 4500 },
  { id: "svc_balayage", name: "Balayage", category: "Hair", durationMin: 180, price: 8500, note: "Includes toner and blow-dry" },
  { id: "svc_daymakeup", name: "Day makeup", category: "Makeup", durationMin: 45, price: 2000 },
  { id: "svc_eveningmakeup", name: "Evening makeup", category: "Makeup", durationMin: 60, price: 3500, note: "Weddings, graduations, holidays" },
  { id: "svc_bridal", name: "Bridal trial", category: "Makeup", durationMin: 90, price: 2500, note: "We plan the wedding and melse looks together" },
  { id: "svc_bridalday", name: "Bridal makeup, wedding day", category: "Makeup", durationMin: 180, price: 15000, note: "Lashes and a touch-up kit for the day" },
  { id: "svc_brows", name: "Brow threading and tint", category: "Makeup", durationMin: 30, price: 500 },
];

const HERO_PARAGRAPH =
  "A small salon in Bole for nails, hair and makeup. Pick a time that suits you, and pay when you are here.";

const ABOUT_BODY =
  "We opened because we wanted a salon where you are not passed between people. The person who greets you does your nails, or your hair, or your face, start to finish. Bring a reference photo, or bring nothing and tell us about your week over a cup of buna.";

const CONTACT = {
  phone: "+251911508080",
  email: "hello@beautysalon.demo",
  address: "Bole Road, near Edna Mall, 2nd floor, Addis Ababa",
  mapUrl: "https://maps.google.com/?q=Edna+Mall,+Bole,+Addis+Ababa",
};

/** Copy that shipped before the Ethiopian edition, so a migration can tell untouched text from an owner's edits. */
export const LEGACY_COPY = {
  heroParagraph: "A small salon for nails, hair and makeup. Pick a time that suits you, and pay when you are here.",
  aboutBody:
    "We opened because we wanted a salon where you are not passed between people. The person who greets you does your nails, or your hair, or your face, start to finish. Bring a reference photo, or bring nothing and tell us about your week.",
  customerId: "cus_maya",
};

function portfolioSet(category: string, folder: string, items: [caption: string, alt: string][]): PortfolioItem[] {
  return items.map(([caption, alt], i) => ({
    id: `pf_${folder}_${i + 1}`,
    src: `/media/portfolio/${folder}/${String(i + 1).padStart(2, "0")}.webp`,
    alt,
    caption,
    category,
  }));
}

/** Round-robin merge so the first few items already show every category. */
function interleave<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const longest = Math.max(...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

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
        paragraph: HERO_PARAGRAPH,
        slides: [
          { id: "slide_nails", label: "Nails", src: "/media/hero/nails.webp", alt: "A hand with almond-shaped nude gel nails resting on a knitted sleeve" },
          { id: "slide_hair", label: "Hair", src: "/media/hero/hair.webp", alt: "Long brown hair being shaped around a round brush" },
          { id: "slide_makeup", label: "Makeup", src: "/media/hero/makeup.webp", alt: "A powder brush with a swirl of peach blush in the air" },
        ],
      },
      about: {
        heading: "Three chairs, one small room, no rush.",
        body: ABOUT_BODY,
      },
      contact: CONTACT,
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
        id: "stf_hiwot",
        name: "Hiwot Tesfaye",
        role: "Nail artist",
        bio: "Twelve years on nails, trained in Addis and Dubai. Known for clean cuticle work and natural shapes that last.",
        photo: null,
        serviceIds: ["svc_manicure", "svc_gel", "svc_pedicure", "svc_nailart"],
      },
      {
        id: "stf_meron",
        name: "Meron Alemu",
        role: "Stylist and colourist",
        bio: "Silk presses, shuruba and soft, lived-in colour that grows out well. Ask her about albaso before a holiday.",
        photo: null,
        serviceIds: ["svc_cut", "svc_blowdry", "svc_shuruba", "svc_mencut", "svc_colour", "svc_balayage"],
      },
      {
        id: "stf_selam",
        name: "Selamawit Bekele",
        role: "Makeup artist",
        bio: "Bridal and melse looks, graduations and shoots. Skin first, then colour. Brings her own kit for trials.",
        photo: null,
        serviceIds: ["svc_daymakeup", "svc_eveningmakeup", "svc_bridal", "svc_bridalday", "svc_brows"],
      },
    ],
    portfolio: interleave([
      portfolioSet("Nails", "nails", [
        ["Cherry-print almond set", "Long almond nails with hand-painted red cherries"],
        ["Jade marble gel", "Almond nails in translucent green jade marble"],
        ["Classic wine red", "Glossy wine-red oval nails"],
        ["Deep green cat-eye", "Short dark green cat-eye nails"],
        ["Champagne glitter ombré", "Sheer nude stiletto nails fading into gold glitter"],
        ["Pistachio French with daisies", "Mint French tips with tiny daisies"],
        ["Leopard French tips", "Nude almond nails with leopard-print tips"],
        ["Milky white almond", "Milky white medium almond nails"],
        ["Navy velvet", "Short navy blue almond nails"],
      ]),
      portfolioSet("Hair", "hair", [
        ["Nineties bouncy blow-out", "Golden blonde hair with voluminous curled ends"],
        ["Hollywood curls", "Deep brunette set in tight glossy curls"],
        ["Glass-finish curls", "Dark hair with mirror-shine bouncy curls"],
        ["Bronde balayage", "Long layered hair with sunlit bronde balayage"],
        ["Natural curl definition", "Long defined natural curls"],
        ["Caramel waves", "Honey-brown hair in soft loose waves"],
        ["Chocolate ringlets", "Rich chocolate-brown hair in long ringlets"],
        ["Butterfly cut with bangs", "Layered butterfly cut with wispy bangs"],
      ]),
      portfolioSet("Makeup", "makeup", [
        ["Soft sculpted glam", "Warm sculpted contour with a muted mauve lip"],
        ["Graphic pink liner", "Editorial pink graphic eyeliner with a dark lip"],
        ["Rose flush", "Rosy blush with glossy nude lips and a sleek bun"],
        ["Old-Hollywood wave", "Soft pink glam with a sculpted finger wave"],
        ["Painted leopard", "Playful painted leopard spots across the cheekbone"],
        ["Barely-there glow", "Fresh dewy skin with peach blush"],
        ["Deep bronze glam", "Bronze shimmer on deep skin with a glossy lip"],
        ["Sharp winged liner", "Dramatic winged eyeliner and a brown lip"],
        ["Smoky bridal", "Soft smoky eye with full lashes for a bride"],
        ["Golden-hour bronze", "Warm bronze glam with gold statement earrings"],
      ]),
    ]),
    reviews: [
      { id: "rv_1", author: "Bethlehem A.", rating: 5, date: addDays(today, -6), text: "Hiwot shaped my nails exactly the way I had in my head and could not describe. Three weeks later, no lifting." },
      { id: "rv_2", author: "Dawit G.", rating: 5, date: addDays(today, -12), text: "Walked in for a short cut on a Thursday evening. In and out in half an hour, and it still looks sharp." },
      { id: "rv_3", author: "Hanna M.", rating: 4, date: addDays(today, -20), text: "Bridal trial with Selam was calm and unhurried. She planned my wedding and melse looks together and wrote down every product." },
      { id: "rv_4", author: "Tsion K.", rating: 5, date: addDays(today, -31), text: "Meron talked me out of going too light and she was right. Best colour I have had." },
      { id: "rv_5", author: "Rahel W.", rating: 5, date: addDays(today, -44), text: "Shuruba for Timket, done in under two hours and still neat a week later. They made buna while I waited." },
    ],
    offers: [
      { id: "of_1", title: "Gel manicure and pedicure together", detail: "Book both in one visit and save 300 Br.", until: addDays(today, 21), active: true },
      { id: "of_2", title: "Wedding season", detail: "Book the bridal trial and the wedding-day makeup together and get 15% off both.", until: addDays(today, 60), active: true },
      { id: "of_3", title: "First visit, 10% off", detail: "For any service on your first appointment. Mention it at the desk.", until: addDays(today, 90), active: true },
    ],
    appointments: [
      { id: "apt_1", customerId: "cus_mahlet", guestName: "Mahlet Girma", guestPhone: "+251911223344", serviceId: "svc_gel", staffId: "stf_hiwot", date: today, time: "10:00", durationMin: 60, status: "confirmed", createdAt: now },
      { id: "apt_2", guestName: "Ruth Haile", guestPhone: "+251912456789", serviceId: "svc_cut", staffId: "stf_meron", date: today, time: "11:30", durationMin: 60, status: "confirmed", createdAt: now },
      { id: "apt_3", guestName: "Sara Getachew", guestPhone: "+251923118540", serviceId: "svc_daymakeup", staffId: "stf_selam", date: today, time: "14:00", durationMin: 45, status: "requested", note: "Wedding guest, soft look", createdAt: now },
      { id: "apt_4", guestName: "Yonas Mekonnen", guestPhone: "+251700345612", serviceId: "svc_mencut", staffId: "stf_meron", date: today, time: "16:00", durationMin: 30, status: "requested", createdAt: now },
      { id: "apt_5", guestName: "Eden Wolde", guestPhone: "+251944870231", serviceId: "svc_balayage", staffId: "stf_meron", date: tomorrow, time: "09:30", durationMin: 180, status: "confirmed", createdAt: now },
      { id: "apt_6", guestName: "Kidist Abera", guestPhone: "+251913667205", serviceId: "svc_pedicure", staffId: "stf_hiwot", date: tomorrow, time: "13:00", durationMin: 60, status: "requested", createdAt: now },
      { id: "apt_7", guestName: "Meklit Assefa", guestPhone: "+251710998234", serviceId: "svc_shuruba", staffId: "stf_meron", date: tomorrow, time: "15:00", durationMin: 120, status: "requested", note: "Albaso for a wedding on Sunday", createdAt: now },
      { id: "apt_8", guestName: "Saron Desta", guestPhone: "+251930552418", serviceId: "svc_brows", staffId: "stf_selam", date: yesterday, time: "12:00", durationMin: 30, status: "completed", createdAt: now },
      { id: "apt_9", guestName: "Lidya Tadesse", guestPhone: "+251921776043", serviceId: "svc_blowdry", staffId: "stf_meron", date: yesterday, time: "17:00", durationMin: 45, status: "cancelled", createdAt: now },
    ],
    payments: [
      { id: "pay_1", amount: 500, method: "telebirr", status: "paid", appointmentId: "apt_8", label: "Brow threading and tint · Saron Desta", date: yesterday, createdAt: now },
      { id: "pay_2", amount: 1200, method: "cash", status: "paid", appointmentId: null, label: "Gel manicure · walk-in", date: yesterday, createdAt: now },
      { id: "pay_3", amount: 4500, method: "transfer", status: "unpaid", appointmentId: null, label: "Full-head colour · deposit pending", date: today, createdAt: now },
    ],
    customers: [
      { id: "cus_mahlet", name: "Mahlet Girma", phone: "+251911223344", ...DEMO_CUSTOMER, createdAt: now },
    ],
  };
}

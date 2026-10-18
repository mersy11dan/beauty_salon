/**
 * Every fixed phrase on the public site. The admin stores only the phrases it
 * changed (`settings.copy`), so new phrases added here show their default on
 * sites that were set up before they existed.
 */
type FieldDef = {
  label: string;
  value: string;
  hint?: string;
  long?: boolean;
  /** Blank hides the text. Otherwise blank falls back to the default. */
  optional?: boolean;
  tokens?: readonly string[];
};

type GroupDef = {
  id: string;
  title: string;
  description: string;
  href: string;
  fields: Record<string, FieldDef>;
};

export const COPY_GROUPS = [
  {
    id: "menu",
    title: "Menu and footer",
    description: "The links across the top of every page, and the line at the very bottom.",
    href: "/",
    fields: {
      navServices: { label: "Services link", value: "Services" },
      navPortfolio: { label: "Portfolio link", value: "Portfolio" },
      navTeam: { label: "Team link", value: "Team" },
      navOffers: { label: "Offers link", value: "Offers" },
      navReviews: { label: "Reviews link", value: "Reviews" },
      navVisit: { label: "Visit link", value: "Visit" },
      navBook: { label: "Book link", value: "Book" },
      footerLine: { label: "Footer line", value: "© {year} {name}. {address}.", optional: true, tokens: ["year", "name", "address"] },
      footerStaffLink: { label: "Staff sign-in link", value: "Staff sign in", optional: true, hint: "Blank hides the link. Staff can still go to /login." },
    },
  },
  {
    id: "hero",
    title: "Homepage: top",
    description: "Buttons under the headline and the moving script ticker. The headline itself is on the Homepage step.",
    href: "/",
    fields: {
      heroBook: { label: "Main button (booking on)", value: "Book a time" },
      heroServices: { label: "Main button (booking off)", value: "See services" },
      heroCall: { label: "Main button (no booking or services)", value: "Call to book" },
      heroPrices: { label: "Second button", value: "Prices", optional: true },
      marqueeExtra: { label: "Last word in the ticker", value: "By appointment", optional: true, hint: "The ticker repeats the photo labels, then this." },
    },
  },
  {
    id: "home",
    title: "Homepage: sections",
    description: "Small labels, titles and links for each block further down the homepage.",
    href: "/",
    fields: {
      homeServicesLabel: { label: "Services: small label", value: "Services", optional: true },
      homeServicesTitle: { label: "Services: title", value: "Priced up front" },
      homeServicesIntro: {
        label: "Services: intro",
        value: "Times are how long to set aside, including a chat at the start. Hover a line to see the kind of work it means.",
        long: true,
        optional: true,
      },
      homeServicesLink: { label: "Services: link", value: "Full list" },
      homePortfolioLabel: { label: "Portfolio: small label", value: "Portfolio", optional: true },
      homePortfolioTitle: { label: "Portfolio: title", value: "Recent work" },
      homePortfolioLink: { label: "Portfolio: link", value: "See everything" },
      homeAboutLabel: { label: "About: small label", value: "About", optional: true },
      homeOffersMore: { label: "Offers band: button (several)", value: "All {count} offers", tokens: ["count"] },
      homeOffersOne: { label: "Offers band: button (one)", value: "Details" },
      homeOffersUntil: { label: "Offers band: end date", value: "Until {date}.", optional: true, tokens: ["date"] },
      homeReviewsLabel: { label: "Reviews: small label", value: "Reviews", optional: true },
      homeReviewsTitle: { label: "Reviews: title", value: "Kind words" },
      homeReviewsLink: { label: "Reviews: link", value: "All {count} reviews", tokens: ["count"] },
      homeVisitLabel: { label: "Visit: small label", value: "Find us", optional: true },
      homeVisitTitle: { label: "Visit: title", value: "Visit" },
      homeVisitMaps: { label: "Visit: map link", value: "Open in maps" },
      homeVisitBook: { label: "Visit: button", value: "Book a time" },
      hoursClosed: { label: "Opening hours: closed day", value: "Closed" },
    },
  },
  {
    id: "services",
    title: "Services page",
    description: "The full price list.",
    href: "/services",
    fields: {
      servicesTitle: { label: "Title", value: "Services and prices" },
      servicesIntroBooking: {
        label: "Intro (booking on)",
        value: "Choose anything on the list to book it. If you are not sure what you need, book the closest thing and we will adjust on the day.",
        long: true,
        optional: true,
      },
      servicesIntroNoBooking: {
        label: "Intro (booking off)",
        value: "If you are not sure what you need, call and describe it. We will tell you what to book and how long to set aside.",
        long: true,
        optional: true,
      },
      servicesFootnote: { label: "Note above the button", value: "Prices are what you pay at the desk. Nothing is charged online.", optional: true },
      servicesBook: { label: "Button", value: "Book a time" },
      servicesEmpty: { label: "When the list is empty", value: "No services have been added yet." },
    },
  },
  {
    id: "portfolio",
    title: "Portfolio page",
    description: "The photo gallery and its filters.",
    href: "/portfolio",
    fields: {
      portfolioLabel: { label: "Small label", value: "Portfolio", optional: true },
      portfolioTitle: { label: "Title", value: "Recent work" },
      portfolioIntro: {
        label: "Intro",
        value: "Work from the last few months. Every photo is a real client who said yes to being shown.",
        long: true,
        optional: true,
      },
      portfolioAll: { label: "Filter: everything", value: "All" },
      portfolioPhoto: { label: "Count: one photo", value: "photo" },
      portfolioPhotos: { label: "Count: several photos", value: "photos" },
      portfolioView: { label: "Label that follows the pointer", value: "View" },
      portfolioEmpty: { label: "When there are no photos", value: "Nothing here yet." },
    },
  },
  {
    id: "team",
    title: "Team page",
    description: "Staff profiles.",
    href: "/team",
    fields: {
      teamTitle: { label: "Title", value: "The team" },
      teamIntro: { label: "Intro", value: "Whoever you book with sees you through from start to finish.", optional: true, long: true },
      teamDoes: { label: "Before each person's services", value: "Does:" },
      teamBook: { label: "Button", value: "Book with {name}", tokens: ["name"], hint: "{name} is the person's first name." },
      teamEmpty: { label: "When there is no one", value: "No team members have been added yet." },
    },
  },
  {
    id: "reviews",
    title: "Reviews page",
    description: "Client quotes.",
    href: "/reviews",
    fields: {
      reviewsTitle: { label: "Title", value: "Reviews" },
      reviewsIntro: {
        label: "Intro",
        value: "{average} out of 5 across {count} reviews. Written by clients after their visit.",
        optional: true,
        long: true,
        tokens: ["average", "count"],
      },
      reviewsEmpty: { label: "When there are no reviews", value: "No reviews yet." },
    },
  },
  {
    id: "offers",
    title: "Offers page",
    description: "Promotions that are running now.",
    href: "/offers",
    fields: {
      offersTitle: { label: "Title", value: "Offers" },
      offersIntro: { label: "Intro", value: "Mention the offer when you arrive. They cannot be combined with each other.", optional: true, long: true },
      offersValid: { label: "End date line", value: "Valid until {date}", tokens: ["date"] },
      offersEmpty: { label: "When nothing is running", value: "There are no offers running right now." },
      offersBook: { label: "Button", value: "Book a time" },
    },
  },
  {
    id: "booking",
    title: "Booking page",
    description: "Every step of the booking form, the summary card and its messages.",
    href: "/book",
    fields: {
      bookTitle: { label: "Title", value: "Book a time" },
      bookIntro: { label: "Intro", value: "Takes about a minute. We confirm by text or call, and you pay at the desk.", optional: true, long: true },
      bookStep: { label: "Step counter", value: "Step {n} of {total}", tokens: ["n", "total"] },
      bookStepService: { label: "Step: service", value: "What would you like?" },
      bookStepStaff: { label: "Step: person", value: "With whom?" },
      bookStepWhen: { label: "Step: time", value: "When?" },
      bookStepDetails: { label: "Step: details", value: "Your details" },
      bookAnyone: { label: "Anyone option", value: "Anyone available" },
      bookAnyoneNote: { label: "Anyone option, small line", value: "Whoever is free first" },
      bookNoStaff: { label: "No one does this service", value: "No one is assigned to this service yet. We will match you on the day." },
      bookDay: { label: "Day heading", value: "Day" },
      bookTime: { label: "Time heading", value: "Time" },
      bookToday: { label: "Today", value: "Today" },
      bookMorning: { label: "Morning", value: "Morning" },
      bookAfternoon: { label: "Afternoon", value: "Afternoon" },
      bookEvening: { label: "Evening", value: "Evening" },
      bookPickServiceFirst: { label: "Before a service is chosen", value: "Choose a service first and the free times will show here." },
      bookNothingFree: { label: "No free times that day", value: "Nothing free on {date} for {service}. Try another day.", tokens: ["date", "service"] },
      bookNoDays: { label: "No open days", value: "There are no open days in the next few weeks. Call {phone} and we will find a time.", tokens: ["phone"] },
      bookNoServices: { label: "No services", value: "No services have been added yet. Call us and we will book you in." },
      bookSignedIn: { label: "Signed-in line", value: "Signed in as {email}.", tokens: ["email"] },
      bookSignOut: { label: "Sign-out link", value: "Not you? Sign out" },
      bookName: { label: "Name field", value: "Name" },
      bookPhone: { label: "Phone field", value: "Phone" },
      bookPhoneHint: { label: "Phone hint", value: "We confirm by text or call.", optional: true },
      bookNote: { label: "Notes field", value: "Anything we should know (optional)" },
      bookNotePlaceholder: { label: "Notes example text", value: "Allergies, a reference photo you will bring, running late from work…", optional: true },
      bookErrTime: { label: "Error: no time", value: "Pick a time that suits you." },
      bookErrName: { label: "Error: no name", value: "Add the name we should ask for." },
      bookErrPhone: { label: "Error: no phone", value: "Add a phone number we can reach you on." },
      bookTaken: { label: "Error: time just taken", value: "Sorry, that time was just taken. Pick another one." },
      bookSummaryLabel: { label: "Summary: small label", value: "Summary", optional: true },
      bookSummaryTitle: { label: "Summary: title", value: "Your visit" },
      bookRowService: { label: "Summary: service", value: "Service" },
      bookRowTakes: { label: "Summary: length", value: "Takes" },
      bookRowWith: { label: "Summary: person", value: "With" },
      bookRowDay: { label: "Summary: day", value: "Day" },
      bookRowTime: { label: "Summary: time", value: "Time" },
      bookRowPrice: { label: "Summary: price", value: "Price" },
      bookToPay: { label: "Summary: total line", value: "To pay at the desk" },
      bookSubmit: { label: "Button", value: "Request this time" },
      bookHintService: { label: "Hint: start", value: "Start by choosing a service." },
      bookHintTime: { label: "Hint: pick a time", value: "Next, pick a day and a time." },
      bookHintDetails: { label: "Hint: details", value: "Last step: your name and phone number." },
      bookHintReady: { label: "Hint: ready", value: "Nothing is charged online. We confirm by text or call." },
    },
  },
  {
    id: "booked",
    title: "After booking",
    description: "The thank-you screen a guest sees once the request is sent.",
    href: "/book",
    fields: {
      doneLabel: { label: "Small label", value: "Request sent", optional: true },
      doneTitle: { label: "Title", value: "Thank you, {name}", tokens: ["name"] },
      doneIntro: {
        label: "Intro",
        value: "Someone at the desk will text or call {phone} to confirm. If you need to change anything before then, call {salonPhone}.",
        long: true,
        optional: true,
        tokens: ["phone", "salonPhone"],
      },
      doneVisit: { label: "Card label", value: "Your visit" },
      doneTimeRange: { label: "Time line", value: "{start} to {end}", tokens: ["start", "end"] },
      doneAnyone: { label: "Person, when anyone", value: "Whoever is free first" },
      donePayment: { label: "Payment note", value: "Payment is at the desk, after the appointment. Cash, card or transfer.", optional: true, long: true },
      doneFindUs: { label: "Address label", value: "Find us" },
      doneHome: { label: "Button: homepage", value: "Back to the homepage" },
      doneAnother: { label: "Button: book again", value: "Book another" },
    },
  },
  {
    id: "account",
    title: "Guest sign-in page",
    description: "Where guests sign in or create an account before booking.",
    href: "/account",
    fields: {
      accountTitle: { label: "Title", value: "Before you book" },
      accountIntro: {
        label: "Intro",
        value: "Sign in, or create an account if it is your first time. We keep your details so the next booking takes seconds.",
        long: true,
        optional: true,
      },
      accountTabSignIn: { label: "Tab: sign in", value: "Sign in" },
      accountTabCreate: { label: "Tab: new account", value: "Create account" },
      accountEmail: { label: "Email field", value: "Email" },
      accountPassword: { label: "Password field", value: "Password" },
      accountName: { label: "Name field", value: "Name" },
      accountPhone: { label: "Phone field", value: "Phone" },
      accountPhoneHint: { label: "Phone hint", value: "We confirm bookings by text or call.", optional: true },
      accountPasswordHint: { label: "Password hint", value: "At least 6 characters.", optional: true },
      accountSignInButton: { label: "Sign-in button", value: "Sign in and continue" },
      accountCreateButton: { label: "New account button", value: "Create account and continue" },
      accountFirstTime: { label: "Switch line (to new account)", value: "First time here?" },
      accountCreateLink: { label: "Switch link (to new account)", value: "Create an account" },
      accountHaveOne: { label: "Switch line (to sign in)", value: "Already have an account?" },
      accountSignInLink: { label: "Switch link (to sign in)", value: "Sign in" },
      accountStaff: { label: "Staff line", value: "Work at the salon?", optional: true, hint: "Blank hides the staff line." },
      accountStaffLink: { label: "Staff link", value: "Staff sign in" },
      accountErrMatch: { label: "Error: wrong password", value: "That email and password do not match." },
      accountErrName: { label: "Error: no name", value: "Add the name we should ask for." },
      accountErrPhone: { label: "Error: no phone", value: "Add a phone number we can reach you on." },
      accountErrEmail: { label: "Error: bad email", value: "Add an email address, like name@example.com." },
      accountErrPassword: { label: "Error: short password", value: "Use at least 6 characters." },
      accountErrExists: { label: "Error: account exists", value: "There is already an account with this email. Sign in instead." },
    },
  },
  {
    id: "off",
    title: "Switched-off pages",
    description: "What someone sees if they open a page you turned off.",
    href: "/",
    fields: {
      offTitle: { label: "Title", value: "This page is not available." },
      offBody: { label: "Text", value: "It is switched off for this salon. Everything else on the site still works.", optional: true, long: true },
      offButton: { label: "Button", value: "Back to the homepage" },
    },
  },
] as const satisfies readonly GroupDef[];

type Groups = typeof COPY_GROUPS;
type FieldsOf<G> = G extends { fields: infer F } ? keyof F : never;

export type CopyKey = FieldsOf<Groups[number]> & string;
export type Copy = Record<CopyKey, string>;
export type CopyOverrides = Partial<Record<string, string>>;

const FIELDS = new Map<string, FieldDef>();
for (const g of COPY_GROUPS) for (const [k, f] of Object.entries(g.fields)) FIELDS.set(k, f);

export const DEFAULT_COPY = Object.fromEntries([...FIELDS].map(([k, f]) => [k, f.value])) as Copy;

export function copyField(key: string): FieldDef | undefined {
  return FIELDS.get(key);
}

export function resolveCopy(overrides: CopyOverrides | undefined): Copy {
  const out = { ...DEFAULT_COPY };
  if (!overrides) return out;
  for (const [k, v] of Object.entries(overrides)) {
    const f = FIELDS.get(k);
    if (!f || typeof v !== "string") continue;
    if (v.trim() === "" && !f.optional) continue;
    out[k as CopyKey] = v;
  }
  return out;
}

/** Replaces `{token}` placeholders; unknown tokens are left as typed. */
export function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

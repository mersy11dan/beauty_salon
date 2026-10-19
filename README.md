# Beauty salon website builder

A salon website with online booking, a front desk for staff, and an admin that changes everything on the public site: name, logo, 48 colour palettes, fonts, every piece of text, photos, prices and opening hours. Built with Next.js 16, Postgres and Drizzle ORM. Everything runs on free tiers.

- **Public site**: services, team, portfolio, reviews, offers and booking. Guests create an account to book.
- **Desk** (`/desk`): confirm requests, work through the day, record payments.
- **Admin** (`/admin`): a site builder that walks through brand, colours and fonts, pages, homepage, services, team, photos, reviews, offers, contact and hours, site text, launch, and staff logins.

## Demo and live

The same code runs as your showcase demo and as each client's own website. Every deployment has its own Postgres database.

| | `DEMO_MODE` | What it means |
| --- | --- | --- |
| **Demo** | `true` | The sample site you design client sites on. Demo logins can be shown on the sign-in pages, and **Reset demo data** puts the sample salon back. |
| **Live** | `false` | A client's own website. No demo logins, no reset. Admin edits go public as soon as they save. |

The admin shows a grey **Demo** or green **Live** chip next to its name so you always know which one you are in.

## Selling a website to a client

The admin opens on **Site builder**, which walks through the work in three stages and ticks off each step once it differs from the sample salon.

1. **Make it theirs:** name and logo, colours and fonts, and which pages they pay for.
2. **Fill it in:** homepage, services and prices, team, portfolio, reviews, offers, contact and hours, and (optionally) any piece of site text.
3. **Hand it over:** on **Launch**, download the site file, then:
   1. On [vercel.com/new](https://vercel.com/new), import **this same repository** as a new project named after the client.
   2. In that project's **Storage** tab, create a **Neon** Postgres database and connect it. Vercel adds `DATABASE_URL` for you. Use a new database for every client, so no two clients share data.
   3. Create a [Cloudinary](https://cloudinary.com) account for the client and set the [environment variables](#production) with `DEMO_MODE=false`.
   4. Deploy, or redeploy if the project already existed before the database and variables were added. The first production deploy creates the tables, the sample salon and the admin login.
   5. Sign in at `/login` on the new site with the admin email and password, open **Launch** and load the site file. Photos upload into the client's own Cloudinary.
   6. Add the client's domain under **Settings → Domains**.
   7. Create the desk login for their staff under **Access and data**, and give the client their logins.

Back on the demo, **Start from the sample salon** on the Launch page resets the demo for the next client. Site files load back into the demo too, so you can pause one client's design and pick it up later. A site file holds the whole design with its photos inlined; bookings, payments and accounts are never in it.

## How it fits together

| Part | What it uses | Free tier |
| --- | --- | --- |
| Database | Postgres via Drizzle ORM and `postgres.js` | [Neon](https://neon.tech) free plan |
| Photos | Local disk in development, [Cloudinary](https://cloudinary.com) in production | Cloudinary free plan, 25 credits a month, no card |
| Logins | Own code: scrypt password hashes, database sessions in httpOnly cookies, rate limits in Postgres | Nothing to pay for |
| Hosting | Any Node host that runs Next.js 16 | Vercel Hobby or Netlify free |

- Staff and guests have separate logins and cookies. Sessions are stored as SHA-256 hashes, slide forward with use (staff 14 days, guests 60 days), and end on sign-out or password change.
- Sign-in and sign-up are rate limited per email and per IP address.
- Every write goes through a Server Action or Route Handler that checks the role and validates input with zod.
- Bookings are checked again on the server inside a transaction with a per-day lock, so two guests can't take the last free chair. The availability API returns times only, never other guests' details.
- The public site is cached and expires the moment an admin saves a change.
- Uploaded photos are resized in the browser, stripped of location data, checked by their file bytes on the server, and served from Cloudinary's CDN as WebP or AVIF. Unused photos are cleaned up after a day.

## Run it locally

You need Node 20 or newer and Postgres 14 or newer.

```bash
npm ci
cp .env.example .env.local        # the defaults point at the local database below

# Start Postgres, either with Docker...
docker compose up -d
# ...or with a local install, creating the same user and database:
#   createuser -P salon   (password: salon)
#   createdb -O salon salon

npm run db:setup                   # create tables, then add the sample salon and demo logins
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open http://localhost:3000 (not 127.0.0.1).

| Demo login | Email | Password |
| --- | --- | --- |
| Admin | admin@beautysalon.demo | admin1234 |
| Desk | desk@beautysalon.demo | desk1234 |
| Guest | mahlet.girma@example.com | guest1234 |

Without Cloudinary set, uploaded photos go to `.data/uploads` and are served from `/uploads/...`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run db:migrate` | Applies new migrations from `drizzle/`. Safe to run any time. |
| `npm run db:seed` | Adds the sample content to empty tables and creates or updates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. |
| `npm run db:setup` | Migrate, then seed with demo logins and sample bookings. Needs `DEMO_MODE=true`. |
| `npm run db:reset` | Like `db:setup`, but empties content, bookings, payments and guests first. Needs `DEMO_MODE=true`. |
| `npm run db:generate` | After editing `src/server/db/schema.ts`, writes the next migration. |
| `npm run db:studio` | Opens Drizzle Studio to browse the data. |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | Checks. |

## Production

Do this once for the demo (with `DEMO_MODE=true`) and once for every client (with `DEMO_MODE=false`).

Every page reads from the database, so a deployment without one shows only the "We'll be right back" page and `/api/health` reports the database as down.

1. **Database.** On Vercel, open the project's **Storage** tab, create a **Neon** database and connect it to the project; Vercel adds `DATABASE_URL`. Pick the region closest to the salon (Frankfurt for Ethiopia), then set the same region under the project's **Settings → Functions**, because Vercel runs functions in Washington, D.C. (`iad1`) by default. On the demo, turn on **Preview** branching when connecting, so preview deployments get their own copy of the database instead of the live one. Neon Free allows 10 branches per database and drops a preview branch only when its deployment is deleted, so remove old `preview/...` branches in the Neon console now and then. Elsewhere, create a free Neon project and copy the **pooled** connection string (its host contains `-pooler`).
2. **Photos.** Create a free Cloudinary account. Copy the **API environment variable** (`cloudinary://API_KEY:API_SECRET@CLOUD_NAME`) from Settings, then API Keys. Without it, photo uploads fail on Vercel, whose disk is read-only.
3. **Environment.** Set these on the host:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled connection string (added by Vercel's Neon integration) |
   | `CLOUDINARY_URL` | Cloudinary API environment variable |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The owner's login, password of 8 or more characters (only needed for the first deploy or when seeding). `ADMIN_NAME` is optional. |
   | `DEMO_MODE` | `false` for a client, `true` for your demo |
   | `DATABASE_POOL_MAX` | `3` on serverless hosts |

4. **Tables and first admin.**
   - **On Vercel this is automatic.** `npm run build` runs `scripts/deploy-setup.ts` first. On a production deploy it applies new migrations, and while the database has no admin login it adds the sample salon, the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and with `DEMO_MODE=true` the demo logins and sample bookings. Once an admin exists, deploys never add content again. Preview and local builds skip it. A production deploy without `DATABASE_URL` fails with a message saying what to add, so the previous deployment stays live.
   - **Elsewhere**, from any machine, with those variables in `.env.local` or the shell:

     ```bash
     npm run db:migrate
     npm run db:seed     # sample content to edit, plus the admin login. No demo logins.
     ```

     For the demo, run `npm run db:seed -- --demo` instead to add the demo logins and sample bookings.

5. **Deploy** by connecting the repo to Vercel, or with the usual `npm run build` and `npm run start` (then run `npm run db:migrate` whenever a change adds a migration). On every client project, set **Settings → Build and Deployment → Ignored Build Step** to **Only build production**: all projects import the same repository, so otherwise every push to a test branch builds a preview for every client. Test on the demo instead.

### Good to know

- **Each client's data is separate.** Bookings, payments and guest accounts live only in that client's database, and photos in their Cloudinary.
- **One codebase, many sites.** Every client project builds from this repository's `main` branch, so a fix pushed there reaches all of them on their next deploy. Test changes on the demo first. On Vercel each deploy migrates that client's database itself.
- **Plans and costs.** Vercel's free Hobby plan is meant for non-commercial use, so client sites need Vercel Pro, a project inside the client's own Vercel account (they then own the billing and the domain), or Netlify's free plan.
- **Free-plan limits.** Neon Free gives each project 100 compute-hours a month (compute sleeps after 5 idle minutes), 1 GB of storage and a 6-hour restore window; running out pauses the database until the next month. Cloudinary Free gives 25 credits a month (1 credit is about 1 GB stored, 1 GB served or 1,000 transformations). Vercel Hobby includes 4 hours of active CPU a month and is non-commercial only.
- **Backups.** On a live site, **Launch → Download backup** saves the whole design with its photos. Bookings and payments stay in the database, and Neon Free can only restore the last 6 hours, so move client sites to Neon's paid Launch plan (billed by use) when they start taking real bookings.
- **Size limits.** Vercel accepts at most 4.5 MB per request. The admin shrinks photos below 4 MB before uploading, and the site file download streams, so it can be larger.
- **Preview deployments** never delete photos from storage, because with preview branching they run on a copy of the live database but share the live Cloudinary account.

`GET /api/health` returns 200 when the database answers. Each check wakes the database for about 5 minutes, so poll it about once an hour: at 0.25 CU that is roughly 15 compute-hours a month, while a 5-minute monitor keeps it awake around the clock and uses up Neon Free's month in under three weeks.

Behind a reverse proxy that rewrites the `Host` header, add the public domain to `serverActions.allowedOrigins` in `next.config.ts` so Server Actions accept requests from it.

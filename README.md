# Beauty salon

A salon website with online booking, a front desk for staff, and an admin for the owner. Built with Next.js 16, Postgres and Drizzle ORM. Everything runs on free tiers.

- **Public site**: services, team, portfolio, reviews, offers and booking. Guests create an account to book.
- **Desk** (`/desk`): confirm requests, work through the day, record payments.
- **Admin** (`/admin`): modules, brand and colours, words and hours, services, team, photos, reviews, offers, staff logins.

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

Open http://localhost:3000.

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

1. **Database.** Create a free Neon project. Copy the **pooled** connection string (its host contains `-pooler`).
2. **Photos.** Create a free Cloudinary account. Copy the **API environment variable** (`cloudinary://API_KEY:API_SECRET@CLOUD_NAME`) from Settings, then API Keys.
3. **Environment.** Set these on the host:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled connection string |
   | `CLOUDINARY_URL` | Cloudinary API environment variable |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The owner's login, password of 8 or more characters (only needed when seeding) |
   | `DEMO_MODE` | `false` |

4. **Tables and first admin.** From any machine, with those variables in `.env.local` or the shell:

   ```bash
   npm run db:migrate
   npm run db:seed     # sample content to edit, plus the admin login. No demo logins.
   ```

5. **Deploy** with the usual `npm run build` and `npm run start`, or connect the repo to Vercel or Netlify. Run `npm run db:migrate` again whenever a change adds a migration. Vercel's free Hobby plan is meant for non-commercial use, so a live salon may fit Netlify's free plan or Vercel Pro better.

`GET /api/health` returns 200 when the database answers, for uptime monitors.

Behind a reverse proxy that rewrites the `Host` header, add the public domain to `serverActions.allowedOrigins` in `next.config.ts` so Server Actions accept requests from it.

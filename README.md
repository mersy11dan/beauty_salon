# Beauty salon website builder

A salon website (services, team, portfolio, reviews, offers, online booking) with a staff desk and an admin that changes everything on the public site: name, logo, 48 colour palettes, fonts, every piece of text, photos, prices and opening hours.

The same code runs in two modes:

| Mode | When | Where data is kept |
| --- | --- | --- |
| **Demo** | No database is connected (your showcase deployment) | In each visitor's browser. Nothing is shared between visitors, and nothing reaches a client. |
| **Live** | The deployment has its own Upstash Redis database | In that database. Admin edits go public as soon as they save, guests book from any device, and the desk sees every booking. |

The admin shows a grey **Demo** or green **Live** chip next to its name so you always know which one you are in.

## Selling a website to a client

The admin opens on **Site builder**, which walks through the work in three stages and ticks off each step once it differs from the sample salon.

1. **Make it theirs:** name and logo, colours and fonts, and which pages they pay for.
2. **Fill it in:** homepage, services and prices, team, portfolio, reviews, offers, contact and hours, and (optionally) any piece of site text.
3. **Hand it over:** on **Launch**, download the site file, then:
   1. On [vercel.com/new](https://vercel.com/new), import **this same repository** as a new project named after the client. Every Vercel project is a separate website.
   2. In that project, open **Storage**, create an **Upstash for Redis** database and connect it. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you. Use a new database for every client.
   3. Under **Settings → Environment Variables**, add `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `SESSION_SECRET` (the Launch page can generate a secret).
   4. Deploy, or redeploy if the project already existed before the variables were added.
   5. Sign in at `/login` on the new site with the admin email and password, open **Launch** and load the site file. Photos upload into the client's own database.
   6. Add the client's domain under **Settings → Domains**.
   7. Create the desk login for their staff under **Access and data**, and give the client their logins.

Back in the demo, **Start from the sample salon** on the Launch page resets the demo for the next client. Site files load back into the demo too, so you can pause one client's design and pick it up later.

### Environment variables

| Variable | Needed | What it does |
| --- | --- | --- |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Yes, for live mode | Set by Vercel when you connect Upstash for Redis. `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` work too. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Yes | The admin login. Changing either one signs every admin out. |
| `SESSION_SECRET` | Recommended | Signs login cookies. Without it a secret is derived from the password and database token. |
| `SALON_DB_PREFIX` | No | Key prefix (default `salon:`). Only needed if several sites must share one database, which is not recommended. |
| `SALON_LOCAL_DB` | No | Path to a JSON file used as the database, for trying live mode on your own computer. Not for Vercel. |

### Good to know

- **Each client's data is separate.** Bookings, payments and guest accounts live only in that client's database. Guest and desk passwords are stored as one-way hashes.
- **One codebase, many sites.** Every client project builds from this repository's `main` branch, so a fix pushed there reaches all of them on their next deploy. Test changes on the demo first.
- **Plans and costs.** Vercel's free Hobby plan is for non-commercial use, so client sites need Vercel Pro, or a project inside the client's own Vercel account (they then own the billing and the domain). Upstash's free plan suits a small salon; photos are stored in the database, so watch the storage if a client uploads hundreds.
- **Backups.** On a live site, **Launch → Download backup** saves the whole design with its photos. Bookings and payments stay in the database.

## Running it locally

```bash
npm ci
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open http://localhost:3000 (not 127.0.0.1). The demo logins are listed on `/login` and `/account`.

To try live mode locally, point it at a JSON file and choose an admin login:

```bash
SALON_LOCAL_DB=/tmp/salon-db.json ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=choose-one npm run dev -- --hostname 0.0.0.0 --port 3000
```

Checks: `npm run lint`, `npx tsc --noEmit` and `npm run build`.

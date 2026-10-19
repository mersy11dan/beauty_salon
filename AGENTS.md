<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Install with `npm ci` from the repository root. All data lives in Postgres; nothing is kept in `localStorage`.
- Postgres 16 is installed on the VM. Start it with `sudo service postgresql start`. Role `salon`, password `salon`, database `salon`. Without apt Postgres, `docker compose up -d` gives the same database.
- `.env.local` is gitignored. Create it with `cp .env.example .env.local`; the defaults point at the local database and set `DEMO_MODE=true`. Leave `CLOUDINARY_URL` empty locally, so photos are written to `.data/uploads`.
- Run `npm run db:setup` once after a fresh database to create tables and the demo data. Use `npm run db:reset` to start over. After changing `src/server/db/schema.ts`, run `npm run db:generate`, then `npm run db:migrate`.
- Start the dev server with `npm run dev -- --hostname 0.0.0.0 --port 3000` and open http://localhost:3000. Next.js 16 blocks dev JavaScript for http://127.0.0.1:3000, and the page can stay blank because the entrance animation starts transparent.
- Checks that match this repo: `npm run lint`, `npx tsc --noEmit`, and `npm run build`. The build doesn't connect to the database.
- Book a guest at `/book`. Signed-out visitors are sent to `/account` to sign in or create a guest account first. Demo guest is `mahlet.girma@example.com` / `guest1234`. Staff sign-in is `/login`, then the desk is `/desk`. Demo staff is `desk@beautysalon.demo` / `desk1234`. Demo admin is `admin@beautysalon.demo` / `admin1234`. Bookings show on the desk from any browser; the desk refreshes every 30 seconds.
- Server code is under `src/server/`: `db/` (schema, client, seed), `auth/` (passwords, sessions, rate limits), `actions/` (Server Actions), `data/` (cached reads), `storage/` (local disk or Cloudinary). `GET /api/health` checks the database.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Install with `npm ci` from the repository root. By default the app runs in demo mode with no database, env file, or external service: site content, guest and staff data stay in the browser under the `localStorage` key `beauty-salon-demo`.
- Live mode (one sold client site) turns on when `KV_REST_API_URL`/`KV_REST_API_TOKEN` (Upstash Redis) or `SALON_LOCAL_DB` (a local JSON file) is set; the admin login then comes from `ADMIN_EMAIL`/`ADMIN_PASSWORD`. To test it locally: `SALON_LOCAL_DB=/tmp/salon-db.json ADMIN_EMAIL=owner@client.test ADMIN_PASSWORD=owner1234 npm run dev -- --hostname 0.0.0.0 --port 3000`. Delete the JSON file to start fresh. Server code is in `src/server/`; the client store in `src/lib/store.ts` switches on `mode`.
- The admin opens on the site builder at `/admin`; `/admin/launch` exports and imports site files and holds the deploy guide.
- Start the dev server with `npm run dev -- --hostname 0.0.0.0 --port 3000` and open http://localhost:3000. Next.js 16 blocks dev JavaScript for http://127.0.0.1:3000, and the page can stay blank because the entrance animation starts transparent.
- Checks that match this repo: `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- Book a guest at `/book`. Signed-out visitors are sent to `/account` to sign in or create a guest account first. Demo guest is `maya.chen@example.com` / `guest1234`. Staff sign-in is `/login`, then the desk is `/desk`. Demo staff is `desk@beautysalon.demo` / `desk1234`. Demo admin is `admin@beautysalon.demo` / `admin1234`. In demo mode a booking appears on the desk only in the same browser, and these demo logins do not exist in live mode.

import "server-only";
import { inArray, lt } from "drizzle-orm";
import { db } from "./db";
import { media, portfolioItems, siteSettings, staff } from "./db/schema";
import { storageFor } from "./storage";

/** Uploads stay this long even when unused, so cancelled edits and quick undo flows never lose a photo. */
const GRACE_MS = 24 * 60 * 60 * 1000;
const MIN_INTERVAL_MS = 60 * 60 * 1000;

let lastRun = 0;

async function referencedUrls() {
  const [settingsRows, staffRows, portfolioRows] = await Promise.all([
    db.select({ data: siteSettings.data }).from(siteSettings),
    db.select({ url: staff.photoUrl }).from(staff),
    db.select({ url: portfolioItems.src }).from(portfolioItems),
  ]);
  const urls = new Set<string>();
  for (const { data } of settingsRows) {
    if (data.logoUrl) urls.add(data.logoUrl);
    if (data.faviconUrl) urls.add(data.faviconUrl);
    for (const s of data.hero?.slides ?? []) if (s.src) urls.add(s.src);
    for (const src of data.about?.photos ?? []) if (src) urls.add(src);
  }
  for (const r of [...staffRows, ...portfolioRows]) if (r.url) urls.add(r.url);
  return urls;
}

/** Deletes uploads that no page uses any more. Cheap to call; it runs at most hourly per server. */
export async function pruneUnusedMedia({ force = false } = {}) {
  if (!force && Date.now() - lastRun < MIN_INTERVAL_MS) return 0;
  lastRun = Date.now();

  const candidates = await db
    .select()
    .from(media)
    .where(lt(media.createdAt, new Date(Date.now() - (force ? 0 : GRACE_MS))));
  if (candidates.length === 0) return 0;

  const used = await referencedUrls();
  const unused = candidates.filter((m) => !used.has(m.url));
  const removed: string[] = [];
  for (const m of unused) {
    try {
      await storageFor(m.driver)?.remove(m.key);
      removed.push(m.id);
    } catch (err) {
      console.error(`[media] could not delete ${m.key}:`, err);
    }
  }
  if (removed.length) await db.delete(media).where(inArray(media.id, removed));
  return removed.length;
}

import { rateLimit, waitMessage } from "@/server/auth/rate-limit";
import { getStaffSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { media } from "@/server/db/schema";
import { isSameOrigin, noStoreJson } from "@/server/http";
import { newId } from "@/server/ids";
import { sniffImage } from "@/server/images";
import { storage } from "@/server/storage";

/** Cloudinary's free plan refuses images over 10 MB. The admin resizes photos before sending, so real uploads are far smaller. */
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return noStoreJson({ error: "Uploads must come from this site." }, { status: 403 });

  const session = await getStaffSession();
  if (!session) return noStoreJson({ error: "Your session has ended. Sign in again to upload." }, { status: 401 });
  if (session.role !== "admin") return noStoreJson({ error: "Only an admin can upload photos." }, { status: 403 });

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES + 64 * 1024) return noStoreJson({ error: "That photo is over 10 MB. Pick a smaller one." }, { status: 413 });

  const limited = await rateLimit(`upload:${session.id}`, 300, 60 * 60);
  if (!limited.ok) return noStoreJson({ error: waitMessage(limited.retryAfterSec) }, { status: 429 });

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return noStoreJson({ error: "The upload didn't arrive in one piece. Try again." }, { status: 400 });
  }
  if (!(file instanceof Blob) || file.size === 0) return noStoreJson({ error: "Choose a photo to upload." }, { status: 400 });
  if (file.size > MAX_BYTES) return noStoreJson({ error: "That photo is over 10 MB. Pick a smaller one." }, { status: 413 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return noStoreJson({ error: "Use a JPG, PNG, WebP, GIF or AVIF photo." }, { status: 415 });

  try {
    const driver = storage();
    const id = newId("img");
    const stored = await driver.put({ id, bytes, contentType: kind.contentType, ext: kind.ext });
    await db.insert(media).values({
      id,
      driver: driver.name,
      key: stored.key,
      url: stored.url,
      contentType: kind.contentType,
      bytes: bytes.length,
      width: stored.width ?? null,
      height: stored.height ?? null,
    });
    return noStoreJson({ url: stored.url }, { status: 201 });
  } catch (err) {
    console.error("[uploads] failed:", err);
    return noStoreJson({ error: "The photo couldn't be saved. Try again in a moment." }, { status: 502 });
  }
}

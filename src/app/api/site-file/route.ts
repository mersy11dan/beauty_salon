import { eq } from "drizzle-orm";
import { makePackage, mapImages, packageFileName } from "@/lib/content";
import { getStaffSession } from "@/server/auth/session";
import { getPublicData } from "@/server/data/public";
import { db } from "@/server/db";
import { media } from "@/server/db/schema";
import { noStoreJson } from "@/server/http";
import { sniffImage } from "@/server/images";
import { readLocalUpload } from "@/server/storage";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

async function hostedBytes(src: string): Promise<Uint8Array | null> {
  if (src.startsWith("/uploads/")) return readLocalUpload(src.slice("/uploads/".length));
  if (!src.startsWith("https://")) return null;
  const [row] = await db.select({ driver: media.driver }).from(media).where(eq(media.url, src)).limit(1);
  if (row?.driver !== "cloudinary") return null;
  const res = await fetch(src, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  return bytes.length <= MAX_IMAGE_BYTES ? bytes : null;
}

/**
 * Photos this site uploaded are written into the file, so it loads on another deployment.
 * Files shipped with the site (/media/...) and outside links stay as they are.
 */
async function inline(src: string) {
  try {
    const bytes = await hostedBytes(src);
    const kind = bytes && sniffImage(bytes);
    if (!bytes || !kind) return src;
    return `data:${kind.contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch (err) {
    console.error(`[site-file] could not include ${src}:`, err);
    return src;
  }
}

const CHUNK_BYTES = 256 * 1024;

/** Vercel refuses buffered function responses over 4.5 MB; streamed ones have no cap, and inlined photos add up fast. */
function streamText(text: string) {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) return controller.close();
      controller.enqueue(bytes.subarray(offset, offset + CHUNK_BYTES));
      offset += CHUNK_BYTES;
    },
  });
}

/** The Launch page's "Save site file": every page, photo, colour and phrase, without bookings or accounts. */
export async function GET() {
  const session = await getStaffSession();
  if (!session) return noStoreJson({ error: "Your session has ended. Sign in again." }, { status: 401 });
  if (session.role !== "admin") return noStoreJson({ error: "Only an admin can save a site file." }, { status: 403 });
  try {
    const content = await mapImages(await getPublicData(), inline);
    const pkg = makePackage(content);
    return new Response(streamText(JSON.stringify(pkg)), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${packageFileName(pkg.name)}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("[site-file] failed:", err);
    return noStoreJson({ error: "The site file couldn't be made. Try again in a moment." }, { status: 503 });
  }
}

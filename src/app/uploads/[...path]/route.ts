import { readLocalUpload } from "@/server/storage";
import { CONTENT_TYPE_BY_EXT } from "@/server/images";

/** Serves photos saved by the local storage driver. With Cloudinary configured, photos come from its CDN instead. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const key = (await params).path.join("/");
  const type = CONTENT_TYPE_BY_EXT[key.split(".").pop()?.toLowerCase() ?? ""];
  const bytes = type ? await readLocalUpload(key) : null;
  if (!bytes) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(bytes.length),
      // Every upload gets a fresh name, so a URL's contents never change.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

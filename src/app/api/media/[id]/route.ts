import { isLive } from "@/server/env";
import { getMedia } from "@/server/repo";

/** Serves images uploaded to a live site. Ids are content hashes, so responses never change. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isLive() || !/^[a-f0-9]{32}$/.test(id)) return new Response("Not found", { status: 404 });
  const media = await getMedia(id);
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(media.bytes), {
    headers: {
      "Content-Type": media.type === "image/jpg" ? "image/jpeg" : media.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

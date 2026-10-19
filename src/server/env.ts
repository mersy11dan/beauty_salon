import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in." })
    .min(1, "DATABASE_URL is empty. Copy .env.example to .env.local and fill it in.")
    .refine((v) => /^postgres(ql)?:\/\//.test(v), "DATABASE_URL must start with postgres:// or postgresql://"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),
  CLOUDINARY_URL: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined))
    .refine((v) => !v || /^cloudinary:\/\/[^:]+:[^@]+@.+/.test(v), "CLOUDINARY_URL must look like cloudinary://API_KEY:API_SECRET@CLOUD_NAME"),
  CLOUDINARY_FOLDER: z.string().default("salon"),
  UPLOADS_DIR: z.string().default(".data/uploads"),
  DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/** Parsed on first use, not at import, so `next build` works without a database. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid server environment:\n${lines}`);
  }
  cached = parsed.data;
  return cached;
}

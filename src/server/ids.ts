import { randomBytes } from "node:crypto";

/** `prefix_` plus 16 URL-safe random characters (96 bits). */
export const newId = (prefix: string) => `${prefix}_${randomBytes(12).toString("base64url")}`;

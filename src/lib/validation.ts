import { MAX_TITLE_LENGTH } from "./config";

/** Returns a cleaned title, or null when it isn't usable. */
export function cleanTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const title = value
    .replace(/[\u0000-\u001f\u007f]/g, " ") // control characters (Postgres rejects NUL)
    .replace(/\s+/g, " ")
    .trim();
  if (!title || title.length > MAX_TITLE_LENGTH) return null;
  return title;
}

import { MAX_FOLDER_NAME_LENGTH, MAX_TITLE_LENGTH } from "./config";

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

/** Returns a cleaned folder name, or null when it isn't usable. */
export function cleanFolderName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value
    .replace(/[\u0000-\u001f\u007f]/g, " ") // control characters (Postgres rejects NUL)
    .replace(/\s+/g, " ")
    .trim();
  if (!name || name.length > MAX_FOLDER_NAME_LENGTH) return null;
  return name;
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no look-alikes (l, o, 0, 1)

export function randomSuffix(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** "Medical Office Brochure.pdf" -> "medical-office-brochure-a83jd2" */
export function createSlug(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  const suffix = randomSuffix();
  return base ? `${base}-${suffix}` : suffix;
}

export function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.pdf$/i, "").replace(/[_]+/g, " ").trim() || "Untitled flipbook";
}

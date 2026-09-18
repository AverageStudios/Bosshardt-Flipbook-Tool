/**
 * App-wide branding and limits. Change the name, tagline or logo here and it
 * flows through the whole UI. To add the Bosshardt logo, drop the file in
 * /public and set `logoSrc` (e.g. "/bosshardt-logo.svg").
 */
export const brand = {
  name: "Bosshardt Flipbook Tool",
  shortName: "Bosshardt",
  company: "Bosshardt Realty",
  description:
    "Turn PDF brochures, offering memorandums and market reports into shareable online flipbooks.",
  logoSrc: null as string | null,
};

export const STORAGE_BUCKET = "flipbooks";
/**
 * Largest PDF accepted. Keep in sync with the `flipbooks` bucket's file size
 * limit in Supabase (Free plan max is 50 MB; Pro can raise it, e.g. to 100 MB).
 */
export const MAX_PDF_MB = 50;
export const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;
export const MAX_TITLE_LENGTH = 200;

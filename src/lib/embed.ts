/**
 * Website embeds: /embed/[slug] shows the same flipbook record and PDF as
 * /f/[slug], in a chrome-free viewer made to live inside an <iframe>.
 *
 * Future embed settings (hide toolbar, custom background, autoplay…) belong in
 * EmbedOptions: parse them from the query string here and pass them through
 * the generated URL, so /embed/[slug] stays the one entry point.
 */

export const EMBED_SIZES = {
  responsive: { label: "Responsive", height: 700, note: "Recommended" },
  compact: { label: "Compact", height: 550, note: null },
  large: { label: "Large", height: 850, note: null },
} as const;

export type EmbedSize = keyof typeof EMBED_SIZES;
export const DEFAULT_EMBED_SIZE: EmbedSize = "responsive";

export interface EmbedOptions {
  /** 1-based page to open at (`?page=`). */
  startPage?: number;
}

export function parseEmbedOptions(query: Record<string, string | string[] | undefined>): EmbedOptions {
  const page = Number(typeof query.page === "string" ? query.page : NaN);
  return Number.isInteger(page) && page > 1 ? { startPage: page } : {};
}

export function embedUrl(origin: string, slug: string, options: EmbedOptions = {}): string {
  const url = new URL(`/embed/${slug}`, origin);
  if (options.startPage) url.searchParams.set("page", String(options.startPage));
  return url.toString();
}

const escapeAttr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The iframe snippet staff paste into the Bosshardt website. */
export function embedCode({ src, title, size = DEFAULT_EMBED_SIZE }: { src: string; title: string; size?: EmbedSize }) {
  return [
    "<iframe",
    `  src="${escapeAttr(src)}"`,
    `  title="${escapeAttr(title)}"`,
    `  width="100%"`,
    `  height="${EMBED_SIZES[size].height}"`,
    `  style="border:0;"`,
    `  loading="lazy"`,
    `  allow="fullscreen"`,
    "  allowfullscreen>",
    "</iframe>",
  ].join("\n");
}

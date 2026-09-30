/**
 * Website embeds: /embed/[slug] shows the same flipbook record and PDF as
 * /f/[slug], in a chrome-free viewer made to live inside an <iframe>.
 *
 * Future embed settings (hide toolbar, custom background, autoplay…) belong in
 * EmbedOptions: parse them from the query string here and pass them through
 * the generated URL, so /embed/[slug] stays the one entry point.
 */

/**
 * Domain the generated embed code points at, whichever address staff open the
 * dashboard from (a vercel.app URL, a preview, localhost). Override with
 * NEXT_PUBLIC_EMBED_ORIGIN; read at build time, so redeploy after changing it.
 */
export const EMBED_ORIGIN = (process.env.NEXT_PUBLIC_EMBED_ORIGIN?.trim() || "https://bosshardtflipbooks.com").replace(
  /\/+$/,
  "",
);

/**
 * Default: a fixed-height frame showing one page at a time.
 * Large: a two-page spread. A fixed height can't guarantee that (pages are
 * limited by the host page's width, so extra height is just empty space and
 * tips the viewer into single pages), so its height follows its width through
 * CSS aspect-ratio, worked out from the flipbook's page shape.
 */
export const EMBED_SIZES = {
  default: { label: "Default", note: "One page at a time" },
  large: { label: "Large", note: "Two-page spread" },
} as const;

export type EmbedSize = keyof typeof EMBED_SIZES;
export const DEFAULT_EMBED_SIZE: EmbedSize = "default";

export const DEFAULT_EMBED_HEIGHT = 600;
/** Below this the Large frame stops shrinking, so narrow pages still get a usable single page. */
const LARGE_MIN_HEIGHT = 420;
/** Width the Large frame is sized for; the height attribute (used if a site strips `style`) matches it. */
const LARGE_REFERENCE_WIDTH = 1000;
/** Letter portrait, for when the page shape isn't known yet. */
export const FALLBACK_PAGE_ASPECT = 8.5 / 11;

// Room the embed viewer keeps around the book (see computeLayout and the toolbar in FlipbookViewer).
const EMBED_CHROME_X = 128; // side arrows
const EMBED_CHROME_Y = 110; // top/bottom margins, toolbar, a little breathing room

/** Frame shape for the Large embed: width / height, plus its height at the reference width. */
export function largeEmbedFrame(pageAspect: number) {
  const pageHeight = (LARGE_REFERENCE_WIDTH - EMBED_CHROME_X) / (2 * pageAspect);
  const height = Math.round(pageHeight + EMBED_CHROME_Y);
  const ratio = Math.round((LARGE_REFERENCE_WIDTH / height) * 100) / 100;
  return { ratio, height, minHeight: LARGE_MIN_HEIGHT };
}

/** Frame height at a given width, as the browser will lay it out (used by the preview). */
export function embedFrameHeight(size: EmbedSize, pageAspect: number, width: number) {
  if (size === "default") return DEFAULT_EMBED_HEIGHT;
  const { ratio, minHeight } = largeEmbedFrame(pageAspect);
  return Math.max(minHeight, Math.round(width / ratio));
}

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
export function embedCode({
  src,
  title,
  size = DEFAULT_EMBED_SIZE,
  pageAspect = FALLBACK_PAGE_ASPECT,
}: {
  src: string;
  title: string;
  size?: EmbedSize;
  /** Page width / height; shapes the Large frame. */
  pageAspect?: number;
}) {
  let height = DEFAULT_EMBED_HEIGHT;
  let style = "border:0;";
  if (size === "large") {
    const frame = largeEmbedFrame(pageAspect);
    height = frame.height;
    // height:auto lets aspect-ratio win over the height attribute, which stays as a fallback.
    style = `border:0;width:100%;height:auto;aspect-ratio:${frame.ratio};min-height:${frame.minHeight}px;`;
  }
  return [
    "<iframe",
    `  src="${escapeAttr(src)}"`,
    `  title="${escapeAttr(title)}"`,
    `  width="100%"`,
    `  height="${height}"`,
    `  style="${style}"`,
    `  loading="lazy"`,
    `  allow="fullscreen"`,
    "  allowfullscreen>",
    "</iframe>",
  ].join("\n");
}

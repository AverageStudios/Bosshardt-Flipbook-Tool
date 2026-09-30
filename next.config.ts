import type { NextConfig } from "next";

/**
 * Sites allowed to show /embed/[slug] in an <iframe>, as CSP frame-ancestors
 * sources. Override with EMBED_ALLOWED_ORIGINS (space- or comma-separated,
 * e.g. "https://bosshardtrealty.com https://*.bosshardtrealty.com"), or "*" to
 * allow any site. Read at build time: redeploy after changing it.
 *
 * Returns null for "*": the CSP source `*` only matches http(s) pages, so it
 * still blocks local .html files and sandboxed "HTML viewer" previews. Allowing
 * everything means sending no frame-ancestors restriction at all.
 */
const DEFAULT_EMBED_ORIGINS = ["https://bosshardtrealty.com", "https://*.bosshardtrealty.com"];
const ORIGIN_RE = /^https?:\/\/(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)*(:\d{1,5})?$/i;

function embedFrameAncestors(): string | null {
  const configured = process.env.EMBED_ALLOWED_ORIGINS?.split(/[\s,]+/).filter(Boolean);
  const origins = configured?.length ? configured : DEFAULT_EMBED_ORIGINS;
  if (origins.includes("*")) return null;
  const invalid = origins.filter((origin) => !ORIGIN_RE.test(origin));
  if (invalid.length > 0) {
    throw new Error(
      `EMBED_ALLOWED_ORIGINS has invalid entries: ${invalid.join(", ")}. ` +
        `Use full origins such as https://bosshardtrealty.com or https://*.bosshardtrealty.com.`,
    );
  }
  // 'self' lets the Share dialog preview the embed.
  return ["'self'", ...origins.map((origin) => origin.replace(/\/$/, ""))].join(" ");
}

const nextConfig: NextConfig = {
  // Pin the project root (a stray lockfile in a parent folder can confuse Turbopack).
  turbopack: { root: __dirname },

  async headers() {
    const ancestors = embedFrameAncestors();
    const embeddable = ancestors ? [{ key: "Content-Security-Policy", value: `frame-ancestors ${ancestors}` }] : [];
    return [
      {
        // The dashboard, uploads and API must never be framed by another site.
        source: "/:path((?!embed/|f/).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      // Public viewers: framable only by the allowed sites. /embed is the one to use;
      // /f keeps the same allowance so any existing iframe of a share link still works there.
      {
        // PDF.js worker, fonts and cmaps (static, public). An embed inside a sandboxed
        // frame has an opaque origin, so even these same-site files load as cross-origin.
        source: "/pdfjs/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
      ...(embeddable.length > 0
        ? [
            { source: "/embed/:slug", headers: embeddable },
            { source: "/f/:slug", headers: embeddable },
          ]
        : []),
    ];
  },
};

export default nextConfig;

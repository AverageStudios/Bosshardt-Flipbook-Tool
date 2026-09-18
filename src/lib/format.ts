export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Absolute public URL for a flipbook. Browser-only: uses whatever domain the app
 * is being served from (localhost, a Vercel preview, production), never a hardcoded one.
 */
export function flipbookUrl(slug: string): string {
  return `${window.location.origin}/f/${slug}`;
}

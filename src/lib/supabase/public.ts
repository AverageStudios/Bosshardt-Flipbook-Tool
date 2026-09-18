/**
 * Browser-safe Supabase settings. Only NEXT_PUBLIC_ variables belong here:
 * never read a server secret in this file.
 *
 * Next.js writes NEXT_PUBLIC_ values into browser code at BUILD time, and only
 * for literal `process.env.NEXT_PUBLIC_…` reads like the ones below. If they're
 * added to the host after a build, that build won't see them: rebuild/redeploy.
 */
export const publicSupabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
};

/** Names of missing public variables (as seen by the current bundle). */
export function missingPublicEnv(): string[] {
  const missing: string[] = [];
  if (!publicSupabaseConfig.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!publicSupabaseConfig.publishableKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return missing;
}

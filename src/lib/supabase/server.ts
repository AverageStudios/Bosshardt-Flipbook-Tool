import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using SUPABASE_SECRET_KEY. It bypasses RLS, so it
 * must only ever run on the server: the `server-only` import above makes the
 * build fail if a Client Component imports this file.
 *
 * Only server variables are required here. They are read at request time, so
 * changing them on the host takes effect without rebuilding. The browser's
 * public keys are checked separately in ./public.ts.
 */
let client: SupabaseClient | null = null;

const serverUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

/** Names (never values) of required server variables that are missing or empty. */
export function missingServerEnv(): string[] {
  const missing: string[] = [];
  if (!serverUrl()?.trim()) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SECRET_KEY?.trim()) missing.push("SUPABASE_SECRET_KEY");
  return missing;
}

export function isSupabaseConfigured(): boolean {
  return missingServerEnv().length === 0;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(`Supabase is not configured on the server (missing: ${missingServerEnv().join(", ")}).`);
    this.name = "SupabaseNotConfiguredError";
  }
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) throw new SupabaseNotConfiguredError();
  if (!client) {
    client = createClient(serverUrl()!.trim(), process.env.SUPABASE_SECRET_KEY!.trim(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

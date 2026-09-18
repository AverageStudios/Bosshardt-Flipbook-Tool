import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using SUPABASE_SECRET_KEY. It bypasses RLS, so it
 * must only ever run on the server: the `server-only` import above makes the
 * build fail if a Client Component imports this file.
 */
let client: SupabaseClient | null = null;

const serverUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    serverUrl() && process.env.SUPABASE_SECRET_KEY && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Copy .env.example to .env.local and fill in your project keys.",
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) throw new SupabaseNotConfiguredError();
  if (!client) {
    client = createClient(serverUrl()!, process.env.SUPABASE_SECRET_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

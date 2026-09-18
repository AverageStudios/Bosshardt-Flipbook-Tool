import "server-only";
import { NextResponse } from "next/server";
import { SupabaseNotConfiguredError } from "./supabase/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Maps thrown errors to a friendly JSON response and logs the detail. */
export function handleApiError(error: unknown, fallback: string) {
  if (error instanceof SupabaseNotConfiguredError) {
    return jsonError(error.message, 503);
  }
  console.error(fallback, error);
  return jsonError(fallback, 500);
}

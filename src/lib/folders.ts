import "server-only";
import { cache } from "react";
import { getSupabaseAdmin } from "./supabase/server";
import type { Folder } from "./types";

/**
 * Folder reads/writes, all through the service-role client. Same pattern as
 * lib/flipbooks.ts: nothing here may be imported by a Client Component.
 */

/** Deduped per request, so a layout and its page share one query. */
export const listFolders = cache(async (): Promise<Folder[]> => {
  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Folder[];
});

export async function getFolder(id: string): Promise<Folder | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Folder | null;
}

export async function createFolder(name: string): Promise<Folder> {
  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    .insert({ name })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Folder;
}

export async function renameFolder(id: string, name: string): Promise<Folder | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    // Set explicitly so it works whether or not the table has an updated_at trigger.
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Folder | null;
}

/**
 * Deletes the folder only. The `flipbooks.folder_id` foreign key is
 * ON DELETE SET NULL, so the flipbooks inside it keep their PDF, thumbnail,
 * record and share link — they just return to All Flipbooks.
 */
export async function deleteFolder(id: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("folders")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

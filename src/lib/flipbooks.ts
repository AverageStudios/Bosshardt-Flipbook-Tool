import "server-only";
import { STORAGE_BUCKET } from "./config";
import { createSlug } from "./slug";
import { getSupabaseAdmin } from "./supabase/server";
import type { Flipbook, PublicFlipbook } from "./types";

/** Storage layout: flipbooks/{flipbook_id}/document.pdf and thumbnail.jpg */
export const pdfPath = (id: string) => `${id}/document.pdf`;
export const thumbnailPath = (id: string) => `${id}/thumbnail.jpg`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID_RE.test(value);

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function listFlipbooks(): Promise<Flipbook[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("flipbooks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Flipbook[];
}

export async function getFlipbookBySlug(slug: string): Promise<PublicFlipbook | null> {
  if (!SLUG_RE.test(slug) || slug.length > 100) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("flipbooks")
    .select("id, title, slug, pdf_url, page_count, thumbnail_url")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as PublicFlipbook | null;
}

/** Issues short-lived signed upload URLs so the browser uploads straight to storage. */
export async function prepareUpload() {
  const id = crypto.randomUUID();
  const bucket = getSupabaseAdmin().storage.from(STORAGE_BUCKET);
  const [pdf, thumb] = await Promise.all([
    bucket.createSignedUploadUrl(pdfPath(id)),
    bucket.createSignedUploadUrl(thumbnailPath(id)),
  ]);
  if (pdf.error) throw new Error(pdf.error.message);
  if (thumb.error) throw new Error(thumb.error.message);
  return {
    id,
    pdfUploadUrl: pdf.data.signedUrl,
    thumbnailUploadUrl: thumb.data.signedUrl,
  };
}

/** Creates the database record once the files are in storage. */
export async function createFlipbook(input: {
  id: string;
  title: string;
  pageCount: number;
}): Promise<Flipbook> {
  const supabase = getSupabaseAdmin();
  const bucket = supabase.storage.from(STORAGE_BUCKET);

  const { data: files, error: listError } = await bucket.list(input.id);
  if (listError) throw new Error(listError.message);
  const names = new Set(files.map((f) => f.name));
  if (!names.has("document.pdf")) {
    throw new Error("The PDF upload could not be found. Please try again.");
  }

  const pdf_url = bucket.getPublicUrl(pdfPath(input.id)).data.publicUrl;
  const thumbnail_url = names.has("thumbnail.jpg")
    ? bucket.getPublicUrl(thumbnailPath(input.id)).data.publicUrl
    : null;

  try {
    // Retry on the (very unlikely) chance of a slug collision.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from("flipbooks")
        .insert({
          id: input.id,
          title: input.title,
          slug: createSlug(input.title),
          pdf_url,
          storage_path: pdfPath(input.id),
          page_count: input.pageCount,
          thumbnail_url,
        })
        .select("*")
        .single();
      if (!error) return data as Flipbook;
      if (error.code === "23505" && !error.message.includes("slug")) {
        // This id already belongs to a saved flipbook: its files aren't ours to clean up.
        throw new IdInUseError();
      }
      if (error.code !== "23505") throw new Error(error.message);
    }
    throw new Error("Could not generate a unique link. Please try again.");
  } catch (error) {
    // Don't leave orphaned files in Storage when the record couldn't be saved.
    if (!(error instanceof IdInUseError)) await removeFiles(input.id);
    throw error;
  }
}

class IdInUseError extends Error {
  constructor() {
    super("This upload has already been saved.");
  }
}

async function removeFiles(id: string) {
  const { error } = await getSupabaseAdmin()
    .storage.from(STORAGE_BUCKET)
    .remove([pdfPath(id), thumbnailPath(id)]);
  if (error) console.error(`Failed to remove files for flipbook ${id}`, error);
}

export async function renameFlipbook(id: string, title: string): Promise<Flipbook | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("flipbooks")
    // Set explicitly so it works whether or not the table has an updated_at trigger.
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Flipbook | null;
}

/** Deletes the PDF, the thumbnail (if any) and the database record. */
export async function deleteFlipbook(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  // Files first: if this fails the record stays, so the user can retry.
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([pdfPath(id), thumbnailPath(id)]);
  if (storageError) throw new Error(storageError.message);

  const { data, error } = await supabase
    .from("flipbooks")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

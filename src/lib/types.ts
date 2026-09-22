export interface Flipbook {
  id: string;
  title: string;
  slug: string;
  pdf_url: string;
  storage_path: string;
  page_count: number;
  thumbnail_url: string | null;
  /** Dashboard-only organisation. Null means the flipbook is unfiled. */
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/** Fields that are safe to send to the public viewer. */
export type PublicFlipbook = Pick<
  Flipbook,
  "id" | "title" | "slug" | "pdf_url" | "page_count" | "thumbnail_url"
>;

import { connection } from "next/server";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { listFolders } from "@/lib/folders";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Folder } from "@/lib/types";

/**
 * Sidebar shell around the browsing views. The flipbook preview page at
 * /dashboard/[slug] sits outside this group and keeps the plain app header.
 */
export default async function DashboardBrowseLayout({ children }: { children: React.ReactNode }) {
  await connection(); // always render with fresh data

  let folders: Folder[] = [];
  if (isSupabaseConfigured()) {
    try {
      folders = await listFolders();
    } catch (error) {
      // The page below surfaces the failure; the sidebar just shows no folders.
      console.error("Failed to load folders", error);
    }
  }

  return <DashboardChrome folders={folders}>{children}</DashboardChrome>;
}

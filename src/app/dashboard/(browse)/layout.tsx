import { connection } from "next/server";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { listFlipbookNav } from "@/lib/flipbooks";
import { listFolders } from "@/lib/folders";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { FlipbookNavItem, Folder } from "@/lib/types";

/**
 * Sidebar shell around the browsing views. The flipbook preview page at
 * /dashboard/[slug] sits outside this group and keeps the plain app header.
 */
export default async function DashboardBrowseLayout({ children }: { children: React.ReactNode }) {
  await connection(); // always render with fresh data

  let folders: Folder[] = [];
  let flipbooks: FlipbookNavItem[] = [];
  if (isSupabaseConfigured()) {
    try {
      [folders, flipbooks] = await Promise.all([listFolders(), listFlipbookNav()]);
    } catch (error) {
      // The page below surfaces the failure; the sidebar just shows an empty tree.
      console.error("Failed to load the sidebar tree", error);
    }
  }

  return (
    <DashboardChrome folders={folders} flipbooks={flipbooks}>
      {children}
    </DashboardChrome>
  );
}

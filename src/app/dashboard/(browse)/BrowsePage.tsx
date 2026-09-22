import { connection } from "next/server";
import { FlipbookBrowser, type BrowserView } from "@/components/dashboard/FlipbookBrowser";
import { SetupNotice } from "@/components/SetupNotice";
import { listFlipbooks } from "@/lib/flipbooks";
import { listFolders } from "@/lib/folders";
import { missingServerEnv } from "@/lib/supabase/server";
import type { Flipbook, Folder } from "@/lib/types";

/**
 * Shared body for All Flipbooks / Recent / a folder. Only the rows for the
 * current view are fetched, so switching folders never re-reads every record
 * (and never touches a PDF — cards use the stored thumbnail URL).
 */
export async function BrowsePage({ view, limit }: { view: BrowserView; limit?: number }) {
  await connection(); // always render with fresh data

  const missing = missingServerEnv();
  if (missing.length > 0) return <SetupNotice missing={missing} />;

  let flipbooks: Flipbook[] = [];
  let folders: Folder[] = [];
  try {
    [flipbooks, folders] = await Promise.all([
      listFlipbooks({ folderId: view.kind === "folder" ? view.folder.id : undefined, limit }),
      listFolders(),
    ]);
  } catch (error) {
    console.error("Failed to load flipbooks", error);
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Your flipbooks couldn&apos;t be loaded. Check your connection and refresh the page.
      </div>
    );
  }

  return <FlipbookBrowser view={view} flipbooks={flipbooks} folders={folders} />;
}

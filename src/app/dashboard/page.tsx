import type { Metadata } from "next";
import { connection } from "next/server";
import { AppHeader } from "@/components/AppHeader";
import { FlipbookGrid } from "@/components/dashboard/FlipbookGrid";
import { SetupNotice } from "@/components/SetupNotice";
import { listFlipbooks } from "@/lib/flipbooks";
import { missingServerEnv } from "@/lib/supabase/server";
import type { Flipbook } from "@/lib/types";

export const metadata: Metadata = { title: "My Flipbooks" };

export default async function DashboardPage() {
  await connection(); // always render with fresh data

  const missing = missingServerEnv();
  const configured = missing.length === 0;
  let flipbooks: Flipbook[] = [];
  let loadError: string | null = null;
  if (configured) {
    try {
      flipbooks = await listFlipbooks();
    } catch (error) {
      console.error("Failed to load flipbooks", error);
      loadError = "Your flipbooks couldn't be loaded. Check your connection and refresh the page.";
    }
  }

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">My Flipbooks</h1>
          {flipbooks.length > 0 && (
            <span className="text-sm text-muted">
              {flipbooks.length} {flipbooks.length === 1 ? "flipbook" : "flipbooks"}
            </span>
          )}
        </div>

        {!configured ? (
          <SetupNotice missing={missing} />
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{loadError}</div>
        ) : (
          <FlipbookGrid flipbooks={flipbooks} />
        )}
      </main>
    </div>
  );
}

import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AppHeader } from "@/components/AppHeader";
import { folderHref } from "@/components/dashboard/nav";
import { PdfUploader } from "@/components/PdfUploader";
import { SetupNotice } from "@/components/SetupNotice";
import { isUuid } from "@/lib/flipbooks";
import { getFolder } from "@/lib/folders";
import { missingServerEnv } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create a Flipbook" };

type Props = { searchParams: Promise<{ folder?: string }> };

export default async function NewFlipbookPage({ searchParams }: Props) {
  await connection(); // read env at request time, not build time
  const missing = missingServerEnv();
  const { folder: requested } = await searchParams;

  // ?folder=<id> keeps the folder the user was browsing: the new flipbook is
  // filed there. An unknown id just falls back to an unfiled upload.
  const folder =
    missing.length === 0 && requested && isUuid(requested)
      ? await getFolder(requested).catch(() => null)
      : null;

  return (
    <div className="min-h-dvh">
      <AppHeader showNewButton={false} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href={folder ? folderHref(folder.id) : "/dashboard"}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          {folder ? folder.name : "My Flipbooks"}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Create a Flipbook</h1>
        <p className="mt-1.5 mb-8 text-sm text-muted">
          Upload a PDF and get a shareable, page-turning flipbook link in seconds.
          {folder && (
            <>
              {" "}
              It will be saved in <span className="font-medium text-ink">{folder.name}</span>.
            </>
          )}
        </p>
        {missing.length === 0 ? <PdfUploader folderId={folder?.id ?? null} /> : <SetupNotice missing={missing} />}
      </main>
    </div>
  );
}

import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AppHeader } from "@/components/AppHeader";
import { PdfUploader } from "@/components/PdfUploader";
import { SetupNotice } from "@/components/SetupNotice";
import { missingServerEnv } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create a Flipbook" };

export default async function NewFlipbookPage() {
  await connection(); // read env at request time, not build time
  const missing = missingServerEnv();
  return (
    <div className="min-h-dvh">
      <AppHeader showNewButton={false} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" />
          My Flipbooks
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Create a Flipbook</h1>
        <p className="mt-1.5 mb-8 text-sm text-muted">
          Upload a PDF and get a shareable, page-turning flipbook link in seconds.
        </p>
        {missing.length === 0 ? <PdfUploader /> : <SetupNotice missing={missing} />}
      </main>
    </div>
  );
}

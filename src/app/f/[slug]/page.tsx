import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SetupNotice } from "@/components/SetupNotice";
import { FlipbookViewer } from "@/components/viewer/FlipbookViewer";
import { getFlipbookBySlug } from "@/lib/flipbooks";
import { isSupabaseConfigured, missingServerEnv } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

// Shared by generateMetadata and the page so the record is fetched once per request.
const loadFlipbook = cache(async (slug: string) =>
  isSupabaseConfigured() ? getFlipbookBySlug(slug) : null,
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const flipbook = await loadFlipbook(slug).catch(() => null);
  if (!flipbook) return { title: "Flipbook not found" };
  return {
    title: { absolute: flipbook.title },
    description: `${flipbook.title} — ${flipbook.page_count} pages`,
    // Client documents are shared by link only; keep them out of search engines.
    robots: { index: false, follow: false },
    openGraph: {
      title: flipbook.title,
      type: "article",
      images: flipbook.thumbnail_url ? [{ url: flipbook.thumbnail_url }] : undefined,
    },
  };
}

export default async function FlipbookPage({ params }: Props) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) {
    return (
      <main className="grid min-h-dvh place-items-center bg-viewer p-6">
        <SetupNotice missing={missingServerEnv()} />
      </main>
    );
  }

  const flipbook = await loadFlipbook(slug);
  if (!flipbook) notFound();

  return <FlipbookViewer flipbook={flipbook} />;
}

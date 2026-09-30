import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SetupNotice } from "@/components/SetupNotice";
import { FlipbookViewer } from "@/components/viewer/FlipbookViewer";
import { parseEmbedOptions } from "@/lib/embed";
import { getFlipbookBySlug } from "@/lib/flipbooks";
import { isSupabaseConfigured, missingServerEnv } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Same record and PDF as /f/[slug]; fetched once per request.
const loadFlipbook = cache(async (slug: string) =>
  isSupabaseConfigured() ? getFlipbookBySlug(slug) : null,
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const flipbook = await loadFlipbook(slug).catch(() => null);
  return {
    title: flipbook ? { absolute: flipbook.title } : "Flipbook unavailable",
    // The /f/[slug] page is the canonical one; embeds never belong in search results.
    robots: { index: false, follow: false },
  };
}

/** Website embed: the viewer alone, sized to whatever iframe it's placed in. */
export default async function EmbedPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured()) {
    return (
      <main className="grid min-h-dvh place-items-center bg-viewer p-6">
        <SetupNotice missing={missingServerEnv()} />
      </main>
    );
  }

  const flipbook = await loadFlipbook(slug);
  if (!flipbook) notFound();

  const options = parseEmbedOptions(query);
  return <FlipbookViewer flipbook={flipbook} variant="embed" startPage={options.startPage} />;
}

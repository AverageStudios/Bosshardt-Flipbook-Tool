import { ArrowLeft, CheckCircle2, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SetupNotice } from "@/components/SetupNotice";
import { ShareLinkPanel } from "@/components/ShareLinkPanel";
import { buttonClass } from "@/components/ui/button";
import { FlipbookViewer } from "@/components/viewer/FlipbookViewer";
import { getFlipbookBySlug } from "@/lib/flipbooks";
import { missingServerEnv } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string }>;
};

const loadFlipbook = cache(async (slug: string) =>
  missingServerEnv().length === 0 ? getFlipbookBySlug(slug) : null,
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const flipbook = await loadFlipbook(slug).catch(() => null);
  return { title: flipbook?.title ?? "Flipbook not found" };
}

/** Preview + share page. New flipbooks land here after upload (?created=1). */
export default async function FlipbookReadyPage({ params, searchParams }: Props) {
  const [{ slug }, { created }] = await Promise.all([params, searchParams]);
  const missing = missingServerEnv();

  if (missing.length > 0) {
    return (
      <div className="min-h-dvh">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <SetupNotice missing={missing} />
        </main>
      </div>
    );
  }

  const flipbook = await loadFlipbook(slug);
  if (!flipbook) notFound();
  const justCreated = created === "1";
  const pages = `${flipbook.page_count} ${flipbook.page_count === 1 ? "page" : "pages"}`;

  return (
    <div className="min-h-dvh">
      <AppHeader showNewButton={false} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" />
          My Flipbooks
        </Link>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {justCreated && (
              <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                <CheckCircle2 className="size-3.5" />
                Flipbook created
              </p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight break-words text-ink">
              {justCreated ? "Your flipbook is ready" : flipbook.title}
            </h1>
            <p className="mt-1.5 text-sm break-words text-muted">
              {justCreated ? `${flipbook.title} · ${pages}` : pages} · Preview it below, then share the link.
            </p>
          </div>
          <Link href="/new" className={buttonClass("secondary", "md", "shrink-0 self-start sm:self-auto")}>
            <Plus className="size-4" />
            Create another
          </Link>
        </div>

        <ShareLinkPanel slug={flipbook.slug} />

        <div className="relative mt-6 h-[460px] sm:h-[min(58vh,720px)] sm:min-h-[440px] overflow-hidden rounded-2xl border border-line bg-viewer shadow-card">
          <FlipbookViewer flipbook={flipbook} embedded />
        </div>
      </main>
    </div>
  );
}

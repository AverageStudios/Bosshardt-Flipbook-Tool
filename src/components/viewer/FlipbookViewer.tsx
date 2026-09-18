"use client";

import { AlertTriangle, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { flipbookUrl } from "@/lib/format";
import { PageRenderer } from "@/lib/pdf/page-renderer";
import { openPdf } from "@/lib/pdf/pdfjs";
import type { PublicFlipbook } from "@/lib/types";
import { LoadingPage } from "../LoadingPage";
import { FlipbookBook, type BookController } from "./FlipbookBook";
import { useElementSize, useFullscreen, useIdle } from "./hooks";
import { ShareModal } from "./ShareModal";
import { ViewerToolbar } from "./ViewerToolbar";

const ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5, 3];
const SPREAD_MIN_WIDTH = 768;
const PRELOAD_BEHIND = 2;
const PRELOAD_AHEAD = 4;

type LoadState =
  | { status: "loading" }
  | { status: "ready"; renderer: PageRenderer }
  | { status: "error"; message: string };

/** Fits the book into the stage; decides between a two-page spread and single pages. */
function computeLayout(stage: { width: number; height: number }, aspect: number, zoom: number) {
  const narrow = stage.width < 640;
  const padX = narrow ? 12 : 72; // room for the side arrows on larger screens
  const padY = narrow ? 12 : 28;
  const availW = Math.max(stage.width - padX * 2, 100);
  const availH = Math.max(stage.height - padY * 2, 100);

  const singleH = Math.min(availH, availW / aspect);
  const spreadH = Math.min(availH, availW / 2 / aspect);
  // Use a spread only where it doesn't make pages much smaller than a single page would be.
  const spread = stage.width >= SPREAD_MIN_WIDTH && spreadH >= singleH * 0.6;

  const pageHeight = Math.floor((spread ? spreadH : singleH) * zoom);
  const pageWidth = Math.floor(pageHeight * aspect);
  return { spread, pageWidth, pageHeight };
}

export function FlipbookViewer({ flipbook }: { flipbook: PublicFlipbook }) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0); // page-flip's 0-based index (left page in a spread)
  const [zoomStep, setZoomStep] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [setStageEl, stage] = useElementSize<HTMLDivElement>();
  const controllerRef = useRef<BookController | null>(null);
  const fullscreen = useFullscreen();
  const idle = useIdle();

  // Load the PDF document (only the pages we ask for are rendered).
  useEffect(() => {
    let cancelled = false;
    let renderer: PageRenderer | null = null;
    openPdf({ url: flipbook.pdf_url })
      .then((doc) => PageRenderer.create(doc))
      .then((created) => {
        renderer = created;
        if (cancelled) return created.destroy();
        setLoad({ status: "ready", renderer: created });
      })
      .catch((error: Error) => {
        if (!cancelled) setLoad({ status: "error", message: error.message });
      });
    return () => {
      cancelled = true;
      renderer?.destroy();
    };
  }, [flipbook.pdf_url, attempt]);

  const renderer = load.status === "ready" ? load.renderer : null;
  const pageCount = renderer?.pageCount ?? flipbook.page_count;
  const zoom = ZOOM_STEPS[zoomStep];
  const layout = useMemo(
    () => (renderer && stage ? computeLayout(stage, renderer.aspect, zoom) : null),
    [renderer, stage, zoom],
  );

  // Render the visible pages first, then their neighbours; everything else stays lazy.
  useEffect(() => {
    if (!renderer || !layout) return;
    const current = index + 1;
    renderer.setFocus(current);
    const visible = layout.spread ? [current, current + 1] : [current];
    const nearby: number[] = [];
    for (let p = current - PRELOAD_BEHIND; p <= current + PRELOAD_AHEAD + 1; p++) nearby.push(p);
    renderer.request([...visible, ...nearby], layout.pageWidth);
  }, [renderer, layout, index]);

  const prev = useCallback(() => controllerRef.current?.prev(), []);
  const next = useCallback(() => controllerRef.current?.next(), []);

  // Always sees the latest state, but the listener itself is registered once.
  // (Re-subscribing on every render could drop the very key press that caused it.)
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (shareOpen || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    switch (event.key) {
      case "ArrowLeft":
      case "PageUp":
        event.preventDefault();
        prev();
        break;
      case "ArrowRight":
      case "PageDown":
      case " ":
        event.preventDefault();
        next();
        break;
      case "Home":
        controllerRef.current?.goTo(0);
        break;
      case "End":
        controllerRef.current?.goTo(pageCount - 1);
        break;
      case "Escape":
        // Browsers exit fullscreen on Escape themselves; this covers the rest.
        if (fullscreen.isFullscreen) void fullscreen.toggle();
        break;
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  if (load.status === "loading") {
    return <LoadingPage tone="dark" label="Loading publication…" />;
  }

  if (load.status === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-viewer px-6 text-center text-white">
        <AlertTriangle className="size-8 text-amber-400" strokeWidth={1.5} />
        <div>
          <h1 className="text-lg font-semibold">This publication couldn&apos;t be opened</h1>
          <p className="mt-1.5 max-w-md text-sm text-white/60">{load.message}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoad({ status: "loading" });
            setAttempt((n) => n + 1);
          }}
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-stone-900 hover:bg-white/90"
        >
          <RotateCw className="size-4" /> Try again
        </button>
      </div>
    );
  }

  const spread = layout?.spread ?? false;
  const showsPair = spread && index > 0 && index + 1 < pageCount;
  const pageLabel = showsPair ? `${index + 1}–${index + 2}` : `${index + 1}`;
  const lastIndex = pageCount - 1;
  const canPrev = index > 0;
  const canNext = showsPair ? index + 2 <= lastIndex : index < lastIndex;
  const zoomed = zoomStep > 0;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-viewer text-white">
      <header
        className={`flex h-12 shrink-0 items-center px-4 transition-opacity duration-500 sm:h-14 sm:px-6 ${
          idle ? "opacity-40" : "opacity-100"
        }`}
      >
        <h1 className="truncate text-sm font-medium text-white/75">{flipbook.title}</h1>
      </header>

      <div
        ref={setStageEl}
        className={`relative min-h-0 flex-1 ${zoomed ? "overflow-auto" : "overflow-hidden"}`}
      >
        {layout && renderer && (
          <div className="flex min-h-full min-w-full items-center justify-center" style={{ width: "max-content" }}>
            <div className="p-3 sm:p-7">
              <div className="drop-shadow-[0_18px_40px_rgb(0_0_0/0.45)]">
                <FlipbookBook
                  renderer={renderer}
                  pageWidth={layout.pageWidth}
                  pageHeight={layout.pageHeight}
                  spread={layout.spread}
                  startIndex={index}
                  onFlip={setIndex}
                  controllerRef={controllerRef}
                />
              </div>
            </div>
          </div>
        )}

        {/* Large side arrows on tablet/desktop (phones swipe). */}
        {!zoomed && (
          <>
            <SideArrow side="left" onClick={prev} disabled={!canPrev} dimmed={idle} />
            <SideArrow side="right" onClick={next} disabled={!canNext} dimmed={idle} />
          </>
        )}
      </div>

      <div className="pointer-events-none flex shrink-0 justify-center px-3 pt-2 pb-[max(env(safe-area-inset-bottom),14px)] sm:pb-5">
        <ViewerToolbar
          pageLabel={pageLabel}
          pageCount={pageCount}
          canPrev={canPrev}
          canNext={canNext}
          onPrev={prev}
          onNext={next}
          canZoomIn={zoomStep < ZOOM_STEPS.length - 1}
          canZoomOut={zoomStep > 0}
          onZoomIn={() => setZoomStep((s) => Math.min(s + 1, ZOOM_STEPS.length - 1))}
          onZoomOut={() => setZoomStep((s) => Math.max(s - 1, 0))}
          fullscreenSupported={fullscreen.supported}
          isFullscreen={fullscreen.isFullscreen}
          onToggleFullscreen={fullscreen.toggle}
          downloadUrl={`${flipbook.pdf_url}?download=${encodeURIComponent(`${flipbook.title}.pdf`)}`}
          onShare={() => setShareOpen(true)}
          dimmed={idle && !shareOpen}
        />
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={flipbookUrl(flipbook.slug)}
        title={flipbook.title}
      />
    </div>
  );
}

function SideArrow({
  side,
  onClick,
  disabled,
  dimmed,
}: {
  side: "left" | "right";
  onClick: () => void;
  disabled: boolean;
  dimmed: boolean;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous page" : "Next page"}
      onClick={onClick}
      disabled={disabled}
      className={`absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full text-white/60 transition-[opacity,background-color,color] duration-500 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-0 sm:grid ${
        side === "left" ? "left-3" : "right-3"
      } ${dimmed ? "opacity-30" : "opacity-100"}`}
    >
      <Icon className="size-7" strokeWidth={1.5} />
    </button>
  );
}

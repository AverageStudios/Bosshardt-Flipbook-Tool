"use client";

import { RotateCw } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import type { PageRenderer } from "@/lib/pdf/page-renderer";

const noSnapshot = () => undefined;
const noError = () => false;

/** One page of the book: the rendered PDF image, or a placeholder while it renders. */
export function FlipbookPage({ renderer, pageNumber }: { renderer: PageRenderer; pageNumber: number }) {
  const url = useSyncExternalStore(renderer.subscribe, () => renderer.getImage(pageNumber)?.url, noSnapshot);
  const failed = useSyncExternalStore(renderer.subscribe, () => renderer.hasError(pageNumber), noError);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const visible = url !== undefined && loadedUrl !== null;

  return (
    <div className="absolute inset-0 select-none">
      {!visible && !failed && (
        <div className="page-shimmer absolute inset-0 flex items-end justify-center pb-6">
          <span className="text-xs text-stone-400">{pageNumber}</span>
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-stone-50 p-6 text-center">
          <p className="text-sm text-stone-500">Page {pageNumber} couldn&apos;t be displayed.</p>
          <button
            type="button"
            // Stop page-flip from treating the tap as a page turn.
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              renderer.retry(pageNumber);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
          >
            <RotateCw className="size-3.5" /> Try again
          </button>
        </div>
      )}

      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- rendered page (blob URL)
        <img
          src={url}
          alt={`Page ${pageNumber}`}
          draggable={false}
          onLoad={() => setLoadedUrl(url)}
          className={`pointer-events-none absolute inset-0 size-full object-contain transition-opacity duration-200 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

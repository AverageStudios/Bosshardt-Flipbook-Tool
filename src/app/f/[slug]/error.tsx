"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

export default function FlipbookError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-viewer px-6 text-center text-white">
      <AlertTriangle className="size-8 text-amber-400" strokeWidth={1.5} />
      <div>
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-1.5 max-w-sm text-sm text-white/55">
          The publication couldn&apos;t be loaded. Check your connection and try again.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-stone-900 hover:bg-white/90"
      >
        <RotateCw className="size-4" /> Try again
      </button>
    </main>
  );
}

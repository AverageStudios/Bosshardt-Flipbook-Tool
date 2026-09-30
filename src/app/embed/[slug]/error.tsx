"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

export default function EmbedError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-viewer px-6 text-center text-white">
      <AlertTriangle className="size-7 text-amber-400" strokeWidth={1.5} />
      <div>
        <h1 className="text-base font-semibold">Flipbook unavailable</h1>
        <p className="mt-1 max-w-sm text-sm text-white/55">The publication couldn&apos;t be loaded right now.</p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="mt-1 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3.5 text-sm font-medium text-stone-900 hover:bg-white/90"
      >
        <RotateCw className="size-4" /> Try again
      </button>
    </main>
  );
}

import { BookX } from "lucide-react";

/** Shown inside the host site's iframe, so it stays small and self-contained. */
export default function EmbedNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-viewer px-6 text-center text-white">
      <BookX className="size-8 text-white/40" strokeWidth={1.5} />
      <div>
        <h1 className="text-base font-semibold">Flipbook unavailable</h1>
        <p className="mt-1 max-w-sm text-sm text-white/55">This publication may have been removed.</p>
      </div>
    </main>
  );
}

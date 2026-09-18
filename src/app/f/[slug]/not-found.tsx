import { BookX } from "lucide-react";

export default function FlipbookNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-viewer px-6 text-center text-white">
      <BookX className="size-9 text-white/40" strokeWidth={1.5} />
      <div>
        <h1 className="text-lg font-semibold">This flipbook isn&apos;t available</h1>
        <p className="mt-1.5 max-w-sm text-sm text-white/55">
          The link may be incorrect, or the publication may have been removed. Please check with the person who
          shared it with you.
        </p>
      </div>
    </main>
  );
}

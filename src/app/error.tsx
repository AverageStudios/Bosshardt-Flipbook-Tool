"use client";

import { AlertTriangle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <AlertTriangle className="size-8 text-amber-500" strokeWidth={1.5} />
      <h1 className="mt-4 text-xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">Please check your connection and try again.</p>
      <button type="button" onClick={reset} className={buttonClass("primary", "md", "mt-6")}>
        Try again
      </button>
    </main>
  );
}

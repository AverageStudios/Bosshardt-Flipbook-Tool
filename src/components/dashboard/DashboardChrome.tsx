"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FlipbookNavItem, Folder } from "@/lib/types";
import { BrandMark } from "../BrandMark";
import { DashboardSidebar } from "./DashboardSidebar";

/**
 * Dashboard shell: a permanent sidebar from `lg` up, and a slide-over drawer
 * below it so the flipbook grid keeps the full width on phones.
 */
export function DashboardChrome({
  folders,
  flipbooks,
  children,
}: {
  folders: Folder[];
  flipbooks: FlipbookNavItem[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Don't trap the page behind an invisible overlay if the viewport grows.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-line bg-surface lg:block">
        <DashboardSidebar folders={folders} flipbooks={flipbooks} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Folders"
            className="drawer-in absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] border-r border-line bg-surface shadow-lift"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-3 z-10 rounded-md p-1.5 text-muted hover:bg-stone-100 hover:text-ink"
            >
              <X className="size-4" />
            </button>
            <DashboardSidebar folders={folders} flipbooks={flipbooks} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/85 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="-ml-1.5 rounded-lg p-2 text-muted hover:bg-stone-100 hover:text-ink"
          >
            <Menu className="size-5" />
          </button>
          <BrandMark />
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

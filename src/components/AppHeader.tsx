import { Plus } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { buttonClass } from "./ui/button";

export function AppHeader({ showNewButton = true }: { showNewButton?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandMark />
        {showNewButton && (
          <Link href="/new" className={buttonClass("primary", "md")}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Flipbook</span>
            <span className="sm:hidden">New</span>
          </Link>
        )}
      </div>
    </header>
  );
}

"use client";

import { FileText, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { Flipbook } from "@/lib/types";
import {
  FlipbookMenuItems,
  flipbookDragProps,
  useMenuDismiss,
  type FlipbookActions,
} from "./FlipbookCard";

interface FlipbookRowProps extends FlipbookActions {
  flipbook: Flipbook;
  folderName?: string | null;
}

/** List view: thumbnail, name, folder, created date, actions. */
export function FlipbookRow({ flipbook, folderName, onRename, onMove, onDelete }: FlipbookRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const menuRef = useMenuDismiss(menuOpen, () => setMenuOpen(false));
  const href = `/f/${flipbook.slug}`;

  return (
    <li
      {...flipbookDragProps(flipbook)}
      className="flex items-center gap-3 px-3 py-2.5 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-stone-50 sm:gap-4 sm:px-4 sm:first:rounded-t-none"
    >
      <Link href={href} draggable={false} aria-label={`Open ${flipbook.title}`} className="shrink-0">
        <span className="grid h-12 w-9 place-items-center overflow-hidden rounded-[3px] bg-stone-100 text-muted shadow-card">
          {flipbook.thumbnail_url && !thumbFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Supabase image
            <img
              src={flipbook.thumbnail_url}
              alt=""
              loading="lazy"
              draggable={false}
              onError={() => setThumbFailed(true)}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <FileText className="size-4" strokeWidth={1.5} />
          )}
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={href}
          draggable={false}
          className="block truncate text-sm font-medium text-ink hover:underline"
          title={flipbook.title}
        >
          {flipbook.title}
        </Link>
        <p className="truncate text-[13px] text-muted sm:hidden">
          {folderName ?? "No folder"} · {formatDate(flipbook.created_at)}
        </p>
      </div>

      <div className="hidden w-40 shrink-0 truncate text-[13px] text-muted sm:block" title={folderName ?? undefined}>
        {folderName ?? "—"}
      </div>
      <div className="hidden w-28 shrink-0 text-[13px] text-muted sm:block">{formatDate(flipbook.created_at)}</div>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          aria-label={`More actions for ${flipbook.title}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-md p-1.5 text-muted hover:bg-stone-100 hover:text-ink"
        >
          <MoreHorizontal className="size-4" />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lift"
          >
            <FlipbookMenuItems
              flipbook={flipbook}
              href={href}
              onPick={() => setMenuOpen(false)}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    </li>
  );
}

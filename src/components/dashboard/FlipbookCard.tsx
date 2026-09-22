"use client";

import { Check, ExternalLink, FileText, FolderInput, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { flipbookUrl, formatDate } from "@/lib/format";
import type { Flipbook } from "@/lib/types";
import { buttonClass } from "../ui/button";
import { FLIPBOOK_DRAG_TYPE } from "./nav";

export interface FlipbookActions {
  onRename: (flipbook: Flipbook) => void;
  onMove: (flipbook: Flipbook) => void;
  onDelete: (flipbook: Flipbook) => void;
}

interface FlipbookCardProps extends FlipbookActions {
  flipbook: Flipbook;
  /** Shown subtly under the title when browsing across folders. */
  folderName?: string | null;
}

/** Closes a popover menu on outside click or Escape. */
export function useMenuDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [open, close]);
  return ref;
}

/** Shared menu items so the grid card and the list row stay in step. */
export function FlipbookMenuItems({
  flipbook,
  href,
  onPick,
  onRename,
  onMove,
  onDelete,
}: FlipbookActions & { flipbook: Flipbook; href: string; onPick: () => void }) {
  const [copied, setCopied] = useState(false);
  const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-stone-50";
  return (
    <>
      <Link role="menuitem" href={href} onClick={onPick} className={item}>
        <ExternalLink className="size-3.5 text-muted" /> Open
      </Link>
      <button
        role="menuitem"
        type="button"
        onClick={async () => {
          if (await copyText(flipbookUrl(flipbook.slug))) {
            setCopied(true);
            setTimeout(onPick, 900);
          } else {
            onPick();
          }
        }}
        className={item}
      >
        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Link2 className="size-3.5 text-muted" />}
        {copied ? "Copied" : "Copy Link"}
      </button>
      <button
        role="menuitem"
        type="button"
        onClick={() => {
          onPick();
          onRename(flipbook);
        }}
        className={item}
      >
        <Pencil className="size-3.5 text-muted" /> Rename
      </button>
      <button
        role="menuitem"
        type="button"
        onClick={() => {
          onPick();
          onMove(flipbook);
        }}
        className={item}
      >
        <FolderInput className="size-3.5 text-muted" /> Move to Folder
      </button>
      <button
        role="menuitem"
        type="button"
        onClick={() => {
          onPick();
          onDelete(flipbook);
        }}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 className="size-3.5" /> Delete
      </button>
    </>
  );
}

/** Marks a card as the payload of a drag onto a sidebar folder. */
export function flipbookDragProps(flipbook: Flipbook) {
  return {
    draggable: true,
    onDragStart: (event: React.DragEvent) => {
      event.dataTransfer.setData(FLIPBOOK_DRAG_TYPE, flipbook.id);
      event.dataTransfer.setData("text/plain", flipbook.title);
      event.dataTransfer.effectAllowed = "move";
    },
  };
}

export function FlipbookCard({ flipbook, folderName, onRename, onMove, onDelete }: FlipbookCardProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const menuRef = useMenuDismiss(menuOpen, () => setMenuOpen(false));
  const href = `/f/${flipbook.slug}`;

  async function handleCopy() {
    if (await copyText(flipbookUrl(flipbook.slug))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <article
      {...flipbookDragProps(flipbook)}
      className="group flex flex-col rounded-xl border border-line bg-surface shadow-card transition-shadow hover:shadow-lift"
    >
      <Link
        href={href}
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t-xl bg-stone-100 px-6 pt-6"
        aria-label={`Open ${flipbook.title}`}
      >
        {flipbook.thumbnail_url && !thumbFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Supabase image
          <img
            src={flipbook.thumbnail_url}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setThumbFailed(true)}
            className="h-full w-auto max-w-full self-end rounded-t-[3px] object-contain object-bottom shadow-[0_2px_12px_rgb(0_0_0/0.14)] transition-transform duration-300 group-hover:-translate-y-1"
          />
        ) : (
          <div className="flex h-full aspect-[3/4] self-end flex-col items-center justify-center gap-2 rounded-t-[3px] bg-white text-muted shadow-[0_2px_12px_rgb(0_0_0/0.1)]">
            <FileText className="size-8" strokeWidth={1.5} />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 border-t border-line p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-medium text-ink" title={flipbook.title}>
              {flipbook.title}
            </h3>
            <p className="mt-0.5 text-[13px] text-muted">
              {formatDate(flipbook.created_at)} · {flipbook.page_count} {flipbook.page_count === 1 ? "page" : "pages"}
            </p>
            {folderName && (
              <p className="mt-0.5 truncate text-[12px] text-muted/80" title={folderName}>
                {folderName}
              </p>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="More actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="-mr-1.5 rounded-md p-1.5 text-muted hover:bg-stone-100 hover:text-ink"
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
        </div>

        <div className="mt-auto flex gap-2">
          <Link href={href} className={buttonClass("primary", "sm", "flex-1")}>
            Open
          </Link>
          <button type="button" onClick={handleCopy} className={buttonClass("secondary", "sm", "flex-1")}>
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Link2 className="size-3.5" />}
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>
      </div>
    </article>
  );
}

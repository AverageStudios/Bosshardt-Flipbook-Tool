"use client";

import { Check, FileText, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { flipbookUrl, formatDate } from "@/lib/format";
import type { Flipbook } from "@/lib/types";
import { buttonClass } from "../ui/button";

interface FlipbookCardProps {
  flipbook: Flipbook;
  onRename: (flipbook: Flipbook) => void;
  onDelete: (flipbook: Flipbook) => void;
}

export function FlipbookCard({ flipbook, onRename, onDelete }: FlipbookCardProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const href = `/f/${flipbook.slug}`;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  async function handleCopy() {
    if (await copyText(flipbookUrl(flipbook.slug))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-shadow hover:shadow-lift">
      <Link
        href={href}
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-stone-100 px-6 pt-6"
        aria-label={`Open ${flipbook.title}`}
      >
        {flipbook.thumbnail_url && !thumbFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Supabase image
          <img
            src={flipbook.thumbnail_url}
            alt=""
            loading="lazy"
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
                className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lift"
              >
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(flipbook);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-stone-50"
                >
                  <Pencil className="size-3.5 text-muted" /> Rename
                </button>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(flipbook);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
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

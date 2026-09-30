"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** "dark" matches the flipbook viewer. */
  tone?: "light" | "dark";
  /** "lg" for wider content such as the embed code and preview. */
  size?: "md" | "lg";
}

export function Modal({ open, title, onClose, children, tone = "light", size = "md" }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Callers often pass an inline onClose; reading it through a ref keeps the
  // effect below from re-running (and stealing focus) on every parent render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKey, true);
    panelRef.current?.querySelector<HTMLElement>("input, button:not([data-close])")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const dark = tone === "dark";
  // Rendered into <body>: a `position: sticky` or backdrop-filtered ancestor
  // (the dashboard sidebar and header are both) creates a stacking context
  // that would otherwise trap this overlay behind the page content.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className={`absolute inset-0 ${dark ? "bg-black/60" : "bg-stone-900/30"} backdrop-blur-[2px]`}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-2xl border p-5 shadow-2xl ${
          size === "lg" ? "max-w-2xl" : "max-w-md"
        } ${
          dark ? "border-white/10 bg-viewer-panel text-white" : "border-line bg-surface text-ink"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="Close"
            className={`-mr-1 rounded-md p-1.5 ${
              dark ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-stone-100 hover:text-ink"
            }`}
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

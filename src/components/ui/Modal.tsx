"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** "dark" matches the flipbook viewer. */
  tone?: "light" | "dark";
}

export function Modal({ open, title, onClose, children, tone = "light" }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    panelRef.current?.querySelector<HTMLElement>("input, button:not([data-close])")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const dark = tone === "dark";
  return (
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
        className={`relative w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
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
    </div>
  );
}

"use client";

import { BookOpen, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Flipbook } from "@/lib/types";
import { buttonClass } from "../ui/button";
import { Modal } from "../ui/Modal";
import { FlipbookCard } from "./FlipbookCard";

async function request(url: string, init: RequestInit, fallback: string) {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? fallback);
  }
}

export function FlipbookGrid({ flipbooks }: { flipbooks: Flipbook[] }) {
  const router = useRouter();
  const [items, setItems] = useState(flipbooks);
  const [renaming, setRenaming] = useState<Flipbook | null>(null);
  const [deleting, setDeleting] = useState<Flipbook | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep local state in sync when the server sends a fresh list.
  const [source, setSource] = useState(flipbooks);
  if (source !== flipbooks) {
    setSource(flipbooks);
    setItems(flipbooks);
  }

  function closeDialogs() {
    if (busy) return;
    setRenaming(null);
    setDeleting(null);
    setError(null);
  }

  async function submitRename(event: React.FormEvent) {
    event.preventDefault();
    if (!renaming) return;
    const title = draftTitle.trim();
    if (!title) return setError("Please enter a title.");
    setBusy(true);
    setError(null);
    try {
      await request(
        `/api/flipbooks/${renaming.id}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) },
        "Could not rename the flipbook.",
      );
      setItems((list) => list.map((f) => (f.id === renaming.id ? { ...f, title } : f)));
      setRenaming(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    try {
      await request(`/api/flipbooks/${deleting.id}`, { method: "DELETE" }, "Could not delete the flipbook.");
      setItems((list) => list.filter((f) => f.id !== deleting.id));
      setDeleting(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-6 py-20 text-center">
        <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-stone-100 text-muted">
          <BookOpen className="size-6" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-ink">No flipbooks yet</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          Upload a brochure, offering memorandum or market report to turn it into a shareable flipbook.
        </p>
        <Link href="/new" className={buttonClass("primary", "lg", "mt-7")}>
          <Upload className="size-4" />
          Upload PDF
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((flipbook) => (
          <FlipbookCard
            key={flipbook.id}
            flipbook={flipbook}
            onRename={(f) => {
              setDraftTitle(f.title);
              setError(null);
              setRenaming(f);
            }}
            onDelete={(f) => {
              setError(null);
              setDeleting(f);
            }}
          />
        ))}
      </div>

      <Modal open={renaming !== null} title="Rename flipbook" onClose={closeDialogs}>
        <form onSubmit={submitRename} className="space-y-4">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            maxLength={200}
            aria-label="Flipbook title"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
          <p className="text-xs text-muted">The shareable link stays the same.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeDialogs} className={buttonClass("secondary")}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={buttonClass("primary")}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} title="Delete flipbook?" onClose={closeDialogs}>
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-medium text-ink">{deleting?.title}</span> and its PDF will be permanently deleted.
          Anyone with the link will no longer be able to view it.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={closeDialogs} className={buttonClass("secondary")}>
            Cancel
          </button>
          <button type="button" onClick={confirmDelete} disabled={busy} className={buttonClass("danger")}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </>
  );
}

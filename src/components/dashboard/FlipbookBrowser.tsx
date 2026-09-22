"use client";

import { BookOpen, Check, FolderOpen, LayoutGrid, List, Plus, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MAX_TITLE_LENGTH } from "@/lib/config";
import { del, patchJson } from "@/lib/request";
import type { Flipbook, Folder } from "@/lib/types";
import { buttonClass } from "../ui/button";
import { Modal } from "../ui/Modal";
import { FlipbookCard } from "./FlipbookCard";
import { FlipbookRow } from "./FlipbookRow";
import { setLayout, useLayout } from "./layoutPreference";
import { ALL_HREF, newFlipbookHref } from "./nav";

export type BrowserView =
  | { kind: "all" }
  | { kind: "recent" }
  | { kind: "folder"; folder: Folder };

interface FlipbookBrowserProps {
  view: BrowserView;
  flipbooks: Flipbook[];
  folders: Folder[];
}

const HEADINGS: Record<BrowserView["kind"], string> = {
  all: "All Flipbooks",
  recent: "Recent",
  folder: "",
};

export function FlipbookBrowser({ view, flipbooks, folders }: FlipbookBrowserProps) {
  const router = useRouter();
  const currentFolder = view.kind === "folder" ? view.folder : null;

  const [items, setItems] = useState(flipbooks);
  const [query, setQuery] = useState("");
  const layout = useLayout();
  const [renaming, setRenaming] = useState<Flipbook | null>(null);
  const [moving, setMoving] = useState<Flipbook | null>(null);
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

  const folderNames = useMemo(() => new Map(folders.map((f) => [f.id, f.name])), [folders]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((f) => f.title.toLowerCase().includes(needle));
  }, [items, query]);

  const heading = currentFolder ? currentFolder.name : HEADINGS[view.kind];

  function closeDialogs() {
    if (busy) return;
    setRenaming(null);
    setMoving(null);
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
      await patchJson(`/api/flipbooks/${renaming.id}`, { title }, "Could not rename the flipbook.");
      setItems((list) => list.map((f) => (f.id === renaming.id ? { ...f, title } : f)));
      setRenaming(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitMove(folderId: string | null) {
    if (!moving) return;
    if (moving.folder_id === folderId) return setMoving(null);
    setBusy(true);
    setError(null);
    try {
      await patchJson(`/api/flipbooks/${moving.id}`, { folderId }, "Could not move the flipbook.");
      setItems((list) =>
        // Inside a folder, a flipbook moved elsewhere leaves the list straight away.
        currentFolder && folderId !== currentFolder.id
          ? list.filter((f) => f.id !== moving.id)
          : list.map((f) => (f.id === moving.id ? { ...f, folder_id: folderId } : f)),
      );
      setMoving(null);
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
      await del(`/api/flipbooks/${deleting.id}`, "Could not delete the flipbook.");
      setItems((list) => list.filter((f) => f.id !== deleting.id));
      setDeleting(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const actions = {
    onRename: (f: Flipbook) => {
      setDraftTitle(f.title);
      setError(null);
      setRenaming(f);
    },
    onMove: (f: Flipbook) => {
      setError(null);
      setMoving(f);
    },
    onDelete: (f: Flipbook) => {
      setError(null);
      setDeleting(f);
    },
  };

  return (
    <>
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-[13px] text-muted">
        {view.kind === "all" ? (
          <span className="text-ink">All Flipbooks</span>
        ) : (
          <>
            <Link href={ALL_HREF} className="hover:text-ink">
              All Flipbooks
            </Link>
            <span aria-hidden>/</span>
            <span className="truncate text-ink">{heading}</span>
          </>
        )}
      </nav>

      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-ink" title={heading}>
          {heading}
        </h1>
        <span className="shrink-0 text-sm text-muted">
          {items.length} {items.length === 1 ? "Flipbook" : "Flipbooks"}
        </span>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search flipbooks..."
            aria-label="Search flipbooks"
            className="h-9 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line bg-surface p-0.5 shadow-card">
            {(
              [
                ["grid", LayoutGrid, "Grid View"],
                ["list", List, "List View"],
              ] as const
            ).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setLayout(mode)}
                aria-label={label}
                title={label}
                aria-pressed={layout === mode}
                className={`grid size-8 place-items-center rounded-[6px] transition-colors ${
                  layout === mode ? "bg-stone-100 text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>

          <Link href={newFlipbookHref(currentFolder?.id)} className={buttonClass("primary", "md", "shrink-0")}>
            <Plus className="size-4" />
            New Flipbook
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState view={view} folderId={currentFolder?.id} />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted">
            No flipbooks match <span className="font-medium text-ink">“{query.trim()}”</span>
            {currentFolder ? ` in ${currentFolder.name}.` : "."}
          </p>
        </div>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((flipbook) => (
            <FlipbookCard
              key={flipbook.id}
              flipbook={flipbook}
              folderName={currentFolder ? null : (flipbook.folder_id && folderNames.get(flipbook.folder_id)) || null}
              {...actions}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface shadow-card">
          <div className="hidden items-center gap-4 border-b border-line px-4 py-2 text-[12px] font-medium tracking-wide text-muted uppercase sm:flex">
            <span className="w-9 shrink-0" />
            <span className="flex-1">Name</span>
            <span className="w-40 shrink-0">Folder</span>
            <span className="w-28 shrink-0">Created</span>
            <span className="w-7 shrink-0" />
          </div>
          <ul className="divide-y divide-line">
            {visible.map((flipbook) => (
              <FlipbookRow
                key={flipbook.id}
                flipbook={flipbook}
                folderName={(flipbook.folder_id && folderNames.get(flipbook.folder_id)) || null}
                {...actions}
              />
            ))}
          </ul>
        </div>
      )}

      <Modal open={renaming !== null} title="Rename flipbook" onClose={closeDialogs}>
        <form onSubmit={submitRename} className="space-y-4">
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            maxLength={MAX_TITLE_LENGTH}
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

      <Modal open={moving !== null} title={`Move “${moving?.title ?? ""}”`} onClose={closeDialogs}>
        <div className="-mx-1 max-h-72 overflow-y-auto">
          <FolderChoice
            label="No Folder"
            selected={moving?.folder_id == null}
            disabled={busy}
            onSelect={() => void submitMove(null)}
          />
          {folders.length > 0 && <div className="my-1.5 border-t border-line" />}
          {folders.map((folder) => (
            <FolderChoice
              key={folder.id}
              label={folder.name}
              selected={moving?.folder_id === folder.id}
              disabled={busy}
              onSelect={() => void submitMove(folder.id)}
            />
          ))}
        </div>
        {folders.length === 0 && (
          <p className="mt-2 px-1 text-xs text-muted">Create a folder in the sidebar to file this flipbook.</p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={closeDialogs} className={buttonClass("secondary")}>
            Cancel
          </button>
        </div>
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

function FolderChoice({
  label,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-stone-50 disabled:opacity-60"
    >
      <span className="truncate">{label}</span>
      {selected && <Check className="size-4 shrink-0 text-brand" />}
    </button>
  );
}

function EmptyState({ view, folderId }: { view: BrowserView; folderId?: string }) {
  const inFolder = view.kind === "folder";
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-6 py-20 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-stone-100 text-muted">
        {inFolder ? (
          <FolderOpen className="size-6" strokeWidth={1.5} />
        ) : (
          <BookOpen className="size-6" strokeWidth={1.5} />
        )}
      </div>
      <h2 className="text-lg font-semibold text-ink">{inFolder ? "This folder is empty" : "No flipbooks yet"}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted">
        {inFolder
          ? "Move an existing flipbook here or create a new one."
          : "Upload a brochure, offering memorandum or market report to turn it into a shareable flipbook."}
      </p>
      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        <Link href={newFlipbookHref(folderId)} className={buttonClass("primary", "lg")}>
          <Upload className="size-4" />
          {inFolder ? "New Flipbook" : "Upload PDF"}
        </Link>
        {inFolder && (
          <Link href={ALL_HREF} className={buttonClass("secondary", "lg")}>
            Move Flipbook
          </Link>
        )}
      </div>
    </div>
  );
}

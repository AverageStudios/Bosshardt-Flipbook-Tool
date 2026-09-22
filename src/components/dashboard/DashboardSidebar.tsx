"use client";

import { Clock, Files, Folder as FolderIcon, FolderPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_FOLDER_NAME_LENGTH } from "@/lib/config";
import { del, patchJson, postJson } from "@/lib/request";
import type { Folder } from "@/lib/types";
import { BrandMark } from "../BrandMark";
import { buttonClass } from "../ui/button";
import { Modal } from "../ui/Modal";
import { ALL_HREF, FLIPBOOK_DRAG_TYPE, RECENT_HREF, folderHref } from "./nav";

const linkBase =
  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const linkIdle = "text-muted hover:bg-stone-100 hover:text-ink";
const linkActive = "bg-stone-100 font-medium text-ink";

/**
 * Permanent left navigation: All Flipbooks, Recent, and the folders stored in
 * Supabase. Folders are also drop targets — dragging a card onto one moves it.
 */
export function DashboardSidebar({ folders, onNavigate }: { folders: Folder[]; onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState<Folder | null>(null);
  const [draftName, setDraftName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeDialogs() {
    if (busy) return;
    setCreating(false);
    setRenaming(null);
    setDeleting(null);
    setError(null);
  }

  async function submitCreate(event: React.FormEvent) {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) return setError("Please enter a folder name.");
    setBusy(true);
    setError(null);
    try {
      const result = await postJson<{ folder: Folder }>("/api/folders", { name }, "Could not create the folder.");
      setCreating(false);
      // Drop the user straight into the folder they just made, then refresh so
      // the sidebar picks it up (refreshing first would race the navigation).
      if (result?.folder) {
        router.push(folderHref(result.folder.id));
        onNavigate?.();
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitRename(event: React.FormEvent) {
    event.preventDefault();
    if (!renaming) return;
    const name = draftName.trim();
    if (!name) return setError("Please enter a folder name.");
    setBusy(true);
    setError(null);
    try {
      await patchJson(`/api/folders/${renaming.id}`, { name }, "Could not rename the folder.");
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
      await del(`/api/folders/${deleting.id}`, "Could not delete the folder.");
      const wasOpen = pathname === folderHref(deleting.id);
      setDeleting(null);
      if (wasOpen) router.push(ALL_HREF);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function moveIntoFolder(flipbookId: string, folderId: string) {
    try {
      await patchJson(`/api/flipbooks/${flipbookId}`, { folderId }, "Could not move the flipbook.");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-4">
        <BrandMark />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          <li>
            <Link
              href={ALL_HREF}
              onClick={onNavigate}
              aria-current={pathname === ALL_HREF ? "page" : undefined}
              className={`${linkBase} ${pathname === ALL_HREF ? linkActive : linkIdle}`}
            >
              <Files className="size-4 shrink-0" strokeWidth={1.75} />
              All Flipbooks
            </Link>
          </li>
          <li>
            <Link
              href={RECENT_HREF}
              onClick={onNavigate}
              aria-current={pathname === RECENT_HREF ? "page" : undefined}
              className={`${linkBase} ${pathname === RECENT_HREF ? linkActive : linkIdle}`}
            >
              <Clock className="size-4 shrink-0" strokeWidth={1.75} />
              Recent
            </Link>
          </li>
        </ul>

        <div className="my-4 border-t border-line" />

        <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">Folders</p>

        {folders.length === 0 ? (
          <p className="px-2.5 py-2 text-[13px] leading-relaxed text-muted">
            No folders yet. Create one to group your flipbooks.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {folders.map((folder) => (
              <SidebarFolder
                key={folder.id}
                folder={folder}
                active={pathname === folderHref(folder.id)}
                onNavigate={onNavigate}
                onRename={() => {
                  setDraftName(folder.name);
                  setError(null);
                  setRenaming(folder);
                }}
                onDelete={() => {
                  setError(null);
                  setDeleting(folder);
                }}
                onDropFlipbook={(flipbookId) => void moveIntoFolder(flipbookId, folder.id)}
              />
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => {
            setDraftName("");
            setError(null);
            setCreating(true);
          }}
          className={`${linkBase} ${linkIdle} mt-1 w-full`}
        >
          <FolderPlus className="size-4 shrink-0" strokeWidth={1.75} />
          New Folder
        </button>
      </nav>

      <Modal open={creating} title="New folder" onClose={closeDialogs}>
        <form onSubmit={submitCreate} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Folder Name</span>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={MAX_FOLDER_NAME_LENGTH}
              placeholder="e.g. Medical"
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeDialogs} className={buttonClass("secondary")}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={buttonClass("primary")}>
              {busy ? "Creating…" : "Create Folder"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={renaming !== null} title="Rename folder" onClose={closeDialogs}>
        <form onSubmit={submitRename} className="space-y-4">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={MAX_FOLDER_NAME_LENGTH}
            aria-label="Folder name"
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
          <p className="text-xs text-muted">The flipbooks inside it are not affected.</p>
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

      <Modal open={deleting !== null} title={`Delete “${deleting?.name ?? ""}”?`} onClose={closeDialogs}>
        <p className="text-sm leading-relaxed text-muted">
          Deleting this folder will not delete any flipbooks. Flipbooks inside it will return to All Flipbooks.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={closeDialogs} className={buttonClass("secondary")}>
            Cancel
          </button>
          <button type="button" onClick={confirmDelete} disabled={busy} className={buttonClass("danger")}>
            {busy ? "Deleting…" : "Delete Folder"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

interface SidebarFolderProps {
  folder: Folder;
  active: boolean;
  onNavigate?: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDropFlipbook: (flipbookId: string) => void;
}

function SidebarFolder({ folder, active, onNavigate, onRename, onDelete, onDropFlipbook }: SidebarFolderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const carriesFlipbook = (event: React.DragEvent) => event.dataTransfer.types.includes(FLIPBOOK_DRAG_TYPE);

  return (
    <li
      className="group/folder relative"
      onDragOver={(event) => {
        if (!carriesFlipbook(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDropTarget(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(false);
      }}
      onDrop={(event) => {
        if (!carriesFlipbook(event)) return;
        event.preventDefault();
        setDropTarget(false);
        const id = event.dataTransfer.getData(FLIPBOOK_DRAG_TYPE);
        if (id) onDropFlipbook(id);
      }}
    >
      <Link
        href={folderHref(folder.id)}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={folder.name}
        className={`${linkBase} pr-8 ${
          dropTarget ? "bg-brand/10 ring-2 ring-brand/40 text-ink font-medium" : active ? linkActive : linkIdle
        }`}
      >
        <FolderIcon className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate">{folder.name}</span>
      </Link>

      <div ref={menuRef} className="absolute top-1/2 right-1 -translate-y-1/2">
        <button
          type="button"
          aria-label={`Actions for ${folder.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className={`rounded-md p-1 text-muted hover:bg-stone-200/70 hover:text-ink focus-visible:opacity-100 ${
            menuOpen ? "opacity-100" : "opacity-0 group-hover/folder:opacity-100 focus:opacity-100"
          }`}
        >
          <MoreHorizontal className="size-4" />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 z-30 mt-1 w-36 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lift"
          >
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onRename();
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
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

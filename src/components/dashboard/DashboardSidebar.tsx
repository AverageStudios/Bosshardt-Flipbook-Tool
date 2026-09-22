"use client";

import {
  ChevronRight,
  Clock,
  Files,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_FOLDER_NAME_LENGTH } from "@/lib/config";
import { del, patchJson, postJson } from "@/lib/request";
import type { FlipbookNavItem, Folder } from "@/lib/types";
import { BrandMark } from "../BrandMark";
import { buttonClass } from "../ui/button";
import { Modal } from "../ui/Modal";
import { ALL_HREF, FLIPBOOK_DRAG_TYPE, RECENT_HREF, folderHref } from "./nav";

const rowBase =
  "flex w-full items-center gap-2 rounded-lg py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const rowIdle = "text-muted hover:bg-stone-100 hover:text-ink";
const rowActive = "bg-stone-100 font-medium text-ink";
const dropRow = "bg-brand/10 font-medium text-ink ring-2 ring-brand/40";

/** True when a drag is carrying one of our flipbooks (not text, files, a link…). */
const carriesFlipbook = (event: React.DragEvent) => event.dataTransfer.types.includes(FLIPBOOK_DRAG_TYPE);

interface SidebarProps {
  folders: Folder[];
  flipbooks: FlipbookNavItem[];
  onNavigate?: () => void;
}

/**
 * File-tree navigation: All Flipbooks and Recent, then every folder with its
 * flipbooks nested underneath and the unfiled ones loose at the root. Folders
 * and "All Flipbooks" are drop targets, so a flipbook can be dragged from the
 * grid — or from elsewhere in the tree — to refile it.
 */
export function DashboardSidebar({ folders, flipbooks, onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState<Folder | null>(null);
  const [draftName, setDraftName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Explicit user toggles; anything unset falls back to "open if it's the
  // folder being viewed", which keeps the tree in step without an effect.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const openFolderId = pathname.startsWith("/dashboard/folder/") ? pathname.split("/")[3] : null;

  const byFolder = useMemo(() => {
    const map = new Map<string, FlipbookNavItem[]>();
    for (const flipbook of flipbooks) {
      const key = flipbook.folder_id ?? "";
      const list = map.get(key);
      if (list) list.push(flipbook);
      else map.set(key, [flipbook]);
    }
    return map;
  }, [flipbooks]);

  const unfiled = byFolder.get("") ?? [];

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

  async function moveTo(flipbookId: string, folderId: string | null) {
    try {
      await patchJson(`/api/flipbooks/${flipbookId}`, { folderId }, "Could not move the flipbook.");
      if (folderId) setToggled((state) => ({ ...state, [folderId]: true }));
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
            <DropTarget onDropFlipbook={(id) => void moveTo(id, null)}>
              {(over) => (
                <Link
                  href={ALL_HREF}
                  onClick={onNavigate}
                  draggable={false}
                  aria-current={pathname === ALL_HREF ? "page" : undefined}
                  title="All Flipbooks — drop here to remove from a folder"
                  className={`${rowBase} px-2.5 ${over ? dropRow : pathname === ALL_HREF ? rowActive : rowIdle}`}
                >
                  <Files className="size-4 shrink-0" strokeWidth={1.75} />
                  All Flipbooks
                </Link>
              )}
            </DropTarget>
          </li>
          <li>
            <Link
              href={RECENT_HREF}
              onClick={onNavigate}
              draggable={false}
              aria-current={pathname === RECENT_HREF ? "page" : undefined}
              className={`${rowBase} px-2.5 ${pathname === RECENT_HREF ? rowActive : rowIdle}`}
            >
              <Clock className="size-4 shrink-0" strokeWidth={1.75} />
              Recent
            </Link>
          </li>
        </ul>

        <div className="my-4 border-t border-line" />

        <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">Folders</p>

        {folders.length === 0 && unfiled.length === 0 ? (
          <p className="px-2.5 py-2 text-[13px] leading-relaxed text-muted">
            No folders yet. Create one to group your flipbooks.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {folders.map((folder) => (
              <SidebarFolder
                key={folder.id}
                folder={folder}
                contents={byFolder.get(folder.id) ?? []}
                active={openFolderId === folder.id}
                expanded={toggled[folder.id] ?? openFolderId === folder.id}
                onToggle={() =>
                  setToggled((state) => ({
                    ...state,
                    [folder.id]: !(state[folder.id] ?? openFolderId === folder.id),
                  }))
                }
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
                onDropFlipbook={(id) => void moveTo(id, folder.id)}
              />
            ))}
            {/* Unfiled flipbooks sit loose at the root, like files beside folders. */}
            {unfiled.map((flipbook) => (
              <SidebarFile key={flipbook.id} flipbook={flipbook} onNavigate={onNavigate} />
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
          className={`${rowBase} ${rowIdle} mt-1 px-2.5`}
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

/**
 * Wraps a row in the drag plumbing and hands its children the hover state, so
 * every drop target highlights the same way.
 */
function DropTarget({
  onDropFlipbook,
  children,
}: {
  onDropFlipbook: (flipbookId: string) => void;
  children: (over: boolean) => React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(event) => {
        if (!carriesFlipbook(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(event) => {
        if (!carriesFlipbook(event)) return;
        event.preventDefault();
        setOver(false);
        const id = event.dataTransfer.getData(FLIPBOOK_DRAG_TYPE);
        if (id) onDropFlipbook(id);
      }}
    >
      {children(over)}
    </div>
  );
}

/** A flipbook in the tree: opens the public viewer, and can be dragged elsewhere. */
function SidebarFile({
  flipbook,
  nested = false,
  onNavigate,
}: {
  flipbook: FlipbookNavItem;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={`/f/${flipbook.slug}`}
        onClick={onNavigate}
        title={flipbook.title}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData(FLIPBOOK_DRAG_TYPE, flipbook.id);
          event.dataTransfer.setData("text/plain", flipbook.title);
          event.dataTransfer.effectAllowed = "move";
        }}
        className={`${rowBase} ${rowIdle} ${nested ? "pl-9" : "pl-2.5"} pr-2.5`}
      >
        <FileText className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate">{flipbook.title}</span>
      </Link>
    </li>
  );
}

interface SidebarFolderProps {
  folder: Folder;
  contents: FlipbookNavItem[];
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDropFlipbook: (flipbookId: string) => void;
}

function SidebarFolder({
  folder,
  contents,
  active,
  expanded,
  onToggle,
  onNavigate,
  onRename,
  onDelete,
  onDropFlipbook,
}: SidebarFolderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
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

  return (
    <li className="group/folder">
      <DropTarget onDropFlipbook={onDropFlipbook}>
        {(over) => (
          <div className="relative">
            <Link
              href={folderHref(folder.id)}
              onClick={onNavigate}
              draggable={false}
              aria-current={active ? "page" : undefined}
              title={folder.name}
              className={`${rowBase} pr-8 pl-8 ${over ? dropRow : active ? rowActive : rowIdle}`}
            >
              {expanded ? (
                <FolderOpen className="size-4 shrink-0" strokeWidth={1.75} />
              ) : (
                <FolderIcon className="size-4 shrink-0" strokeWidth={1.75} />
              )}
              <span className="truncate">{folder.name}</span>
              {contents.length > 0 && (
                <span className="ml-auto shrink-0 pl-1 text-[11px] tabular-nums text-muted/70">{contents.length}</span>
              )}
            </Link>

            {/* Sits on top of the link so the twisty doesn't navigate. */}
            <button
              type="button"
              onClick={onToggle}
              aria-label={`${expanded ? "Collapse" : "Expand"} ${folder.name}`}
              aria-expanded={expanded}
              className="absolute top-1/2 left-1 -translate-y-1/2 rounded p-0.5 text-muted hover:bg-stone-200/70 hover:text-ink"
            >
              <ChevronRight className={`size-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>

            <div ref={menuRef} className="absolute top-1/2 right-1 -translate-y-1/2">
              <button
                type="button"
                aria-label={`Actions for ${folder.name}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className={`rounded-md bg-inherit p-1 text-muted hover:bg-stone-200/70 hover:text-ink ${
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
          </div>
        )}
      </DropTarget>

      {expanded && (
        <ul className="space-y-0.5">
          {contents.length === 0 ? (
            <li className="py-1 pl-9 text-[13px] text-muted/70">Empty</li>
          ) : (
            contents.map((flipbook) => (
              <SidebarFile key={flipbook.id} flipbook={flipbook} nested onNavigate={onNavigate} />
            ))
          )}
        </ul>
      )}
    </li>
  );
}

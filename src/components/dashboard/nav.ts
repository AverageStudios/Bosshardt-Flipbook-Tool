/** Dashboard route helpers, shared by the sidebar, cards and toolbars. */
export const ALL_HREF = "/dashboard";
export const RECENT_HREF = "/dashboard/recent";
export const folderHref = (id: string) => `/dashboard/folder/${id}`;

/** "New Flipbook" keeps the folder the user is currently browsing. */
export const newFlipbookHref = (folderId?: string | null) =>
  folderId ? `/new?folder=${folderId}` : "/new";

/** Drag payload: a flipbook id being dropped onto a sidebar folder. */
export const FLIPBOOK_DRAG_TYPE = "application/x-bosshardt-flipbook";

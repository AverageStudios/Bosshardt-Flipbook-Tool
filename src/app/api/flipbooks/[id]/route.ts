import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api";
import { deleteFlipbook, isUuid, moveFlipbook, renameFlipbook } from "@/lib/flipbooks";
import { cleanTitle } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

/** Renames a flipbook (`title`) or moves it between folders (`folderId`). */
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return jsonError("Flipbook not found.", 404);

  const body = await request.json().catch(() => null);

  // A move sends `folderId`: a folder's uuid, or null for "No Folder".
  if (body && "folderId" in body) {
    const folderId = body.folderId;
    if (folderId !== null && (typeof folderId !== "string" || !isUuid(folderId))) {
      return jsonError("Folder not found.", 400);
    }
    try {
      const flipbook = await moveFlipbook(id, folderId);
      if (!flipbook) return jsonError("This flipbook no longer exists.", 404);
      return NextResponse.json({ flipbook });
    } catch (error) {
      // The folder was deleted between opening the menu and choosing it.
      if (error instanceof Error && error.message.includes("flipbooks_folder_id_fkey")) {
        return jsonError("That folder no longer exists.", 404);
      }
      return handleApiError(error, "Could not move the flipbook.");
    }
  }

  const title = cleanTitle(body?.title);
  if (!title) return jsonError("Please enter a title (up to 200 characters).", 400);

  try {
    const flipbook = await renameFlipbook(id, title);
    if (!flipbook) return jsonError("This flipbook no longer exists.", 404);
    return NextResponse.json({ flipbook });
  } catch (error) {
    return handleApiError(error, "Could not rename the flipbook.");
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return jsonError("Flipbook not found.", 404);

  try {
    await deleteFlipbook(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, "Could not delete the flipbook.");
  }
}

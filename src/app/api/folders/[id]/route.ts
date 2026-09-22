import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api";
import { isUuid } from "@/lib/flipbooks";
import { deleteFolder, renameFolder } from "@/lib/folders";
import { cleanFolderName } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return jsonError("Folder not found.", 404);

  const body = await request.json().catch(() => null);
  const name = cleanFolderName(body?.name);
  if (!name) return jsonError("Please enter a folder name (up to 100 characters).", 400);

  try {
    const folder = await renameFolder(id, name);
    if (!folder) return jsonError("This folder no longer exists.", 404);
    return NextResponse.json({ folder });
  } catch (error) {
    return handleApiError(error, "Could not rename the folder.");
  }
}

/** Removes the folder only — its flipbooks become unfiled (ON DELETE SET NULL). */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return jsonError("Folder not found.", 404);

  try {
    await deleteFolder(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, "Could not delete the folder.");
  }
}

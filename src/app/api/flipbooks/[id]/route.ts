import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api";
import { deleteFlipbook, isUuid, renameFlipbook } from "@/lib/flipbooks";
import { cleanTitle } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return jsonError("Flipbook not found.", 404);

  const body = await request.json().catch(() => null);
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

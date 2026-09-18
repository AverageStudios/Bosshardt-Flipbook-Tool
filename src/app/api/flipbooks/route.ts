import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api";
import { createFlipbook, isUuid } from "@/lib/flipbooks";
import { cleanTitle } from "@/lib/validation";

/** Step 2 of creating a flipbook: save the record after the files are uploaded. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const title = cleanTitle(body?.title);
  const pageCount = Number(body?.pageCount);

  if (!isUuid(id)) return jsonError("Invalid upload reference.", 400);
  if (!title) return jsonError("Please enter a title (up to 200 characters).", 400);
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > 5000) {
    return jsonError("Invalid page count.", 400);
  }

  try {
    const flipbook = await createFlipbook({ id, title, pageCount });
    return NextResponse.json({ flipbook }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Could not save the flipbook. Please try again.");
  }
}

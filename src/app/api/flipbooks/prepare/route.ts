import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api";
import { MAX_PDF_BYTES } from "@/lib/config";
import { prepareUpload } from "@/lib/flipbooks";

/** Step 1 of creating a flipbook: get signed upload URLs for the PDF and thumbnail. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const size = Number(body?.fileSize);
  if (!Number.isFinite(size) || size <= 0) return jsonError("Missing file size.", 400);
  if (size > MAX_PDF_BYTES) return jsonError("This PDF is larger than 100 MB.", 413);

  try {
    return NextResponse.json(await prepareUpload());
  } catch (error) {
    return handleApiError(error, "Could not start the upload. Please try again.");
  }
}

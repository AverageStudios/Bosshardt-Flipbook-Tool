import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api";
import { createFolder, listFolders } from "@/lib/folders";
import { cleanFolderName } from "@/lib/validation";

export async function GET() {
  try {
    return NextResponse.json({ folders: await listFolders() });
  } catch (error) {
    return handleApiError(error, "Could not load your folders.");
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = cleanFolderName(body?.name);
  if (!name) return jsonError("Please enter a folder name (up to 100 characters).", 400);

  try {
    const folder = await createFolder(name);
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Could not create the folder.");
  }
}

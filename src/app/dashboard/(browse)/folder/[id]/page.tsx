import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SetupNotice } from "@/components/SetupNotice";
import { isUuid } from "@/lib/flipbooks";
import { getFolder } from "@/lib/folders";
import { missingServerEnv } from "@/lib/supabase/server";
import { BrowsePage } from "../../BrowsePage";

type Props = { params: Promise<{ id: string }> };

const loadFolder = cache(async (id: string) =>
  isUuid(id) && missingServerEnv().length === 0 ? getFolder(id) : null,
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const folder = await loadFolder(id).catch(() => null);
  return { title: folder?.name ?? "Folder not found" };
}

export default async function FolderPage({ params }: Props) {
  const { id } = await params;

  const missing = missingServerEnv();
  if (missing.length > 0) return <SetupNotice missing={missing} />;

  const folder = await loadFolder(id);
  if (!folder) notFound();
  return <BrowsePage view={{ kind: "folder", folder }} />;
}

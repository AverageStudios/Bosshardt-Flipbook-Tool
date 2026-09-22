import type { Metadata } from "next";
import { BrowsePage } from "../BrowsePage";

export const metadata: Metadata = { title: "Recent" };

/** The newest flipbooks, by created_at. */
export default function RecentFlipbooksPage() {
  return <BrowsePage view={{ kind: "recent" }} limit={12} />;
}

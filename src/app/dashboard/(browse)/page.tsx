import type { Metadata } from "next";
import { BrowsePage } from "./BrowsePage";

export const metadata: Metadata = { title: "All Flipbooks" };

export default function AllFlipbooksPage() {
  return <BrowsePage view={{ kind: "all" }} />;
}

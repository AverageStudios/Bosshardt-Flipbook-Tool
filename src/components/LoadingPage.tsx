import { brand } from "@/lib/config";

/** Full-screen loading state. `tone="dark"` matches the flipbook viewer. */
export function LoadingPage({
  label = `Loading ${brand.name}…`,
  tone = "light",
}: {
  label?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      role="status"
      className={`flex min-h-dvh flex-col items-center justify-center gap-4 ${dark ? "bg-viewer text-white/60" : "bg-canvas text-muted"}`}
    >
      <span
        className={`size-8 animate-spin rounded-full border-2 ${dark ? "border-white/15 border-t-white/70" : "border-line border-t-brand"}`}
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

"use client";

import { AlertCircle, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_PDF_MB, MAX_TITLE_LENGTH } from "@/lib/config";
import { formatBytes } from "@/lib/format";
import { inspectPdf, validatePdfFile } from "@/lib/pdf/inspect";
import { titleFromFileName } from "@/lib/slug";
import { missingPublicEnv } from "@/lib/supabase/public";
import { createFlipbookFromPdf } from "@/lib/upload";
import { SetupNotice } from "./SetupNotice";
import { buttonClass } from "./ui/button";

type Stage = "idle" | "inspecting" | "ready" | "uploading" | "done";

interface Selected {
  file: File;
  pageCount: number;
  cover: Blob;
  previewUrl: string;
}

export function PdfUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Free the preview image when it's replaced or the page unmounts.
  useEffect(() => {
    const url = selected?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [selected?.previewUrl]);

  // Warn before leaving mid-upload.
  useEffect(() => {
    if (stage !== "uploading") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [stage]);

  async function handleFile(file: File | undefined) {
    if (!file || stage === "uploading" || stage === "inspecting") return;
    setError(null);
    const invalid = validatePdfFile(file);
    if (invalid) return setError(invalid);

    setSelected(null);
    setPendingFile(file);
    setStage("inspecting");
    try {
      const { pageCount, cover } = await inspectPdf(file);
      setSelected({ file, pageCount, cover, previewUrl: URL.createObjectURL(cover) });
      setTitle(titleFromFileName(file.name));
      setStage("ready");
    } catch (e) {
      setError((e as Error).message || "This PDF could not be read.");
      setStage("idle");
    } finally {
      setPendingFile(null);
    }
  }

  function reset() {
    setSelected(null);
    setTitle("");
    setError(null);
    setProgress(0);
    setStage("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) return setError("Please enter a title for your flipbook.");

    setError(null);
    setProgress(0);
    setStage("uploading");
    try {
      const flipbook = await createFlipbookFromPdf({
        file: selected.file,
        cover: selected.cover,
        title: cleanTitle,
        pageCount: selected.pageCount,
        onProgress: setProgress,
      });
      setStage("done");
      // Land on the preview + share page rather than straight on the public link.
      router.push(`/dashboard/${flipbook.slug}?created=1`);
    } catch (e) {
      setError((e as Error).message || "The upload failed. Please try again.");
      setStage("ready");
    }
  }

  const busy = stage === "uploading" || stage === "done";
  const shownFile = selected?.file ?? pendingFile;

  // Browser-side check: only the public variables, which this bundle was built with.
  const missingPublic = missingPublicEnv();
  if (missingPublic.length > 0) return <SetupNotice missing={missingPublic} />;

  return (
    <div className="space-y-6">
      {!selected && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload your PDF"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors sm:py-24 ${
            dragging ? "border-brand bg-stone-100" : "border-line bg-surface hover:border-stone-300 hover:bg-stone-50/60"
          }`}
        >
          {stage === "inspecting" ? (
            <>
              <Loader2 className="mb-4 size-9 animate-spin text-muted" strokeWidth={1.5} />
              <p className="text-base font-medium text-ink">Reading your PDF…</p>
              {shownFile && (
                <p className="mt-1 text-sm text-muted">
                  {shownFile.name} · {formatBytes(shownFile.size)}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-stone-100 text-ink">
                <UploadCloud className="size-6" strokeWidth={1.5} />
              </div>
              <p className="text-lg font-semibold text-ink">Upload your PDF</p>
              <p className="mt-1.5 text-sm text-muted">Drag and drop a PDF here or click to browse</p>
              <p className="mt-4 text-xs text-muted">PDF only · up to {MAX_PDF_MB} MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selected && (
        <form onSubmit={handleCreate} className="grid gap-6 rounded-2xl border border-line bg-surface p-5 shadow-card sm:grid-cols-[200px_1fr] sm:p-6">
          <div className="flex items-start justify-center rounded-xl bg-stone-100 p-5 sm:p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img
              src={selected.previewUrl}
              alt="First page preview"
              className="max-h-64 w-auto rounded-[3px] shadow-[0_2px_12px_rgb(0_0_0/0.14)] sm:max-h-none sm:w-full"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-start gap-3 rounded-xl border border-line px-3.5 py-3">
              <FileText className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{selected.file.name}</p>
                <p className="text-[13px] text-muted">
                  {formatBytes(selected.file.size)} · {selected.pageCount} {selected.pageCount === 1 ? "page" : "pages"}
                </p>
              </div>
              {!busy && (
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Remove file"
                  className="rounded-md p-1 text-muted hover:bg-stone-100 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Flipbook Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                disabled={busy}
                required
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-60"
              />
            </label>

            {busy && (
              <div>
                <div className="mb-1.5 flex justify-between text-[13px] text-muted">
                  <span>{stage === "done" ? "Preparing preview…" : progress >= 0.97 ? "Finishing up…" : "Uploading…"}</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-200"
                    style={{ width: `${Math.max(2, progress * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {!busy && (
                <button type="button" onClick={reset} className={buttonClass("secondary", "lg")}>
                  Choose another file
                </button>
              )}
              <button type="submit" disabled={busy} className={buttonClass("primary", "lg")}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {busy ? "Creating…" : "Create Flipbook"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

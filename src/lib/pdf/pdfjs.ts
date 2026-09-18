import type { PDFDocumentProxy } from "pdfjs-dist";

type PdfJs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJs> | null = null;

/** Lazily loads PDF.js in the browser (never on the server). */
export function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    // The legacy build includes polyfills for older Safari / iOS versions.
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((mod) => {
      const pdfjs = mod as unknown as PdfJs;
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      return pdfjs;
    });
    pdfjsPromise.catch(() => (pdfjsPromise = null));
  }
  return pdfjsPromise;
}

export class PdfLoadError extends Error {
  constructor(
    message: string,
    public readonly kind: "invalid" | "password" | "network" | "unknown",
  ) {
    super(message);
    this.name = "PdfLoadError";
  }
}

function toFriendlyError(error: unknown): PdfLoadError {
  const name = (error as { name?: string })?.name ?? "";
  if (name === "PasswordException") {
    return new PdfLoadError("This PDF is password-protected. Please upload an unlocked version.", "password");
  }
  if (name === "InvalidPDFException" || name === "FormatError") {
    return new PdfLoadError("This file doesn't appear to be a valid PDF, or it may be corrupted.", "invalid");
  }
  if (name === "MissingPDFException" || name === "ResponseException" || name === "UnexpectedResponseException") {
    return new PdfLoadError("The document could not be downloaded. Check your connection and try again.", "network");
  }
  if (error instanceof TypeError) {
    return new PdfLoadError("A network error occurred while loading the document.", "network");
  }
  return new PdfLoadError("The document could not be opened.", "unknown");
}

/** Opens a PDF from a URL or raw bytes. Throws a PdfLoadError with a friendly message. */
export async function openPdf(source: { url: string } | { data: ArrayBuffer }): Promise<PDFDocumentProxy> {
  try {
    const pdfjs = await loadPdfJs();
    const task = pdfjs.getDocument({
      ...("url" in source ? { url: source.url } : { data: new Uint8Array(source.data) }),
      cMapUrl: "/pdfjs/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/pdfjs/standard_fonts/",
      wasmUrl: "/pdfjs/wasm/",
      isEvalSupported: false,
    });
    return await task.promise;
  } catch (error) {
    throw toFriendlyError(error);
  }
}

/** Renders one page onto a fresh canvas at the given pixel width. */
export async function renderPageToCanvas(
  doc: PDFDocumentProxy,
  pageNumber: number,
  pixelWidth: number,
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  try {
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: pixelWidth / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas is not supported in this browser.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    return canvas;
  } finally {
    page.cleanup();
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the page image."))),
      type,
      quality,
    );
  });
}

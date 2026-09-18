import { MAX_PDF_BYTES } from "../config";
import { canvasToBlob, openPdf, PdfLoadError, renderPageToCanvas } from "./pdfjs";

export interface PdfInspection {
  pageCount: number;
  /** First page rendered as a JPEG — used for the upload preview and the thumbnail. */
  cover: Blob;
}

const THUMBNAIL_WIDTH = 720;

export function validatePdfFile(file: File): string | null {
  const looksLikePdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!looksLikePdf) return "Only PDF files are supported.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_PDF_BYTES) return "This PDF is larger than 100 MB. Please compress it and try again.";
  return null;
}

/** Opens the PDF locally to confirm it's valid, count pages and render the cover. */
export async function inspectPdf(file: File): Promise<PdfInspection> {
  const doc = await openPdf({ data: await file.arrayBuffer() });
  try {
    if (doc.numPages < 1) throw new PdfLoadError("This PDF has no pages.", "invalid");
    let canvas: HTMLCanvasElement;
    try {
      canvas = await renderPageToCanvas(doc, 1, THUMBNAIL_WIDTH);
    } catch {
      throw new PdfLoadError("The first page of this PDF could not be rendered. The file may be corrupted.", "invalid");
    }
    const cover = await canvasToBlob(canvas, "image/jpeg", 0.85);
    return { pageCount: doc.numPages, cover };
  } finally {
    void doc.destroy();
  }
}

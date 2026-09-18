import type { PDFDocumentProxy } from "pdfjs-dist";
import { canvasToBlob, renderPageToCanvas } from "./pdfjs";

export interface PageImage {
  url: string;
  pixelWidth: number;
}

type Listener = () => void;

const WIDTH_STEP = 256; // round render widths up so small resizes reuse the cache
const MAX_PIXEL_WIDTH = 3072;
const MAX_CACHED_PAGES = 60;

/**
 * Renders PDF pages to images on demand, one at a time, nearest-to-the-reader
 * first, and caches the results. UI components subscribe for updates and read
 * the best image available for each page.
 */
export class PageRenderer {
  private images = new Map<number, PageImage>();
  private errors = new Set<number>();
  private pending = new Map<number, number>(); // page -> requested pixel width
  private listeners = new Set<Listener>();
  private focus = 1;
  private running = false;
  private destroyed = false;
  private version = 0;

  private constructor(
    private readonly doc: PDFDocumentProxy,
    /** width / height of the first page; used to size the book. */
    readonly aspect: number,
  ) {}

  static async create(doc: PDFDocumentProxy): Promise<PageRenderer> {
    const first = await doc.getPage(1);
    const { width, height } = first.getViewport({ scale: 1 });
    return new PageRenderer(doc, width / height);
  }

  get pageCount() {
    return this.doc.numPages;
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Changes whenever any page image changes — for useSyncExternalStore. */
  getVersion = () => this.version;

  getImage(page: number): PageImage | undefined {
    return this.images.get(page);
  }

  hasError(page: number): boolean {
    return this.errors.has(page);
  }

  /** Tell the renderer where the reader is, so nearby pages render first. */
  setFocus(page: number) {
    this.focus = page;
  }

  /** Request pages at (at least) the given CSS width, accounting for screen density. */
  request(pages: number[], cssWidth: number) {
    const dpr = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 3);
    const target = Math.min(
      MAX_PIXEL_WIDTH,
      Math.max(WIDTH_STEP, Math.ceil((cssWidth * dpr) / WIDTH_STEP) * WIDTH_STEP),
    );
    for (const page of pages) {
      if (page < 1 || page > this.pageCount || this.errors.has(page)) continue;
      const have = this.images.get(page)?.pixelWidth ?? 0;
      if (have >= target) continue;
      this.pending.set(page, Math.max(target, this.pending.get(page) ?? 0));
    }
    void this.run();
  }

  retry(page: number) {
    this.errors.delete(page);
    this.emit();
  }

  destroy() {
    this.destroyed = true;
    this.pending.clear();
    this.listeners.clear();
    for (const image of this.images.values()) URL.revokeObjectURL(image.url);
    this.images.clear();
    void this.doc.destroy();
  }

  private async run() {
    if (this.running) return;
    this.running = true;
    try {
      while (!this.destroyed && this.pending.size > 0) {
        const page = this.nextPage();
        const width = this.pending.get(page)!;
        this.pending.delete(page);
        try {
          const canvas = await renderPageToCanvas(this.doc, page, width);
          const blob = await canvasToBlob(canvas);
          canvas.width = canvas.height = 0; // free canvas memory promptly (Safari)
          if (this.destroyed) return;
          const previous = this.images.get(page);
          if (previous) URL.revokeObjectURL(previous.url);
          this.images.set(page, { url: URL.createObjectURL(blob), pixelWidth: width });
          this.evict();
        } catch (error) {
          if (this.destroyed) return;
          console.error(`Failed to render page ${page}`, error);
          this.errors.add(page);
        }
        this.emit();
      }
    } finally {
      this.running = false;
    }
  }

  private nextPage(): number {
    let best = -1;
    let bestDistance = Infinity;
    for (const page of this.pending.keys()) {
      // Slightly prefer pages ahead of the reader.
      const distance = Math.abs(page - this.focus) + (page < this.focus ? 0.5 : 0);
      if (distance < bestDistance) {
        best = page;
        bestDistance = distance;
      }
    }
    return best;
  }

  private evict() {
    if (this.images.size <= MAX_CACHED_PAGES) return;
    const byDistance = [...this.images.keys()].sort(
      (a, b) => Math.abs(b - this.focus) - Math.abs(a - this.focus),
    );
    for (const page of byDistance.slice(0, this.images.size - MAX_CACHED_PAGES)) {
      URL.revokeObjectURL(this.images.get(page)!.url);
      this.images.delete(page);
    }
  }

  private emit() {
    this.version++;
    for (const listener of this.listeners) listener();
  }
}

// Minimal typings for the parts of page-flip (StPageFlip) this app uses.
declare module "page-flip" {
  export interface FlipSettings {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    showCover?: boolean;
    usePortrait?: boolean;
    startPage?: number;
    drawShadow?: boolean;
    maxShadowOpacity?: number;
    flippingTime?: number;
    showPageCorners?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    autoSize?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    disableFlipByClick?: boolean;
    startZIndex?: number;
  }

  export type FlipState = "user_fold" | "fold_corner" | "flipping" | "read";

  export interface FlipEvent<T = unknown> {
    data: T;
    object: PageFlip;
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: FlipSettings);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    on(event: "flip", callback: (e: FlipEvent<number>) => void): PageFlip;
    on(event: "changeState", callback: (e: FlipEvent<FlipState>) => void): PageFlip;
    on(event: "changeOrientation" | "init" | "update", callback: (e: FlipEvent) => void): PageFlip;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(pageIndex: number, corner?: "top" | "bottom"): void;
    turnToPage(pageIndex: number): void;
    getCurrentPageIndex(): number;
    getState(): FlipState;
    getPageCount(): number;
    destroy(): void;
  }
}

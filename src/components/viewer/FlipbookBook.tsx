"use client";

import type { PageFlip } from "page-flip";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PageRenderer } from "@/lib/pdf/page-renderer";
import { FlipbookPage } from "./FlipbookPage";

const FLIP_MS = 650;

/**
 * Horizontal offset that keeps what's visible centred. In a spread, the closed
 * cover sits on the right half and a lone back cover on the left half, so we
 * shift the book by half a page; open spreads need no shift.
 */
function bookOffset(index: number, spread: boolean, pageWidth: number, pageCount: number) {
  if (!spread) return 0;
  if (index <= 0) return -pageWidth / 2;
  if (pageCount % 2 === 0 && index >= pageCount - 1) return pageWidth / 2;
  return 0;
}

export interface BookController {
  next(): void;
  prev(): void;
  goTo(index: number): void;
}

interface FlipbookBookProps {
  renderer: PageRenderer;
  pageWidth: number;
  pageHeight: number;
  /** Two-page spread (desktop) vs one page at a time (phone / portrait tablet). */
  spread: boolean;
  /** Page index to open at when the book is (re)built, e.g. after a resize. */
  startIndex: number;
  onFlip: (index: number) => void;
  controllerRef: React.RefObject<BookController | null>;
}

/**
 * Wraps the page-flip engine (StPageFlip — the library behind react-pageflip).
 * page-flip moves page elements around the DOM itself, so we create those
 * elements imperatively and render each page into them with React portals.
 * That keeps React and page-flip from fighting over the same DOM nodes.
 */
export function FlipbookBook({
  renderer,
  pageWidth,
  pageHeight,
  spread,
  startIndex,
  onFlip,
  controllerRef,
}: FlipbookBookProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [pageEls, setPageEls] = useState<HTMLElement[]>([]);
  const onFlipRef = useRef(onFlip);
  const startIndexRef = useRef(startIndex);
  const [offset, setOffset] = useState(() => ({
    x: bookOffset(startIndex, spread, pageWidth, renderer.pageCount),
    animate: false,
  }));

  useEffect(() => {
    onFlipRef.current = onFlip;
    startIndexRef.current = startIndex;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let flip: PageFlip | null = null;
    let flipping = false;
    let queued = 0; // page turns requested while an animation was running
    let direction: 1 | -1 | 0 = 0; // direction of the turn about to animate
    const count = renderer.pageCount;
    const offsetFor = (index: number) => bookOffset(index, spread, pageWidth, count);

    const book = document.createElement("div");
    book.style.width = `${spread ? pageWidth * 2 : pageWidth}px`;
    book.style.height = `${pageHeight}px`;
    host.appendChild(book);

    const els = Array.from({ length: renderer.pageCount }, () => {
      const el = document.createElement("div");
      el.className = "flipbook-page";
      el.dataset.density = "soft";
      return el;
    });

    // Is there a page (or spread) in this direction? Asking page-flip to turn
    // past either end stalls it, so we never do.
    const canTurn = (direction: 1 | -1) => {
      const index = flip!.getCurrentPageIndex();
      if (direction < 0) return index > 0;
      const step = spread && index > 0 ? 2 : 1;
      return index + step <= renderer.pageCount - 1;
    };

    const turn = (dir: 1 | -1) => {
      if (!flip) return;
      if (flipping) {
        queued = Math.max(-3, Math.min(3, queued + dir));
        return;
      }
      if (!canTurn(dir)) {
        queued = 0;
        return;
      }
      direction = dir;
      if (dir > 0) flip.flipNext();
      else flip.flipPrev();
    };

    // page-flip handles swipes and mouse clicks, but not plain taps on touch
    // screens: tap the right half to go forward, the left half to go back.
    let tap: { x: number; y: number; time: number } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const t = event.touches[0];
      tap = event.touches.length === 1 ? { x: t.clientX, y: t.clientY, time: Date.now() } : null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const t = event.changedTouches[0];
      if (!tap || !t || !flip) return;
      const isTap = Math.hypot(t.clientX - tap.x, t.clientY - tap.y) < 10 && Date.now() - tap.time < 350;
      tap = null;
      if (!isTap) return;
      const rect = book.getBoundingClientRect();
      const direction = t.clientX - rect.left > rect.width / 2 ? 1 : -1;
      const before = flip.getCurrentPageIndex();
      // Let page-flip react first; only turn if it didn't.
      setTimeout(() => {
        if (flip && !disposed && flip.getState() === "read" && flip.getCurrentPageIndex() === before) {
          turn(direction);
        }
      }, 60);
    };
    // Clicks, drags and swipes are handled inside page-flip, so infer their
    // direction from the pointer: a swipe's movement, else which half was pressed.
    let press: { x: number } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      press = { x: event.clientX };
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!press) return;
      const dx = event.clientX - press.x;
      const rect = book.getBoundingClientRect();
      direction = Math.abs(dx) > 20 ? (dx < 0 ? 1 : -1) : event.clientX - rect.left > rect.width / 2 ? 1 : -1;
      press = null;
    };
    book.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    window.addEventListener("pointerup", onPointerUp, { capture: true, passive: true });

    book.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    book.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });

    import("page-flip").then(({ PageFlip }) => {
      if (disposed) return;
      flip = new PageFlip(book, {
        width: pageWidth,
        height: pageHeight,
        size: "fixed",
        showCover: true,
        usePortrait: !spread,
        startPage: Math.min(startIndexRef.current, renderer.pageCount - 1),
        drawShadow: true,
        maxShadowOpacity: 0.45,
        flippingTime: FLIP_MS,
        showPageCorners: true,
        mobileScrollSupport: false,
        swipeDistance: 24,
        autoSize: false,
      });

      flip.on("flip", (event) => onFlipRef.current(Number(event.data)));
      flip.on("changeState", (event) => {
        flipping = event.data === "flipping";
        const index = flip!.getCurrentPageIndex();
        if (flipping && direction !== 0) {
          // Slide towards where the turn will land, in step with the page curl.
          const target =
            direction > 0 ? Math.min(index === 0 ? 1 : index + 2, count - 1) : index <= 1 ? 0 : index - 2;
          setOffset({ x: offsetFor(target), animate: true });
        } else if (event.data === "read") {
          // Settled: match where we really are (also undoes a cancelled drag).
          direction = 0;
          setOffset({ x: offsetFor(index), animate: true });
        }
        if (!flipping && queued !== 0) {
          const direction = queued > 0 ? 1 : -1;
          queued -= direction;
          setTimeout(() => turn(direction), 0);
        }
      });

      flip.loadFromHTML(els);
      setPageEls(els);
      setOffset({ x: offsetFor(flip.getCurrentPageIndex()), animate: false });
      onFlipRef.current(flip.getCurrentPageIndex());

      controllerRef.current = {
        next: () => turn(1),
        prev: () => turn(-1),
        goTo: (index) => {
          if (!flip) return;
          queued = 0;
          // Jumps (Home/End) switch instantly; page-flip's animated flip() only handles nearby pages.
          flip.turnToPage(index);
          onFlipRef.current(flip.getCurrentPageIndex());
          setOffset({ x: offsetFor(flip.getCurrentPageIndex()), animate: true });
        },
      };
    });

    return () => {
      disposed = true;
      controllerRef.current = null;
      window.removeEventListener("pointerup", onPointerUp, { capture: true });
      try {
        flip?.destroy();
      } catch {
        // page-flip may already have torn down its DOM
      }
      book.remove();
      setPageEls([]);
    };
  }, [renderer, pageWidth, pageHeight, spread, controllerRef]);

  return (
    <div
      ref={hostRef}
      className={spread ? "flipbook--spread" : "flipbook--single"}
      style={{
        width: spread ? pageWidth * 2 : pageWidth,
        height: pageHeight,
        transform: `translateX(${offset.x}px)`,
        transition: offset.animate ? `transform ${FLIP_MS}ms cubic-bezier(0.45, 0, 0.25, 1)` : "none",
      }}
    >
      {pageEls.map((el, index) =>
        createPortal(<FlipbookPage renderer={renderer} pageNumber={index + 1} />, el, `page-${index}`),
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/** Tracks an element's content size; updates are debounced to avoid rebuild storms while resizing. */
export function useElementSize<T extends HTMLElement>(delay = 120) {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!element) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = element;
      setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, delay);
    });
    observer.observe(element);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [element, delay]);

  return [setElement, size] as const;
}

type FullscreenDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
type FullscreenEl = HTMLElement & { webkitRequestFullscreen?: () => void };

const subscribeFullscreen = (callback: () => void) => {
  document.addEventListener("fullscreenchange", callback);
  document.addEventListener("webkitfullscreenchange", callback);
  return () => {
    document.removeEventListener("fullscreenchange", callback);
    document.removeEventListener("webkitfullscreenchange", callback);
  };
};

export function useFullscreen() {
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(document.fullscreenElement ?? (document as FullscreenDoc).webkitFullscreenElement),
    () => false,
  );
  const supported = useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(document.fullscreenEnabled ?? (document.documentElement as FullscreenEl).webkitRequestFullscreen),
    () => false,
  );

  const toggle = useCallback(async () => {
    const doc = document as FullscreenDoc;
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      } else {
        const el = document.documentElement as FullscreenEl;
        await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.());
      }
    } catch {
      // Fullscreen can be refused (e.g. inside some iframes) — nothing to do.
    }
  }, []);

  return { isFullscreen, supported, toggle };
}

/** True after `timeout` ms without pointer/keyboard/touch activity. */
export function useIdle(timeout = 2500) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), timeout);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), timeout);
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [timeout]);
  return idle;
}

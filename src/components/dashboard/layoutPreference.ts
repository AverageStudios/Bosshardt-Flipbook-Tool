"use client";

import { useSyncExternalStore } from "react";

export type Layout = "grid" | "list";

const KEY = "bosshardt:dashboard-layout";
const listeners = new Set<() => void>();

/**
 * Grid/List preference, remembered in localStorage. It's read through
 * useSyncExternalStore so the server always renders the "grid" default and
 * React swaps in the saved value after hydration — no mismatch, no effect.
 */
let cached: Layout | null = null;

function read(): Layout {
  try {
    return localStorage.getItem(KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid"; // private mode / storage disabled
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    cached = null;
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Layout {
  // Cached so the snapshot stays referentially stable between renders.
  if (cached === null) cached = read();
  return cached;
}

const getServerSnapshot = (): Layout => "grid";

export function setLayout(next: Layout) {
  cached = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // preference simply isn't remembered
  }
  listeners.forEach((l) => l());
}

export function useLayout(): Layout {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

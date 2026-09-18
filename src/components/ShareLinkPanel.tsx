"use client";

import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { copyText } from "@/lib/clipboard";
import { buttonClass } from "./ui/button";

const noSubscribe = () => () => {};

/** The public link for a flipbook, with Copy Link and Open buttons. */
export function ShareLinkPanel({ slug }: { slug: string }) {
  // Built from the domain the app is served on (localhost, preview, production).
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
  const url = `${origin}/f/${slug}`;
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleCopy() {
    const ok = await copyText(url);
    setFailed(!ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <label htmlFor="share-link" className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink">
        <Link2 className="size-4 text-muted" />
        Share link
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="share-link"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 w-full min-w-0 rounded-lg sm:flex-1 border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button type="button" onClick={handleCopy} className={buttonClass("primary", "lg")}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy Link"}
          </button>
          <a href={`/f/${slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "lg")}>
            <ExternalLink className="size-4" />
            Open flipbook
          </a>
        </div>
      </div>
      {failed && (
        <p className="mt-2 text-xs text-amber-700">Couldn&apos;t copy automatically — select the link above and copy it.</p>
      )}
    </section>
  );
}

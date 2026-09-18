"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { Modal } from "../ui/Modal";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

/**
 * Share dialog. Each option is a self-contained section, so an "Embed" section
 * (e.g. an <iframe> snippet pointing at /f/[slug]) can be added alongside
 * the link section later without restructuring.
 */
export function ShareModal({ open, onClose, url, title }: ShareModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Share" tone="dark">
      <p className="-mt-2 mb-4 truncate text-sm text-white/50">{title}</p>
      <LinkSection url={url} />
      {/* Future: <EmbedSection url={url} /> */}
    </Modal>
  );
}

function LinkSection({ url }: { url: string }) {
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
    <section className="space-y-3">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Flipbook link"
        className="h-10 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-white/85 outline-none focus:border-white/25"
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-sm font-medium text-stone-900 transition-colors hover:bg-white/90"
        >
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy Link"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/15 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
        >
          <ExternalLink className="size-4" />
          Open in New Tab
        </a>
      </div>
      {failed && <p className="text-xs text-amber-300">Couldn&apos;t copy automatically — select the link above and copy it.</p>}
    </section>
  );
}

"use client";

import { ArrowLeft, Check, Code2, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { flipbookUrl } from "@/lib/format";
import { EmbedPanel } from "../EmbedPanel";
import { Modal } from "../ui/Modal";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
}

/** Share dialog: the public link, plus an "Embed on Website" view with the iframe code. */
export function ShareModal({ open, onClose, slug, title, thumbnailUrl }: ShareModalProps) {
  const [view, setView] = useState<"link" | "embed">("link");
  const embed = view === "embed";

  function close() {
    onClose();
    setView("link");
  }

  return (
    <Modal open={open} onClose={close} title={embed ? "Embed this flipbook" : "Share"} tone="dark" size={embed ? "lg" : "md"}>
      <p className="-mt-2 mb-4 truncate text-sm text-white/50">{title}</p>
      {open && !embed && <LinkSection url={flipbookUrl(slug)} onEmbed={() => setView("embed")} />}
      {open && embed && (
        <>
          <EmbedPanel slug={slug} title={title} thumbnailUrl={thumbnailUrl} tone="dark" />
          <button
            type="button"
            onClick={() => setView("link")}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Back to link
          </button>
        </>
      )}
    </Modal>
  );
}

function LinkSection({ url, onEmbed }: { url: string; onEmbed: () => void }) {
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
        <button
          type="button"
          onClick={onEmbed}
          className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/15 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
        >
          <Code2 className="size-4" />
          Embed on Website
        </button>
      </div>
      {failed && <p className="text-xs text-amber-300">Couldn&apos;t copy automatically — select the link above and copy it.</p>}
    </section>
  );
}

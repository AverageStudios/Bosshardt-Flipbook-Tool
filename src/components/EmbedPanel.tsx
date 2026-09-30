"use client";

import { Check, Code2, Eye } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { copyText } from "@/lib/clipboard";
import { DEFAULT_EMBED_SIZE, EMBED_SIZES, embedCode, embedUrl, type EmbedSize } from "@/lib/embed";
import { useElementSize } from "./viewer/hooks";

const noSubscribe = () => () => {};
/** The preview renders the embed at this width, scaled to fit, to show the desktop layout. */
const PREVIEW_WIDTH = 1000;

const tones = {
  dark: {
    muted: "text-white/50",
    code: "border-white/10 bg-black/25 text-white/85 focus:border-white/25",
    option: "border-white/10 text-white/85 hover:bg-white/5",
    optionOn: "border-white/45 bg-white/10 text-white",
    primary: "bg-white text-stone-900 hover:bg-white/90",
    secondary: "border border-white/15 text-white/90 hover:bg-white/10",
    frame: "border-white/10",
    warn: "text-amber-300",
  },
  light: {
    muted: "text-muted",
    code: "border-line bg-canvas text-ink focus:border-brand",
    option: "border-line text-ink hover:bg-stone-50",
    optionOn: "border-brand bg-brand/5 text-ink ring-1 ring-brand",
    primary: "bg-brand text-brand-fg hover:bg-brand-hover shadow-card",
    secondary: "border border-line bg-surface text-ink hover:bg-stone-50 shadow-card",
    frame: "border-line",
    warn: "text-amber-700",
  },
};

/** Size options, the iframe snippet, Copy Embed Code and an on-demand preview. */
export function EmbedPanel({ slug, title, tone }: { slug: string; title: string; tone: "light" | "dark" }) {
  // Built from the domain the app is served on (production, a preview, localhost), never hardcoded.
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
  const [size, setSize] = useState<EmbedSize>(DEFAULT_EMBED_SIZE);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const t = tones[tone];

  const src = origin ? embedUrl(origin, slug) : "";
  const code = embedCode({ src, title, size });

  async function handleCopy() {
    const ok = await copyText(code);
    setFailed(!ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <section className="space-y-4">
      <fieldset>
        <legend className={`mb-2 text-xs font-medium tracking-wide uppercase ${t.muted}`}>Size</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(EMBED_SIZES) as EmbedSize[]).map((key) => {
            const option = EMBED_SIZES[key];
            const on = key === size;
            return (
              <label
                key={key}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${
                  on ? t.optionOn : t.option
                }`}
              >
                <input
                  type="radio"
                  name="embed-size"
                  value={key}
                  checked={on}
                  onChange={() => setSize(key)}
                  className="sr-only"
                />
                <span className="block text-sm font-medium">{option.label}</span>
                <span className={`mt-0.5 block text-xs tabular-nums ${t.muted}`}>100% × {option.height}px</span>
                {option.note && <span className={`mt-0.5 block text-[11px] ${t.muted}`}>{option.note}</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      <textarea
        readOnly
        value={code}
        rows={10}
        spellCheck={false}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Embed code"
        className={`block w-full resize-none rounded-lg border px-3 py-2.5 font-mono text-xs leading-relaxed outline-none ${t.code}`}
      />

      <button
        type="button"
        autoFocus
        onClick={handleCopy}
        disabled={!src}
        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-medium transition-colors disabled:opacity-50 ${t.primary}`}
      >
        {copied ? <Check className="size-4" /> : <Code2 className="size-4" />}
        {copied ? "Copied!" : "Copy Embed Code"}
      </button>
      {failed && (
        <p className={`text-xs ${t.warn}`}>Couldn&apos;t copy automatically — select the code above and copy it.</p>
      )}

      <div>
        <p className={`mb-2 text-xs font-medium tracking-wide uppercase ${t.muted}`}>Preview</p>
        {showPreview && src ? (
          <EmbedPreview src={src} title={title} height={EMBED_SIZES[size].height} frameClass={t.frame} />
        ) : (
          // Loaded on request so opening this panel doesn't download and render the PDF a second time.
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${t.secondary}`}
          >
            <Eye className="size-4" />
            Show preview
          </button>
        )}
      </div>
    </section>
  );
}

/** The real embed in an iframe, laid out at desktop width and scaled down to fit. */
function EmbedPreview({
  src,
  title,
  height,
  frameClass,
}: {
  src: string;
  title: string;
  height: number;
  frameClass: string;
}) {
  const [setBox, box] = useElementSize<HTMLDivElement>(0);
  const scale = box ? Math.min(1, box.width / PREVIEW_WIDTH) : 0;

  return (
    <div ref={setBox} className={`overflow-hidden rounded-lg border ${frameClass}`} style={{ height: height * scale }}>
      {scale > 0 && (
        <iframe
          src={src}
          title={`${title} (preview)`}
          width={PREVIEW_WIDTH}
          height={height}
          allow="fullscreen"
          allowFullScreen
          className="block origin-top-left border-0"
          style={{ transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}

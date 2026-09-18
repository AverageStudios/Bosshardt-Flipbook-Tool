"use client";

import { ChevronLeft, ChevronRight, Download, Maximize, Minimize, Share2, ZoomIn, ZoomOut } from "lucide-react";

interface ViewerToolbarProps {
  pageLabel: string;
  pageCount: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  fullscreenSupported: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  downloadUrl: string | null;
  onShare: () => void;
  dimmed: boolean;
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
  className = "",
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-9 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30 ${className}`}
    >
      {children}
    </button>
  );
}

const Divider = ({ className = "" }: { className?: string }) => (
  <span className={`mx-1 h-5 w-px shrink-0 bg-white/12 ${className}`} aria-hidden />
);

export function ViewerToolbar(props: ViewerToolbarProps) {
  return (
    <div
      className={`pointer-events-auto flex items-center rounded-full border border-white/10 bg-viewer-panel/90 px-1.5 py-1 shadow-[0_8px_30px_rgb(0_0_0/0.35)] backdrop-blur-md transition-opacity duration-500 ${
        props.dimmed ? "opacity-35" : "opacity-100"
      }`}
    >
      <ToolButton label="Previous page" onClick={props.onPrev} disabled={!props.canPrev}>
        <ChevronLeft className="size-5" />
      </ToolButton>
      <span
        className="min-w-[4.75rem] px-1 text-center text-[13px] font-medium tabular-nums text-white/85"
        aria-live="polite"
      >
        {props.pageLabel} <span className="text-white/40">/ {props.pageCount}</span>
      </span>
      <ToolButton label="Next page" onClick={props.onNext} disabled={!props.canNext}>
        <ChevronRight className="size-5" />
      </ToolButton>

      <Divider className="hidden sm:block" />
      <ToolButton label="Zoom out" onClick={props.onZoomOut} disabled={!props.canZoomOut} className="hidden sm:grid">
        <ZoomOut className="size-[18px]" />
      </ToolButton>
      <ToolButton label="Zoom in" onClick={props.onZoomIn} disabled={!props.canZoomIn} className="hidden sm:grid">
        <ZoomIn className="size-[18px]" />
      </ToolButton>

      <Divider />
      {props.fullscreenSupported && (
        <ToolButton label={props.isFullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={props.onToggleFullscreen}>
          {props.isFullscreen ? <Minimize className="size-[18px]" /> : <Maximize className="size-[18px]" />}
        </ToolButton>
      )}
      {props.downloadUrl && (
        <a
          href={props.downloadUrl}
          aria-label="Download PDF"
          title="Download PDF"
          className="grid size-9 shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Download className="size-[18px]" />
        </a>
      )}
      <ToolButton label="Share" onClick={props.onShare}>
        <Share2 className="size-[18px]" />
      </ToolButton>
    </div>
  );
}

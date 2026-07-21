"use client";

import type { DesignSearchProgress } from "@/lib/types/design";

export function SearchProgressBar({
  progress,
  label = "Buscando",
}: {
  progress: DesignSearchProgress;
  label?: string;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-bg-elevated/60 p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-brand-cyan">
          {label}… {progress.percent}%
        </span>
        <span className="shrink-0 text-text-muted">
          {progress.scanned} revisadas · {progress.hits} hallazgo
          {progress.hits === 1 ? "" : "s"} · {progress.queueLeft} en cola
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-panel">
        <div
          className="h-full rounded-full bg-brand-cyan transition-[width] duration-300 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      {progress.currentPath ? (
        <p
          className="truncate text-[11px] text-text-muted"
          title={progress.currentPath}
        >
          {progress.currentPath}
        </p>
      ) : null}
    </div>
  );
}

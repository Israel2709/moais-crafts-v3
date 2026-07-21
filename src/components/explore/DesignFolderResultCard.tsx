"use client";

import { useState } from "react";
import { LuChevronLeft, LuChevronRight, LuExternalLink } from "react-icons/lu";
import type { DesignFolderHit } from "@/lib/types/design";

function mediaUrl(fileId: string) {
  return `/api/drive/media?fileId=${encodeURIComponent(fileId)}`;
}

export function DesignFolderResultCard({
  hit,
  selected,
  onAdd,
}: {
  hit: DesignFolderHit;
  selected: boolean;
  onAdd: () => void;
}) {
  const [index, setIndex] = useState(0);
  const previews = hit.previewFileIds;
  const current = previews[index] ?? null;

  function prev() {
    if (previews.length === 0) return;
    setIndex((i) => (i - 1 + previews.length) % previews.length);
  }

  function next() {
    if (previews.length === 0) return;
    setIndex((i) => (i + 1) % previews.length);
  }

  return (
    <article
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-bg-elevated ${
        selected ? "border-brand-cyan" : "border-border"
      }`}
    >
      <div className="relative aspect-[4/3] bg-bg-panel">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(current)}
            alt={hit.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            Sin imágenes
          </div>
        )}
        {previews.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-bg-panel/90 p-1.5 text-brand-cream"
              aria-label="Imagen anterior"
            >
              <LuChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-bg-panel/90 p-1.5 text-brand-cream"
              aria-label="Imagen siguiente"
            >
              <LuChevronRight className="h-4 w-4" />
            </button>
            <p className="absolute bottom-2 right-2 rounded bg-bg-panel/90 px-2 py-0.5 text-[10px] text-text-muted">
              {index + 1}/{previews.length}
            </p>
          </>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-brand-cream">
          {hit.name}
        </h3>
        <p className="line-clamp-2 break-words text-xs text-text-muted" title={hit.path}>
          {hit.path}
        </p>
        <p className="text-[11px] text-text-muted">
          {hit.designFiles.length} archivo
          {hit.designFiles.length === 1 ? "" : "s"} de diseño · {previews.length}{" "}
          muestra{previews.length === 1 ? "" : "s"}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={onAdd}
            className="rounded-lg bg-brand-red px-3 py-1.5 text-xs font-medium"
          >
            Agregar al catálogo
          </button>
          {hit.webViewLink ? (
            <a
              href={hit.webViewLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-brand-cyan hover:border-brand-cyan"
            >
              Ver en Drive
              <LuExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

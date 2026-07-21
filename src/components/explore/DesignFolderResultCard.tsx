"use client";

import { useEffect, useRef, useState } from "react";
import { LuExternalLink } from "react-icons/lu";
import { PreviewSlider } from "@/components/design/PreviewSlider";
import type { DesignFolderHit } from "@/lib/types/design";

function mediaUrl(fileId: string) {
  return `/api/drive/media?fileId=${encodeURIComponent(fileId)}`;
}

function useNearViewport(rootMargin = "240px") {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return { ref, visible };
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
  const { ref, visible } = useNearViewport();
  const previewUrls = hit.previewFileIds.map(mediaUrl);

  return (
    <article
      ref={ref}
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-bg-elevated ${
        selected ? "border-brand-cyan" : "border-border"
      }`}
    >
      {visible ? (
        <PreviewSlider
          urls={previewUrls}
          alt={hit.name}
          aspectClassName="aspect-[4/3]"
          imageClassName="h-full w-full object-contain"
          emptyLabel="Sin imágenes"
        />
      ) : (
        <div className="relative flex aspect-[4/3] items-center justify-center bg-bg-panel text-xs text-text-muted">
          …
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-brand-cream">
          {hit.name}
        </h3>
        <p
          className="line-clamp-2 break-words text-xs text-text-muted"
          title={hit.path}
        >
          {hit.path}
        </p>
        <p className="text-[11px] text-text-muted">
          {hit.designFiles.length} archivo
          {hit.designFiles.length === 1 ? "" : "s"} de diseño ·{" "}
          {previewUrls.length} muestra{previewUrls.length === 1 ? "" : "s"}
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

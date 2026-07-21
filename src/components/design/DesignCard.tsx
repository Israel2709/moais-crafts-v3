"use client";

import { resolveTermLabel } from "@/lib/designs/labels";
import type { Design } from "@/lib/types/design";

export function DesignCard({
  design,
  href,
  selected,
  onToggleSelect,
}: {
  design: Design;
  href: string;
  selected?: boolean;
  onToggleSelect?: (designId: string) => void;
}) {
  const preview = design.previewUrls[0];
  const selectable = Boolean(onToggleSelect);

  return (
    <div
      className={`group relative min-w-0 overflow-hidden rounded-2xl border bg-bg-panel transition ${
        selected
          ? "border-brand-cyan"
          : "border-border hover:border-brand-cyan"
      }`}
    >
      {selectable ? (
        <label className="absolute left-2 top-2 z-10 flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={Boolean(selected)}
            onChange={() => onToggleSelect?.(design.id)}
            className="h-4 w-4 accent-brand-cyan"
            aria-label={`Seleccionar ${design.title}`}
          />
        </label>
      ) : null}
      <a href={href} className="block min-w-0">
        <div className="aspect-square bg-bg-elevated">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={design.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              Sin preview
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-1 p-3">
          <p className="line-clamp-2 break-words text-sm font-medium text-brand-cream group-hover:text-brand-cyan">
            {design.title}
          </p>
          <p className="truncate text-xs text-text-muted">
            {resolveTermLabel(design.category)} ·{" "}
            {resolveTermLabel(design.season)} ·{" "}
            {resolveTermLabel(design.franchise)}
          </p>
        </div>
      </a>
    </div>
  );
}

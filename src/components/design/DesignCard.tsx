"use client";

import type { Design } from "@/lib/types/design";

export function DesignCard({
  design,
  href,
}: {
  design: Design;
  href: string;
}) {
  const preview = design.previewUrls[0];

  return (
    <a
      href={href}
      className="group overflow-hidden rounded-2xl border border-border bg-bg-panel transition hover:border-brand-cyan"
    >
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
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-brand-cream group-hover:text-brand-cyan">
          {design.title}
        </p>
        <p className="text-xs text-text-muted">
          {design.category} · {design.season} · {design.franchise}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-brand-orange">
          {design.status}
        </p>
      </div>
    </a>
  );
}

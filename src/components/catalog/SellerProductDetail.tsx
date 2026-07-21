"use client";

import { useState } from "react";
import Link from "next/link";
import { LuChevronLeft, LuClock3 } from "react-icons/lu";
import { FullscreenPreviewGallery } from "@/components/design/FullscreenPreviewGallery";
import { PreviewSlider } from "@/components/design/PreviewSlider";
import { resolveTermLabel } from "@/lib/designs/labels";
import type { Design } from "@/lib/types/design";

function formatMxn(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export function SellerProductDetail({
  design,
  backHref,
}: {
  design: Design;
  backHref: string;
}) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const mainPrice = design.suggestedPrice ?? design.factoryPrice;

  function openFullscreen(index: number) {
    setGalleryIndex(index);
    setFullscreenOpen(true);
  }

  return (
    <div className="relative min-h-dvh bg-bg pb-28">
      <div className="relative">
        <PreviewSlider
          urls={design.previewUrls}
          alt={design.title}
          aspectClassName="aspect-square w-full md:aspect-[4/3]"
          imageClassName="h-full w-full object-cover"
          showArrows={false}
          index={galleryIndex}
          onIndexChange={setGalleryIndex}
          onImageClick={openFullscreen}
        />
        <Link
          href={backHref}
          className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-brand-cream backdrop-blur-sm"
          aria-label="Volver"
        >
          <LuChevronLeft className="h-5 w-5" />
        </Link>
      </div>

      {design.fabricationTime ? (
        <div className="flex items-center gap-2 border-b border-border bg-brand-blue/25 px-4 py-2.5 text-sm text-brand-cyan">
          <LuClock3 className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Tiempo de fabricación:{" "}
            <span className="font-semibold uppercase tracking-wide">
              {design.fabricationTime}
            </span>
          </span>
        </div>
      ) : null}

      <div className="space-y-4 px-4 py-4 md:mx-auto md:max-w-3xl md:px-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl leading-snug text-brand-cream md:text-3xl">
            {design.title}
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            {resolveTermLabel(design.category)} ·{" "}
            {resolveTermLabel(design.season)} ·{" "}
            {resolveTermLabel(design.franchise)}
          </p>
          {design.description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-cream/90">
              {design.description}
            </p>
          ) : null}
        </div>

        {mainPrice != null ? (
          <div className="rounded-2xl border border-border bg-bg-panel p-4">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="font-[family-name:var(--font-display)] text-3xl font-semibold text-brand-orange">
                {formatMxn(mainPrice)}
              </span>
              <span className="rounded-md bg-brand-orange/20 px-2 py-0.5 text-xs font-semibold text-brand-orange">
                {design.suggestedPrice != null
                  ? "Precio sugerido"
                  : "Precio fábrica"}
              </span>
            </div>
            {design.factoryPrice != null && design.suggestedPrice != null ? (
              <p className="mt-2 text-xs text-text-muted">
                Costo fábrica {formatMxn(design.factoryPrice)}
              </p>
            ) : null}
          </div>
        ) : null}

        {design.previewUrls.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {design.previewUrls.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => openFullscreen(i)}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 ${
                  galleryIndex === i
                    ? "border-brand-cyan"
                    : "border-border opacity-70"
                }`}
                aria-label={`Ampliar vista ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}

        {design.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {design.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {design.notes ? (
          <div className="rounded-2xl border border-border bg-bg-elevated/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand-cyan">
              Notas
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-cream/90">
              {design.notes}
            </p>
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-elevated/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            {mainPrice != null ? (
              <p className="truncate font-[family-name:var(--font-display)] text-lg text-brand-orange">
                {formatMxn(mainPrice)}
              </p>
            ) : (
              <p className="text-sm text-text-muted">Sin precio</p>
            )}
          </div>
          <button
            type="button"
            disabled
            className="shrink-0 rounded-xl bg-brand-orange px-5 py-3 text-sm font-semibold text-bg opacity-80"
          >
            Pedido por WhatsApp pronto
          </button>
        </div>
      </div>

      {fullscreenOpen ? (
        <FullscreenPreviewGallery
          urls={design.previewUrls}
          alt={design.title}
          index={galleryIndex}
          onIndexChange={setGalleryIndex}
          onClose={() => setFullscreenOpen(false)}
        />
      ) : null}
    </div>
  );
}

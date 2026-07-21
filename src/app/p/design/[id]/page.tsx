"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { resolveTermLabel } from "@/lib/designs/labels";
import type { Design } from "@/lib/types/design";

export default function PublicDesignPage() {
  const params = useParams<{ id: string }>();
  const [design, setDesign] = useState<Design | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/designs/${params.id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No encontrado");
        setDesign(data.design);
      })
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  if (error) {
    return (
      <div className="min-h-dvh px-4 py-8">
        <p className="text-brand-red">{error}</p>
        <Link href="/p/catalog" className="mt-4 inline-block text-brand-cyan">
          Volver a catálogos
        </Link>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-dvh px-4 py-8 text-text-muted">Cargando…</div>
    );
  }

  return (
    <div className="min-h-dvh px-4 py-8 md:mx-auto md:max-w-3xl md:px-8">
      <Link href="/p/catalog" className="text-sm text-brand-cyan">
        ← Catálogos
      </Link>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-bg-panel">
        {design.previewUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={design.previewUrls[0]}
            alt={design.title}
            className="aspect-square w-full object-cover md:aspect-video"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center text-text-muted">
            Sin preview
          </div>
        )}
      </div>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-brand-cream">
        {design.title}
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        {resolveTermLabel(design.category)} · {resolveTermLabel(design.season)} ·{" "}
        {resolveTermLabel(design.franchise)}
      </p>
      {design.notes ? (
        <p className="mt-4 text-brand-cream/90">{design.notes}</p>
      ) : null}
      <p className="mt-8 text-sm text-text-muted">
        Pedidos por WhatsApp llegarán en una próxima versión.
      </p>
    </div>
  );
}

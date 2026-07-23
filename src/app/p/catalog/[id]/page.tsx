"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LuLoaderCircle } from "react-icons/lu";
import { DesignCard } from "@/components/design/DesignCard";
import { cacheDesigns } from "@/lib/designs/client-cache";
import type { Design } from "@/lib/types/design";
import type { SalesCatalog } from "@/lib/types/sales-catalog";

export default function PublicSalesCatalogPage() {
  const params = useParams<{ id: string }>();
  const [catalog, setCatalog] = useState<SalesCatalog | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/sales-catalogs/${params.id}?include=designs`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No encontrado");
        setCatalog(data.catalog);
        const nextDesigns: Design[] = data.designs ?? [];
        cacheDesigns(nextDesigns);
        setDesigns(nextDesigns);
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

  if (!catalog) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4">
        <LuLoaderCircle
          className="h-8 w-8 animate-spin text-brand-cyan"
          aria-hidden
        />
        <p className="text-sm text-text-muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 py-6 md:max-w-6xl md:px-10 md:py-8">
      <Link
        href="/p/catalog"
        className="inline-flex rounded-xl px-1 py-1 text-sm font-medium text-brand-cyan"
      >
        ← Catálogos
      </Link>
      <header className="mb-6 mt-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-brand-cyan">
          {catalog.name}
        </h1>
        {catalog.description ? (
          <p className="mt-2 max-w-xl text-sm text-text-muted">
            {catalog.description}
          </p>
        ) : null}
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {designs.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            href={`/p/design/${design.id}?from=${encodeURIComponent(`/p/catalog/${catalog.slug}`)}`}
          />
        ))}
      </div>
      {designs.length === 0 ? (
        <p className="text-sm text-text-muted">Este catálogo aún no tiene diseños.</p>
      ) : null}
    </div>
  );
}

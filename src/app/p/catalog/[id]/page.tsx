"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DesignCard } from "@/components/design/DesignCard";
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
        setDesigns(data.designs ?? []);
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
      <div className="min-h-dvh px-4 py-8 text-text-muted">Cargando…</div>
    );
  }

  return (
    <div className="min-h-dvh px-4 py-8 md:px-10">
      <Link href="/p/catalog" className="text-sm text-brand-cyan">
        ← Catálogos
      </Link>
      <header className="mb-8 mt-4">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand-cyan">
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
            href={`/p/design/${design.id}`}
          />
        ))}
      </div>
      {designs.length === 0 ? (
        <p className="text-sm text-text-muted">Este catálogo aún no tiene diseños.</p>
      ) : null}
    </div>
  );
}

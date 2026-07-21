"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SalesCatalog } from "@/lib/types/sales-catalog";

export default function PublicCatalogPage() {
  const [catalogs, setCatalogs] = useState<SalesCatalog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/sales-catalogs?status=published")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error");
        setCatalogs(data.catalogs ?? []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="min-h-dvh px-4 py-8 md:px-10">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-orange">
          Moai&apos;s Crafts
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-brand-cyan">
          Catálogos de venta
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-muted">
          Colecciones publicadas para el vendedor. Pedidos y WhatsApp llegan
          después.
        </p>
      </header>
      {error ? <p className="text-brand-red">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {catalogs.map((catalog) => (
          <Link
            key={catalog.id}
            href={`/p/catalog/${catalog.slug}`}
            className="rounded-2xl border border-border bg-bg-panel p-5 transition hover:border-brand-cyan"
          >
            <p className="font-[family-name:var(--font-display)] text-lg text-brand-cream">
              {catalog.name}
            </p>
            {catalog.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-text-muted">
                {catalog.description}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-brand-orange">
              {catalog.designIds.length} diseño
              {catalog.designIds.length === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>
      {!error && catalogs.length === 0 ? (
        <p className="text-sm text-text-muted">
          Aún no hay catálogos publicados.
        </p>
      ) : null}
    </div>
  );
}

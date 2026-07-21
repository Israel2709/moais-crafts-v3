"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuEye, LuEyeOff } from "react-icons/lu";
import type { SalesCatalog } from "@/lib/types/sales-catalog";

const HIDDEN_CATALOGS_KEY = "moais.seller.hiddenCatalogs";

function readHiddenIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(HIDDEN_CATALOGS_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeHiddenIds(ids: Set<string>) {
  window.localStorage.setItem(HIDDEN_CATALOGS_KEY, JSON.stringify([...ids]));
}

export default function PublicCatalogPage() {
  const [catalogs, setCatalogs] = useState<SalesCatalog[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHiddenIds(readHiddenIds());
    void fetch("/api/sales-catalogs?status=published")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error");
        setCatalogs(data.catalogs ?? []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  function hideCatalog(id: string) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeHiddenIds(next);
      return next;
    });
  }

  function showCatalog(id: string) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      writeHiddenIds(next);
      return next;
    });
  }

  const visibleCatalogs = catalogs.filter((c) => !hiddenIds.has(c.id));
  const hiddenCatalogs = catalogs.filter((c) => hiddenIds.has(c.id));

  return (
    <div className="min-h-dvh px-4 py-8 md:px-10">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-orange">
          Moai&apos;s Crafts
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-brand-cyan">
          Catálogos de venta
        </h1>
      </header>
      {error ? <p className="text-brand-red">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {visibleCatalogs.map((catalog) => (
          <div
            key={catalog.id}
            className="relative rounded-2xl border border-border bg-bg-panel transition hover:border-brand-cyan"
          >
            <Link href={`/p/catalog/${catalog.slug}`} className="block p-5 pr-12">
              <p className="font-[family-name:var(--font-display)] text-lg text-brand-cream">
                {catalog.name}
              </p>
              {catalog.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-text-muted">
                  {catalog.description}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-brand-orange">
                {catalog.designIds.length} producto
                {catalog.designIds.length === 1 ? "" : "s"}
              </p>
            </Link>
            <button
              type="button"
              title="Ocultar catálogo"
              aria-label={`Ocultar ${catalog.name}`}
              onClick={() => hideCatalog(catalog.id)}
              className="absolute right-3 top-3 rounded-lg border border-border p-2 text-text-muted transition hover:border-brand-orange hover:text-brand-orange"
            >
              <LuEyeOff className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
      {!error && catalogs.length === 0 ? (
        <p className="text-sm text-text-muted">
          Aún no hay catálogos publicados.
        </p>
      ) : null}
      {!error && catalogs.length > 0 && visibleCatalogs.length === 0 ? (
        <p className="text-sm text-text-muted">
          Todos los catálogos están ocultos.
        </p>
      ) : null}

      {hiddenCatalogs.length > 0 ? (
        <div className="mt-8 border-t border-border pt-6">
          <button
            type="button"
            onClick={() => setShowHidden((prev) => !prev)}
            className="flex items-center gap-2 text-sm text-text-muted transition hover:text-brand-cyan"
          >
            <LuEye className="h-4 w-4" aria-hidden />
            {showHidden ? "Ocultar" : "Ver"} catálogos ocultos (
            {hiddenCatalogs.length})
          </button>
          {showHidden ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {hiddenCatalogs.map((catalog) => (
                <div
                  key={catalog.id}
                  className="relative rounded-2xl border border-border/60 bg-bg-panel/60 p-5 pr-12 opacity-80"
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
                    {catalog.designIds.length} producto
                    {catalog.designIds.length === 1 ? "" : "s"}
                  </p>
                  <button
                    type="button"
                    title="Mostrar catálogo"
                    aria-label={`Mostrar ${catalog.name}`}
                    onClick={() => showCatalog(catalog.id)}
                    className="absolute right-3 top-3 rounded-lg border border-border p-2 text-text-muted transition hover:border-brand-cyan hover:text-brand-cyan"
                  >
                    <LuEye className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

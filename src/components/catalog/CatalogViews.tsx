"use client";

import { useEffect, useMemo, useState } from "react";
import { DesignCard } from "@/components/design/DesignCard";
import {
  DesignFilters,
  filterDesigns,
  type DesignFilterState,
} from "@/components/design/DesignFilters";
import type { Design, Taxonomies } from "@/lib/types/design";

const EMPTY_TAX: Taxonomies = {
  categories: [],
  seasons: [],
  franchises: [],
};

function useCatalogData() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomies>(EMPTY_TAX);
  const [filters, setFilters] = useState<DesignFilterState>({
    q: "",
    category: "",
    season: "",
    franchise: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [designsRes, taxRes] = await Promise.all([
          fetch("/api/designs"),
          fetch("/api/taxonomies"),
        ]);
        const designsData = await designsRes.json();
        const taxData = await taxRes.json();
        if (!designsRes.ok) throw new Error(designsData.error || "Error");
        setDesigns(designsData.designs ?? []);
        if (taxData.taxonomies) setTaxonomies(taxData.taxonomies);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = useMemo(
    () => filterDesigns(designs, filters),
    [designs, filters],
  );

  return {
    designs,
    filtered,
    taxonomies,
    filters,
    setFilters,
    loading,
    error,
    sheetOpen,
    setSheetOpen,
  };
}

export function CatalogMobile() {
  const state = useCatalogData();

  return (
    <div className="space-y-4 md:hidden">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Mi catálogo
        </h2>
        <button
          type="button"
          onClick={() => state.setSheetOpen(true)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-brand-cyan"
        >
          Filtros
        </button>
      </div>

      {state.loading ? <p className="text-sm text-text-muted">Cargando…</p> : null}
      {state.error ? <p className="text-sm text-brand-red">{state.error}</p> : null}

      <div className="grid grid-cols-2 gap-3">
        {state.filtered.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            href={`/catalog/${design.id}`}
          />
        ))}
      </div>

      {!state.loading && state.filtered.length === 0 ? (
        <p className="text-sm text-text-muted">
          No hay diseños. Agrega desde Explorar.
        </p>
      ) : null}

      {state.sheetOpen ? (
        <div className="fixed inset-0 z-30 bg-black/60 p-4">
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-border bg-bg-elevated p-4 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Filtros</p>
              <button
                type="button"
                onClick={() => state.setSheetOpen(false)}
                className="text-sm text-brand-orange"
              >
                Cerrar
              </button>
            </div>
            <DesignFilters
              layout="sheet"
              value={state.filters}
              taxonomies={state.taxonomies}
              onChange={state.setFilters}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CatalogDesktop() {
  const state = useCatalogData();

  return (
    <div className="hidden min-w-0 md:grid md:grid-cols-1 md:gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
      <DesignFilters
        layout="sidebar"
        value={state.filters}
        taxonomies={state.taxonomies}
        onChange={state.setFilters}
      />
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Mi catálogo
          </h2>
          <p className="text-sm text-text-muted">
            {state.filtered.length} de {state.designs.length}
          </p>
        </div>
        {state.loading ? <p className="text-sm text-text-muted">Cargando…</p> : null}
        {state.error ? <p className="text-sm text-brand-red">{state.error}</p> : null}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {state.filtered.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              href={`/catalog/${design.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

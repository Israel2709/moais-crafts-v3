"use client";

import { useEffect, useMemo, useState } from "react";
import { DesignCard } from "@/components/design/DesignCard";
import {
  DesignFilters,
  filterDesigns,
  type DesignFilterState,
} from "@/components/design/DesignFilters";
import { AddToSalesCatalogModal } from "@/components/catalog/AddToSalesCatalogModal";
import type { Design, Taxonomies } from "@/lib/types/design";

const EMPTY_TAX: Taxonomies = {
  categories: [],
  seasons: [],
  franchises: [],
  tags: [],
};

const PAGE_SIZE = 24;

function useCatalogData() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomies>(EMPTY_TAX);
  const [filters, setFilters] = useState<DesignFilterState>({
    q: "",
    category: "",
    season: "",
    franchise: "",
    tag: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const filtered = useMemo(
    () => filterDesigns(designs, filters),
    [designs, filters],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageSelection() {
    const allSelected = pageItems.every((d) => selectedIds.has(d.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const d of pageItems) next.delete(d.id);
      } else {
        for (const d of pageItems) next.add(d.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return {
    designs,
    filtered,
    pageItems,
    pageCount,
    page: safePage,
    setPage,
    taxonomies,
    filters,
    setFilters,
    loading,
    error,
    sheetOpen,
    setSheetOpen,
    selectedIds,
    toggleSelect,
    togglePageSelection,
    clearSelection,
    modalOpen,
    setModalOpen,
    toast,
    setToast,
  };
}

function CatalogToolbar({
  state,
}: {
  state: ReturnType<typeof useCatalogData>;
}) {
  const selectedCount = state.selectedIds.size;
  const pageAllSelected =
    state.pageItems.length > 0 &&
    state.pageItems.every((d) => state.selectedIds.has(d.id));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-text-muted">
        <input
          type="checkbox"
          className="accent-brand-cyan"
          checked={pageAllSelected}
          onChange={state.togglePageSelection}
          disabled={state.pageItems.length === 0}
        />
        Página
      </label>
      {selectedCount > 0 ? (
        <span className="text-sm text-brand-cyan">
          {selectedCount} seleccionado{selectedCount === 1 ? "" : "s"}
        </span>
      ) : null}
      <button
        type="button"
        disabled={selectedCount === 0}
        onClick={() => state.setModalOpen(true)}
        className="rounded-lg border border-brand-cyan/50 bg-brand-cyan/15 px-3 py-1.5 text-sm text-brand-cyan disabled:opacity-40"
      >
        Agregar a catálogo(s)
      </button>
      {selectedCount > 0 ? (
        <button
          type="button"
          onClick={state.clearSelection}
          className="text-sm text-text-muted hover:text-brand-orange"
        >
          Limpiar
        </button>
      ) : null}
    </div>
  );
}

function CatalogPagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="text-sm text-text-muted">
        {page} / {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}

function CatalogModals({ state }: { state: ReturnType<typeof useCatalogData> }) {
  return (
    <>
      {state.modalOpen ? (
        <AddToSalesCatalogModal
          designIds={Array.from(state.selectedIds)}
          onClose={() => state.setModalOpen(false)}
          onAdded={() => {
            state.setModalOpen(false);
            state.clearSelection();
            state.setToast("Diseños agregados a los catálogos seleccionados");
          }}
        />
      ) : null}
      {state.toast ? (
        <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-brand-cyan/40 bg-bg-elevated px-4 py-2 text-sm text-brand-cyan shadow-lg md:bottom-8">
          {state.toast}
          <button
            type="button"
            className="ml-3 text-text-muted"
            onClick={() => state.setToast(null)}
          >
            ✕
          </button>
        </div>
      ) : null}
    </>
  );
}

export function CatalogMobile() {
  const state = useCatalogData();

  return (
    <div className="space-y-4 md:hidden">
      <div className="flex items-center justify-between gap-2">
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

      <p className="text-sm text-text-muted">
        Colección personal · {state.filtered.length} de {state.designs.length}
      </p>

      <CatalogToolbar state={state} />

      {state.loading ? <p className="text-sm text-text-muted">Cargando…</p> : null}
      {state.error ? <p className="text-sm text-brand-red">{state.error}</p> : null}

      <div className="grid grid-cols-2 gap-3">
        {state.pageItems.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            href={`/catalog/${design.id}`}
            selected={state.selectedIds.has(design.id)}
            onToggleSelect={state.toggleSelect}
          />
        ))}
      </div>

      <CatalogPagination
        page={state.page}
        pageCount={state.pageCount}
        onChange={state.setPage}
      />

      {!state.loading && state.filtered.length === 0 ? (
        <p className="text-sm text-text-muted">
          No hay diseños. Agrega desde Explorar o Subir.
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

      <CatalogModals state={state} />
    </div>
  );
}

export function CatalogDesktop() {
  const state = useCatalogData();

  return (
    <div className="hidden min-w-0 space-y-4 md:block">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Mi catálogo
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Colección personal · {state.filtered.length} de{" "}
            {state.designs.length}
          </p>
        </div>
        <CatalogToolbar state={state} />
      </div>

      <DesignFilters
        layout="bar"
        value={state.filters}
        taxonomies={state.taxonomies}
        onChange={state.setFilters}
      />

      {state.loading ? <p className="text-sm text-text-muted">Cargando…</p> : null}
      {state.error ? <p className="text-sm text-brand-red">{state.error}</p> : null}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {state.pageItems.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            href={`/catalog/${design.id}`}
            selected={state.selectedIds.has(design.id)}
            onToggleSelect={state.toggleSelect}
          />
        ))}
      </div>

      <CatalogPagination
        page={state.page}
        pageCount={state.pageCount}
        onChange={state.setPage}
      />

      {!state.loading && state.filtered.length === 0 ? (
        <p className="text-sm text-text-muted">
          No hay diseños. Agrega desde Explorar o Subir.
        </p>
      ) : null}

      <CatalogModals state={state} />
    </div>
  );
}

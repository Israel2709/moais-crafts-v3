"use client";

import type { Taxonomies } from "@/lib/types/design";

export type DesignFilterState = {
  q: string;
  category: string;
  season: string;
  franchise: string;
};

export function DesignFilters({
  value,
  taxonomies,
  onChange,
  layout,
}: {
  value: DesignFilterState;
  taxonomies: Taxonomies;
  onChange: (next: DesignFilterState) => void;
  layout: "sheet" | "sidebar";
}) {
  const fieldClass =
    "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-brand-cream outline-none focus:border-brand-cyan";

  return (
    <div
      className={
        layout === "sidebar"
          ? "space-y-3 rounded-2xl border border-border bg-bg-panel p-4"
          : "space-y-3"
      }
    >
      <p className="text-sm font-medium text-brand-cyan">Filtros</p>
      <input
        className={fieldClass}
        placeholder="Buscar por nombre"
        value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
      />
      <select
        className={fieldClass}
        value={value.category}
        onChange={(e) => onChange({ ...value, category: e.target.value })}
      >
        <option value="">Todas las categorías</option>
        {taxonomies.categories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select
        className={fieldClass}
        value={value.season}
        onChange={(e) => onChange({ ...value, season: e.target.value })}
      >
        <option value="">Todas las temporadas</option>
        {taxonomies.seasons.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select
        className={fieldClass}
        value={value.franchise}
        onChange={(e) => onChange({ ...value, franchise: e.target.value })}
      >
        <option value="">Todas las franquicias</option>
        {taxonomies.franchises.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

export function filterDesigns<T extends {
  title: string;
  category: string;
  season: string;
  franchise: string;
}>(items: T[], filters: DesignFilterState): T[] {
  const q = filters.q.trim().toLowerCase();
  return items.filter((item) => {
    if (q && !item.title.toLowerCase().includes(q)) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.season && item.season !== filters.season) return false;
    if (filters.franchise && item.franchise !== filters.franchise) return false;
    return true;
  });
}

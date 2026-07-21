"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { resolveTermLabel } from "@/lib/designs/labels";
import type { Taxonomies, TaxonomyTerm } from "@/lib/types/design";

export type DesignFilterState = {
  q: string;
  category: string;
  season: string;
  franchise: string;
  tag: string;
};

type ComboboxOption = {
  value: string;
  label: string;
};

const fieldClass =
  "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-brand-cream outline-none focus:border-brand-cyan";

function FilterCombobox({
  label,
  value,
  options,
  placeholder,
  emptyHint,
  onChange,
}: {
  label: string;
  value: string;
  options: ComboboxOption[];
  placeholder: string;
  emptyHint: string;
  onChange: (next: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => {
    const selected = options.find((o) => o.value === value);
    return selected?.label ?? value;
  });

  useEffect(() => {
    const selected = options.find((o) => o.value === value);
    setDraft(selected?.label ?? value);
  }, [value, options]);

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return options
      .filter((o) => {
        if (!q) return true;
        return (
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [draft, options]);

  function setFilter(raw: string) {
    const next = raw.trim();
    const match = options.find(
      (o) =>
        o.value.toLowerCase() === next.toLowerCase() ||
        o.label.toLowerCase() === next.toLowerCase(),
    );
    onChange(match?.value ?? next);
    setDraft(match?.label ?? next);
  }

  function clear() {
    onChange("");
    setDraft("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative min-w-0 space-y-1">
      <span className="text-xs text-text-muted">{label}</span>
      <div className="relative">
        <input
          className={`${fieldClass} pr-8`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            onChange(next);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              if (!rootRef.current?.contains(document.activeElement)) {
                setOpen(false);
                setFilter(draft);
              }
            }, 120);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setFilter(draft);
              setOpen(false);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {value || draft ? (
          <button
            type="button"
            aria-label="Limpiar"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-brand-orange"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
          >
            ×
          </button>
        ) : null}
      </div>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-border bg-bg-panel py-1 shadow-lg"
        >
          <li>
            <button
              type="button"
              role="option"
              className="flex w-full px-3 py-1.5 text-left text-xs text-text-muted hover:bg-bg-elevated"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clear}
            >
              {emptyHint}
            </button>
          </li>
          {suggestions.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`flex w-full px-3 py-1.5 text-left text-xs hover:bg-bg-elevated ${
                  option.value === value
                    ? "text-brand-cyan"
                    : "text-brand-cream"
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setDraft(option.label);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
          {suggestions.length === 0 && draft.trim() ? (
            <li className="px-3 py-1.5 text-xs text-text-muted">
              Filtrar por “{draft.trim()}”
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function termsToOptions(terms: TaxonomyTerm[]): ComboboxOption[] {
  return terms.map((term) => ({ value: term.slug, label: term.label }));
}

function tagsToOptions(tags: string[]): ComboboxOption[] {
  return tags.map((tag) => ({ value: tag, label: tag }));
}

function matchesTermFilter(storedSlug: string, filter: string): boolean {
  const q = filter.trim().toLowerCase();
  if (!q) return true;
  if (storedSlug.toLowerCase() === q) return true;
  if (storedSlug.toLowerCase().includes(q)) return true;
  const label = resolveTermLabel(storedSlug).toLowerCase();
  return label.includes(q);
}

export function DesignFilters({
  value,
  taxonomies,
  onChange,
  layout,
}: {
  value: DesignFilterState;
  taxonomies: Taxonomies;
  onChange: (next: DesignFilterState) => void;
  layout: "sheet" | "sidebar" | "bar";
}) {
  const categoryOptions = useMemo(
    () => termsToOptions(taxonomies.categories),
    [taxonomies.categories],
  );
  const seasonOptions = useMemo(
    () => termsToOptions(taxonomies.seasons),
    [taxonomies.seasons],
  );
  const franchiseOptions = useMemo(
    () => termsToOptions(taxonomies.franchises),
    [taxonomies.franchises],
  );
  const tagOptions = useMemo(
    () => tagsToOptions(taxonomies.tags),
    [taxonomies.tags],
  );

  const filters = (
    <>
      <label className="min-w-[12rem] flex-1 space-y-1">
        <span className="text-xs text-text-muted">Buscar</span>
        <input
          className={fieldClass}
          placeholder="Nombre del diseño"
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
        />
      </label>
      <div className="min-w-[9rem] flex-1 sm:max-w-[12rem]">
        <FilterCombobox
          label="Categoría"
          value={value.category}
          options={categoryOptions}
          placeholder="Escribe o elige…"
          emptyHint="Todas las categorías"
          onChange={(category) => onChange({ ...value, category })}
        />
      </div>
      <div className="min-w-[9rem] flex-1 sm:max-w-[12rem]">
        <FilterCombobox
          label="Temporada"
          value={value.season}
          options={seasonOptions}
          placeholder="Escribe o elige…"
          emptyHint="Todas las temporadas"
          onChange={(season) => onChange({ ...value, season })}
        />
      </div>
      <div className="min-w-[9rem] flex-1 sm:max-w-[12rem]">
        <FilterCombobox
          label="Franquicia"
          value={value.franchise}
          options={franchiseOptions}
          placeholder="Escribe o elige…"
          emptyHint="Todas las franquicias"
          onChange={(franchise) => onChange({ ...value, franchise })}
        />
      </div>
      <div className="min-w-[9rem] flex-1 sm:max-w-[12rem]">
        <FilterCombobox
          label="Tag"
          value={value.tag}
          options={tagOptions}
          placeholder="Escribe o elige…"
          emptyHint="Todos los tags"
          onChange={(tag) => onChange({ ...value, tag })}
        />
      </div>
    </>
  );

  if (layout === "bar") {
    return (
      <div className="flex min-w-0 flex-wrap items-end gap-2 rounded-2xl border border-border bg-bg-panel p-3">
        {filters}
      </div>
    );
  }

  return (
    <div
      className={
        layout === "sidebar"
          ? "space-y-3 rounded-2xl border border-border bg-bg-panel p-4"
          : "space-y-3"
      }
    >
      {layout !== "sheet" ? (
        <p className="text-sm font-medium text-brand-cyan">Filtros</p>
      ) : null}
      <div className="space-y-3">{filters}</div>
    </div>
  );
}

export function filterDesigns<
  T extends {
    title: string;
    category: string;
    season: string;
    franchise: string;
    tags: string[];
  },
>(items: T[], filters: DesignFilterState): T[] {
  const q = filters.q.trim().toLowerCase();
  const tagQ = filters.tag.trim().toLowerCase();
  return items.filter((item) => {
    if (q && !item.title.toLowerCase().includes(q)) return false;
    if (filters.category && !matchesTermFilter(item.category, filters.category)) {
      return false;
    }
    if (filters.season && !matchesTermFilter(item.season, filters.season)) {
      return false;
    }
    if (
      filters.franchise &&
      !matchesTermFilter(item.franchise, filters.franchise)
    ) {
      return false;
    }
    if (tagQ && !item.tags.some((tag) => tag.toLowerCase().includes(tagQ))) {
      return false;
    }
    return true;
  });
}

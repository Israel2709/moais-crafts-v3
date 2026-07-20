"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { DriveItem, Taxonomies } from "@/lib/types/design";

type Crumb = { id: string; name: string };

const DEFAULT_TAXONOMIES: Taxonomies = {
  categories: ["juguetes", "decoracion", "llaveros", "organizacion", "otros"],
  seasons: ["todo-el-ano", "navidad", "dia-del-padre", "dia-de-la-madre", "halloween", "san-valentin"],
  franchises: ["sin-franquicia"],
};

function useExploreState(root: { id: string; name: string } | null) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "folder" | "file">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxonomies, setTaxonomies] = useState<Taxonomies>(DEFAULT_TAXONOMIES);
  const [selected, setSelected] = useState<DriveItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "otros",
    season: "todo-el-ano",
    franchise: "sin-franquicia",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const rootId = root?.id ?? null;
  const rootName = root?.name ?? "Drive";
  const currentFolderId = crumbs[crumbs.length - 1]?.id ?? rootId;

  useEffect(() => {
    if (!rootId) {
      setCrumbs([]);
      setItems([]);
      setSelected(null);
      setQuery("");
      setError(null);
      return;
    }
    setCrumbs([{ id: rootId, name: rootName }]);
    setSelected(null);
    setQuery("");
    setMessage(null);
  }, [rootId, rootName]);

  const loadFolder = useCallback(async (folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/drive/list?folderId=${encodeURIComponent(folderId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al listar Drive");
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentFolderId) return;
    void loadFolder(currentFolderId);
  }, [currentFolderId, loadFolder]);

  useEffect(() => {
    void fetch("/api/taxonomies")
      .then((r) => r.json())
      .then((d) => {
        if (d.taxonomies) setTaxonomies(d.taxonomies);
      })
      .catch(() => undefined);
  }, []);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    if (!currentFolderId) return;
    if (!query.trim()) {
      void loadFolder(currentFolderId);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/drive/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en búsqueda");
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function openFolder(item: DriveItem) {
    setQuery("");
    setCrumbs((prev) => [...prev, { id: item.id, name: item.name }]);
  }

  function jumpTo(index: number) {
    setQuery("");
    setCrumbs((prev) => prev.slice(0, index + 1));
  }

  function selectFile(item: DriveItem) {
    setSelected(item);
    setForm((f) => ({ ...f, title: item.name.replace(/\.[^.]+$/, "") }));
    setMessage(null);
  }

  async function addToCatalog(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/designs/from-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveFileId: selected.id,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo agregar");
      setMessage(`Agregado: ${data.design.title} (${data.design.id})`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const visible = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter === "folder") return item.isFolder;
      if (typeFilter === "file") return !item.isFolder;
      return true;
    });
  }, [items, typeFilter]);

  return {
    crumbs,
    visible,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    loading,
    error,
    taxonomies,
    selected,
    form,
    setForm,
    saving,
    message,
    onSearch,
    openFolder,
    jumpTo,
    selectFile,
    addToCatalog,
    reload: () => {
      if (currentFolderId) void loadFolder(currentFolderId);
    },
  };
}

export function ExploreMobile({
  root,
}: {
  root: { id: string; name: string };
}) {
  const state = useExploreState(root);

  return (
    <div className="space-y-4 md:hidden">
      <form onSubmit={state.onSearch} className="flex min-w-0 gap-2">
        <input
          value={state.query}
          onChange={(e) => state.setQuery(e.target.value)}
          placeholder="Buscar por nombre"
          className="min-w-0 flex-1 rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-brand-blue px-3 py-2 text-sm">
          Buscar
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto text-xs text-text-muted">
        {state.crumbs.map((crumb, index) => (
          <button
            key={`${crumb.id}-${index}`}
            type="button"
            onClick={() => state.jumpTo(index)}
            className="whitespace-nowrap text-brand-cyan"
          >
            {crumb.name}
            {index < state.crumbs.length - 1 ? " /" : ""}
          </button>
        ))}
      </div>

      <select
        value={state.typeFilter}
        onChange={(e) =>
          state.setTypeFilter(e.target.value as "all" | "folder" | "file")
        }
        className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm"
      >
        <option value="all">Todos</option>
        <option value="folder">Carpetas</option>
        <option value="file">Archivos</option>
      </select>

      {state.loading ? <p className="text-sm text-text-muted">Cargando…</p> : null}
      {state.error ? <p className="text-sm text-brand-red">{state.error}</p> : null}

      <ul className="divide-y divide-border rounded-2xl border border-border bg-bg-panel">
        {state.visible.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-3 text-left"
              onClick={() =>
                item.isFolder ? state.openFolder(item) : state.selectFile(item)
              }
            >
              <span className="flex h-8 w-8 items-center justify-center rounded bg-bg-elevated text-xs text-brand-cyan">
                {item.isFolder ? "DIR" : "FILE"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-brand-cream">
                  {item.name}
                </span>
                <span className="block truncate text-xs text-text-muted">
                  {item.mimeType}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {state.selected ? (
        <form
          onSubmit={state.addToCatalog}
          className="space-y-3 rounded-2xl border border-brand-orange/40 bg-bg-elevated p-4"
        >
          <p className="text-sm text-brand-orange">Agregar a mi catálogo</p>
          <p className="truncate text-xs text-text-muted">{state.selected.name}</p>
          <input
            className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm"
            value={state.form.title}
            onChange={(e) => state.setForm({ ...state.form, title: e.target.value })}
            placeholder="Título"
            required
          />
          <select
            className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm"
            value={state.form.category}
            onChange={(e) =>
              state.setForm({ ...state.form, category: e.target.value })
            }
          >
            {state.taxonomies.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm"
            value={state.form.season}
            onChange={(e) =>
              state.setForm({ ...state.form, season: e.target.value })
            }
          >
            {state.taxonomies.seasons.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm"
            value={state.form.franchise}
            onChange={(e) =>
              state.setForm({ ...state.form, franchise: e.target.value })
            }
          >
            {state.taxonomies.franchises.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={state.saving}
            className="w-full rounded-lg bg-brand-red py-2 text-sm font-medium disabled:opacity-60"
          >
            {state.saving ? "Subiendo…" : "Agregar"}
          </button>
          {state.message ? (
            <p className="text-xs text-brand-cyan">{state.message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

export function ExploreDesktop({
  root,
}: {
  root: { id: string; name: string };
}) {
  const state = useExploreState(root);

  return (
    <div className="hidden h-full min-h-0 min-w-0 flex-1 md:grid md:grid-cols-1 md:grid-rows-[minmax(0,1fr)] md:gap-4 xl:grid-cols-[minmax(0,240px)_minmax(0,1fr)_minmax(0,300px)]">
      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-bg-panel p-4">
        <p className="mb-3 shrink-0 text-sm text-brand-cyan">Carpetas</p>
        <div className="mb-3 flex shrink-0 flex-wrap gap-1 text-xs">
          {state.crumbs.map((crumb, index) => (
            <button
              key={`${crumb.id}-${index}`}
              type="button"
              onClick={() => state.jumpTo(index)}
              className="max-w-full truncate text-brand-cream hover:text-brand-cyan"
            >
              {crumb.name}
              {index < state.crumbs.length - 1 ? " /" : ""}
            </button>
          ))}
        </div>
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {state.visible
            .filter((i) => i.isFolder)
            .map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => state.openFolder(item)}
                  className="flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-bg-elevated"
                >
                  <span className="shrink-0 text-brand-cyan">DIR</span>
                  <span className="truncate">{item.name}</span>
                </button>
              </li>
            ))}
        </ul>
      </section>

      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-bg-panel p-4">
        <form
          onSubmit={state.onSearch}
          className="mb-4 flex shrink-0 min-w-0 flex-wrap gap-2"
        >
          <input
            value={state.query}
            onChange={(e) => state.setQuery(e.target.value)}
            placeholder="Buscar por nombre"
            className="min-w-0 flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
          />
          <select
            value={state.typeFilter}
            onChange={(e) =>
              state.setTypeFilter(e.target.value as "all" | "folder" | "file")
            }
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="folder">Carpetas</option>
            <option value="file">Archivos</option>
          </select>
          <button type="submit" className="rounded-lg bg-brand-blue px-4 py-2 text-sm">
            Buscar
          </button>
        </form>
        {state.loading ? (
          <p className="shrink-0 text-sm text-text-muted">Cargando…</p>
        ) : null}
        {state.error ? (
          <p className="shrink-0 text-sm text-brand-red">{state.error}</p>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {state.visible
              .filter((i) => !i.isFolder)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => state.selectFile(item)}
                  className={`min-w-0 rounded-xl border p-3 text-left ${
                    state.selected?.id === item.id
                      ? "border-brand-cyan bg-bg-elevated"
                      : "border-border bg-bg-elevated/50 hover:border-brand-orange"
                  }`}
                >
                  <p className="line-clamp-2 break-words text-sm text-brand-cream">
                    {item.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-text-muted">
                    {item.mimeType}
                  </p>
                </button>
              ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 flex-col overflow-y-auto rounded-2xl border border-border bg-bg-panel p-4">
        <p className="mb-3 shrink-0 text-sm text-brand-orange">Agregar a mi catálogo</p>
        {state.selected ? (
          <form onSubmit={state.addToCatalog} className="space-y-3">
            <p className="truncate text-xs text-text-muted">{state.selected.name}</p>
            <input
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
              value={state.form.title}
              onChange={(e) => state.setForm({ ...state.form, title: e.target.value })}
              required
            />
            <select
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
              value={state.form.category}
              onChange={(e) =>
                state.setForm({ ...state.form, category: e.target.value })
              }
            >
              {state.taxonomies.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
              value={state.form.season}
              onChange={(e) =>
                state.setForm({ ...state.form, season: e.target.value })
              }
            >
              {state.taxonomies.seasons.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
              value={state.form.franchise}
              onChange={(e) =>
                state.setForm({ ...state.form, franchise: e.target.value })
              }
            >
              {state.taxonomies.franchises.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={state.saving}
              className="w-full rounded-lg bg-brand-red py-2 text-sm font-medium"
            >
              {state.saving ? "Subiendo…" : "Agregar"}
            </button>
            {state.message ? (
              <p className="break-words text-xs text-brand-cyan">{state.message}</p>
            ) : null}
          </form>
        ) : (
          <p className="text-sm text-text-muted">
            Selecciona un archivo del panel central.
          </p>
        )}
      </section>
    </div>
  );
}

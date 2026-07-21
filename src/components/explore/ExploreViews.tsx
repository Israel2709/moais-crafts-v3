"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DesignForm } from "@/components/design/DesignForm";
import { SearchProgressBar } from "@/components/explore/SearchProgressBar";
import { SearchResultsGrid } from "@/components/explore/SearchResultsGrid";
import {
  EMPTY_DESIGN_FORM,
  type DesignFormValues,
} from "@/lib/designs/form";
import { consumeDesignSearchStream } from "@/lib/drive/search-stream";
import { DEFAULT_TAXONOMIES } from "@/lib/firebase/collections";
import type {
  DesignFolderHit,
  DesignKind,
  DesignSearchProgress,
  DriveIndexMeta,
  DriveItem,
  Taxonomies,
} from "@/lib/types/design";

type Crumb = { id: string; name: string };

function mediaUrl(fileId: string) {
  return `/api/drive/media?fileId=${encodeURIComponent(fileId)}`;
}

function formatIndexDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function CatalogPanelForm({
  state,
  hint,
}: {
  state: ReturnType<typeof useExploreState>;
  hint: string;
}) {
  return (
    <div className="space-y-3">
      <p className="break-words text-xs text-text-muted">{hint}</p>
      <DesignForm
        values={state.form}
        onChange={state.setForm}
        taxonomies={state.taxonomies}
        onTaxonomiesChange={state.setTaxonomies}
        previewFiles={state.previewFiles}
        onPreviewFilesChange={state.setPreviewFiles}
        existingPreviewUrls={state.existingPreviewUrls}
        requireLocalPreviews={false}
        showLocalPreviewInput={state.existingPreviewUrls.length === 0}
        submitting={state.saving}
        submitLabel="Agregar al catálogo"
        onSubmit={state.addToCatalog}
        message={state.formSuccess}
        error={state.formError}
        onClearFeedback={state.clearFormFeedback}
      />
    </div>
  );
}

function IndexStatusBar({
  meta,
  indexing,
  indexProgress,
  onRebuild,
}: {
  meta: DriveIndexMeta | null;
  indexing: boolean;
  indexProgress: DesignSearchProgress | null;
  onRebuild: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-text-muted">
        {meta ? (
          <span>
            Índice: {meta.packageCount} diseño
            {meta.packageCount === 1 ? "" : "s"} ·{" "}
            {formatIndexDate(meta.updatedAt)}
            {meta.stale ? (
              <span className="text-brand-orange"> · desactualizado</span>
            ) : null}
          </span>
        ) : (
          <span>Sin índice — actualízalo una vez para buscar al instante</span>
        )}
        <button
          type="button"
          onClick={onRebuild}
          disabled={indexing}
          className="rounded-lg border border-border px-2.5 py-1 text-xs text-brand-cyan hover:border-brand-cyan disabled:opacity-60"
        >
          {indexing ? "Indexando…" : "Actualizar índice"}
        </button>
      </div>
      {indexProgress ? (
        <SearchProgressBar progress={indexProgress} label="Indexando Drive" />
      ) : null}
    </div>
  );
}

function useExploreState(
  root: { id: string; name: string } | null,
  kind: DesignKind,
) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [searchHits, setSearchHits] = useState<DesignFolderHit[] | null>(null);
  const [indexMeta, setIndexMeta] = useState<DriveIndexMeta | null>(null);
  const [indexProgress, setIndexProgress] =
    useState<DesignSearchProgress | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "folder" | "file">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxonomies, setTaxonomies] = useState<Taxonomies>(DEFAULT_TAXONOMIES);
  const [selected, setSelected] = useState<DriveItem | null>(null);
  const [selectedHit, setSelectedHit] = useState<DesignFolderHit | null>(null);
  const [form, setForm] = useState<DesignFormValues>(EMPTY_DESIGN_FORM);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const folderSeq = useRef(0);
  const searchSeq = useRef(0);
  const indexSeq = useRef(0);
  const indexAbort = useRef<AbortController | null>(null);

  const rootId = root?.id ?? null;
  const rootName = root?.name ?? "Drive";
  const currentFolderId = crumbs[crumbs.length - 1]?.id ?? rootId;
  const isSearchMode = searchHits !== null;

  const loadIndexMeta = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/drive/index?kind=${encodeURIComponent(kind)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar índice");
      setIndexMeta(data.meta ?? null);
    } catch {
      setIndexMeta(null);
    }
  }, [kind]);

  useEffect(() => {
    if (!rootId) {
      indexAbort.current?.abort();
      setCrumbs([]);
      setItems([]);
      setSelected(null);
      setSelectedHit(null);
      setSearchHits(null);
      setQuery("");
      setError(null);
      return;
    }
    setCrumbs([{ id: rootId, name: rootName }]);
    setItems([]);
    setSelected(null);
    setSelectedHit(null);
    setSearchHits(null);
    setQuery("");
    setMessage(null);
    setError(null);
  }, [rootId, rootName, kind]);

  useEffect(() => {
    void loadIndexMeta();
  }, [loadIndexMeta]);

  const loadFolder = useCallback(async (folderId: string) => {
    const seq = ++folderSeq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/drive/list?folderId=${encodeURIComponent(folderId)}`,
      );
      const data = await res.json();
      if (seq !== folderSeq.current) return;
      if (!res.ok) throw new Error(data.error || "Error al listar Drive");
      setItems(data.items ?? []);
    } catch (err) {
      if (seq !== folderSeq.current) return;
      setError(err instanceof Error ? err.message : "Error");
      setItems([]);
    } finally {
      if (seq === folderSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentFolderId || isSearchMode) return;
    void loadFolder(currentFolderId);
  }, [currentFolderId, loadFolder, isSearchMode]);

  useEffect(() => {
    void fetch("/api/taxonomies")
      .then((r) => r.json())
      .then((d) => {
        if (d.taxonomies) setTaxonomies(d.taxonomies);
      })
      .catch(() => undefined);
  }, []);

  function clearSearch() {
    setSearchHits(null);
    setSelectedHit(null);
    setQuery("");
    setMessage(null);
    if (currentFolderId) void loadFolder(currentFolderId);
  }

  async function rebuildIndex() {
    const seq = ++indexSeq.current;
    indexAbort.current?.abort();
    const abort = new AbortController();
    indexAbort.current = abort;

    setIndexing(true);
    setError(null);
    setMessage(null);
    setIndexProgress({
      scanned: 0,
      queueLeft: 0,
      hits: 0,
      percent: 0,
      currentPath: "",
    });

    try {
      const res = await fetch(
        `/api/drive/index?kind=${encodeURIComponent(kind)}`,
        { method: "POST", signal: abort.signal },
      );
      if (seq !== indexSeq.current) return;

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "No se pudo actualizar el índice");
      }

      await consumeDesignSearchStream(res, {
        onProgress: (progress) => {
          if (seq !== indexSeq.current) return;
          setIndexProgress(progress);
        },
        onMessage: (msg) => {
          if (seq !== indexSeq.current) return;
          setMessage(msg);
        },
      });

      if (seq !== indexSeq.current) return;
      await loadIndexMeta();
      if (currentFolderId && !isSearchMode) {
        void loadFolder(currentFolderId);
      }
    } catch (err) {
      if (abort.signal.aborted || seq !== indexSeq.current) return;
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      if (seq === indexSeq.current) {
        setIndexing(false);
        setIndexProgress(null);
      }
    }
  }

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) {
      clearSearch();
      return;
    }
    const seq = ++searchSeq.current;
    setLoading(true);
    setError(null);
    setSelected(null);
    setSelectedHit(null);
    setMessage(null);
    setSearchHits([]);

    try {
      const res = await fetch(
        `/api/drive/search?q=${encodeURIComponent(query.trim())}&kind=${encodeURIComponent(kind)}`,
      );
      const data = (await res.json()) as {
        items?: DesignFolderHit[];
        message?: string;
        meta?: DriveIndexMeta | null;
        error?: string;
      };
      if (seq !== searchSeq.current) return;
      if (!res.ok) throw new Error(data.error || "Error en búsqueda");
      setSearchHits(data.items ?? []);
      if (data.meta) setIndexMeta(data.meta);
      if (data.message) setError(data.message);
    } catch (err) {
      if (seq !== searchSeq.current) return;
      setError(err instanceof Error ? err.message : "Error");
      setSearchHits([]);
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  }

  function openFolder(item: DriveItem) {
    setQuery("");
    setSearchHits(null);
    setSelectedHit(null);
    setCrumbs((prev) => [...prev, { id: item.id, name: item.name }]);
  }

  function jumpTo(index: number) {
    setQuery("");
    setSearchHits(null);
    setSelectedHit(null);
    setCrumbs((prev) => prev.slice(0, index + 1));
  }

  function selectFile(item: DriveItem) {
    setSelectedHit(null);
    setSelected(item);
    setPreviewFiles([]);
    setForm((f) => ({
      ...f,
      title: item.name.replace(/\.[^.]+$/, ""),
      driveLocation: item.webViewLink ?? item.name,
    }));
    setMessage(null);
    setFormSuccess(null);
    setFormError(null);
  }

  function selectHit(hit: DesignFolderHit) {
    setSelected(null);
    setSelectedHit(hit);
    setPreviewFiles([]);
    setForm((f) => ({
      ...f,
      title: hit.name,
      driveLocation: hit.webViewLink ?? hit.path,
    }));
    setMessage(null);
    setFormSuccess(null);
    setFormError(null);
  }

  async function addToCatalog(event: FormEvent) {
    event.preventDefault();
    if (!selected && !selectedHit) return;
    setSaving(true);
    setFormSuccess(null);
    setFormError(null);
    try {
      const body = selectedHit
        ? {
            driveFolderId: selectedHit.id,
            drivePath: selectedHit.path,
            title: form.title,
            category: form.category,
            season: form.season,
            tags: form.tags,
            factoryPrice: form.factoryPrice,
            suggestedPrice: form.suggestedPrice,
            fabricationTime: form.fabricationTime,
            driveLocation: form.driveLocation || selectedHit.path,
            description: form.description,
            notes: form.notes,
          }
        : {
            driveFileId: selected!.id,
            title: form.title,
            category: form.category,
            season: form.season,
            tags: form.tags,
            factoryPrice: form.factoryPrice,
            suggestedPrice: form.suggestedPrice,
            fabricationTime: form.fabricationTime,
            driveLocation: form.driveLocation,
            description: form.description,
            notes: form.notes,
          };
      const res = await fetch("/api/designs/from-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo agregar");
      setForm({
        ...EMPTY_DESIGN_FORM,
        category: form.category,
        season: form.season,
      });
      setPreviewFiles([]);
      setSelected(null);
      setSelectedHit(null);
      setFormSuccess(`Diseño creado: ${data.design.title} (${data.design.id})`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const existingPreviewUrls = useMemo(() => {
    if (selectedHit) {
      return selectedHit.previewFileIds.map(mediaUrl);
    }
    return [];
  }, [selectedHit]);

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
    searchHits,
    indexMeta,
    indexProgress,
    indexing,
    isSearchMode,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    loading,
    error,
    taxonomies,
    setTaxonomies,
    selected,
    selectedHit,
    form,
    setForm,
    previewFiles,
    setPreviewFiles,
    existingPreviewUrls,
    saving,
    message,
    formSuccess,
    formError,
    clearFormFeedback: () => {
      setFormSuccess(null);
      setFormError(null);
    },
    onSearch,
    rebuildIndex,
    openFolder,
    jumpTo,
    selectFile,
    selectHit,
    addToCatalog,
    clearSearch,
    reload: () => {
      if (currentFolderId) void loadFolder(currentFolderId);
    },
  };
}

export function ExploreMobile({
  state,
}: {
  state: ReturnType<typeof useExploreState>;
}) {
  return (
    <div className="space-y-4 md:hidden">
      <IndexStatusBar
        meta={state.indexMeta}
        indexing={state.indexing}
        indexProgress={state.indexProgress}
        onRebuild={() => void state.rebuildIndex()}
      />

      <form onSubmit={state.onSearch} className="flex min-w-0 gap-2">
        <input
          value={state.query}
          onChange={(e) => state.setQuery(e.target.value)}
          placeholder="Buscar diseño por nombre"
          className="min-w-0 flex-1 rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-brand-blue px-3 py-2 text-sm">
          Buscar
        </button>
      </form>

      {!state.isSearchMode ? (
        <>
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
        </>
      ) : (
        <p className="text-xs text-text-muted">
          Resultados desde el índice · carpetas con muestras e archivos de
          diseño
        </p>
      )}

      {state.loading ? <p className="text-sm text-text-muted">Cargando…</p> : null}
      {state.error ? <p className="text-sm text-brand-red">{state.error}</p> : null}
      {state.message ? (
        <p className="text-sm text-brand-cyan">{state.message}</p>
      ) : null}

      {state.isSearchMode ? (
        <div className="flex min-h-[50vh] flex-col">
          <SearchResultsGrid
            items={state.searchHits ?? []}
            selectedId={state.selectedHit?.id}
            onAdd={state.selectHit}
            layout="mobile"
            loading={state.loading}
          />
        </div>
      ) : (
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
      )}

      {state.selected || state.selectedHit ? (
        <div className="rounded-2xl border border-brand-orange/40 bg-bg-elevated p-4">
          <p className="mb-3 text-sm text-brand-orange">Agregar a mi catálogo</p>
          <CatalogPanelForm
            state={state}
            hint={state.selectedHit?.path ?? state.selected?.name ?? ""}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ExploreDesktop({
  state,
}: {
  state: ReturnType<typeof useExploreState>;
}) {
  if (state.isSearchMode) {
    return (
      <div className="hidden h-full min-h-0 min-w-0 flex-1 md:grid md:grid-cols-1 md:grid-rows-[minmax(0,1fr)] md:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-bg-panel p-4">
          <div className="mb-3 shrink-0">
            <IndexStatusBar
              meta={state.indexMeta}
              indexing={state.indexing}
              indexProgress={state.indexProgress}
              onRebuild={() => void state.rebuildIndex()}
            />
          </div>
          <form
            onSubmit={state.onSearch}
            className="mb-4 flex shrink-0 min-w-0 flex-wrap gap-2"
          >
            <input
              value={state.query}
              onChange={(e) => state.setQuery(e.target.value)}
              placeholder="Buscar diseño por nombre"
              className="min-w-0 flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => state.clearSearch()}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:text-brand-cream"
            >
              Limpiar
            </button>
          </form>
          <p className="mb-3 shrink-0 text-xs text-text-muted">
            Búsqueda sobre el índice local
            {state.searchHits
              ? ` · ${state.searchHits.length} resultado${state.searchHits.length === 1 ? "" : "s"}`
              : ""}
          </p>
          {state.loading ? (
            <p className="shrink-0 text-sm text-text-muted">Buscando…</p>
          ) : null}
          {state.error ? (
            <p className="shrink-0 text-sm text-brand-red">{state.error}</p>
          ) : null}
          {state.message ? (
            <p className="shrink-0 text-sm text-brand-cyan">{state.message}</p>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <SearchResultsGrid
              items={state.searchHits ?? []}
              selectedId={state.selectedHit?.id}
              onAdd={state.selectHit}
              layout="desktop"
              loading={state.loading}
            />
          </div>
        </section>

        <section className="flex min-h-0 min-w-0 flex-col overflow-y-auto rounded-2xl border border-border bg-bg-panel p-4">
          <p className="mb-3 shrink-0 text-sm text-brand-orange">
            Agregar a mi catálogo
          </p>
          {state.selectedHit ? (
            <CatalogPanelForm state={state} hint={state.selectedHit.path} />
          ) : (
            <p className="text-sm text-text-muted">
              Elige «Agregar al catálogo» en una card.
            </p>
          )}
        </section>
      </div>
    );
  }

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
        <div className="mb-3 shrink-0">
          <IndexStatusBar
            meta={state.indexMeta}
            indexing={state.indexing}
            indexProgress={state.indexProgress}
            onRebuild={() => void state.rebuildIndex()}
          />
        </div>
        <form
          onSubmit={state.onSearch}
          className="mb-4 flex shrink-0 min-w-0 flex-wrap gap-2"
        >
          <input
            value={state.query}
            onChange={(e) => state.setQuery(e.target.value)}
            placeholder="Buscar diseño por nombre"
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
        {state.message ? (
          <p className="shrink-0 text-sm text-brand-cyan">{state.message}</p>
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
          <CatalogPanelForm state={state} hint={state.selected.name} />
        ) : (
          <p className="text-sm text-text-muted">
            Selecciona un archivo del panel central.
          </p>
        )}
      </section>
    </div>
  );
}

export function ExplorePanel({
  root,
  kind,
}: {
  root: { id: string; name: string };
  kind: DesignKind;
}) {
  const state = useExploreState(root, kind);
  return (
    <>
      <ExploreMobile state={state} />
      <ExploreDesktop state={state} />
    </>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { LuChevronUp, LuFolders } from "react-icons/lu";
import { ExploreDesktop, ExploreMobile } from "@/components/explore/ExploreViews";
import { KIND_DESCRIPTIONS, KIND_LABELS } from "@/lib/drive/kind-labels";
import type { DesignKind, DriveLibrarySource } from "@/lib/types/design";

function sourcesPanelKey(kind: DesignKind) {
  return `moais-sources-collapsed-${kind}`;
}

export function KindDriveExplore({ kind }: { kind: DesignKind }) {
  const [sources, setSources] = useState<DriveLibrarySource[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [folderInput, setFolderInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [sourcesCollapsed, setSourcesCollapsed] = useState(true);

  const loadSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/drive/sources?kind=${kind}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar fuentes");
      const next = (data.sources ?? []) as DriveLibrarySource[];
      setSources(next);
      setActiveId((prev) => {
        if (prev && next.some((s) => s.id === prev)) return prev;
        return next[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setSources([]);
      setActiveId(null);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  useEffect(() => {
    const stored = window.localStorage.getItem(sourcesPanelKey(kind));
    setSourcesCollapsed(stored === null ? true : stored === "1");
  }, [kind]);

  function toggleSourcesCollapsed() {
    setSourcesCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(sourcesPanelKey(kind), next ? "1" : "0");
      if (next) setAdding(false);
      return next;
    });
  }

  const active = sources.find((s) => s.id === activeId) ?? null;
  const root = active
    ? { id: active.folderId, name: active.name }
    : null;

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/drive/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name, folderId: folderInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo agregar");
      setName("");
      setFolderInput("");
      setAdding(false);
      const created = data.source as DriveLibrarySource;
      setSources((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "es")),
      );
      setActiveId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function onRemove(sourceId: string) {
    if (!confirm("¿Quitar esta carpeta de la lista?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/drive/sources/${sourceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar");
      setSources((prev) => {
        const next = prev.filter((s) => s.id !== sourceId);
        setActiveId((current) =>
          current === sourceId ? (next[0]?.id ?? null) : current,
        );
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-brand-cream">
            {KIND_LABELS[kind]}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {KIND_DESCRIPTIONS[kind]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sourcesCollapsed ? (
            <button
              type="button"
              onClick={toggleSourcesCollapsed}
              title="Carpetas fuente"
              aria-label="Carpetas fuente"
              className="rounded-lg border border-border bg-bg-panel p-2 text-brand-cyan transition hover:border-brand-cyan hover:bg-bg-elevated"
            >
              <LuFolders className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {!sourcesCollapsed ? (
        <section className="shrink-0 rounded-2xl border border-border bg-bg-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-brand-cyan">Carpetas fuente</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdding((v) => !v)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-brand-cream hover:border-brand-cyan"
              >
                {adding ? "Cancelar" : "Agregar carpeta"}
              </button>
              <button
                type="button"
                onClick={toggleSourcesCollapsed}
                title="Colapsar carpetas fuente"
                aria-label="Colapsar carpetas fuente"
                className="rounded-lg border border-border p-1.5 text-text-muted transition hover:border-brand-cyan hover:text-brand-cyan"
              >
                <LuChevronUp className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          {adding ? (
            <form
              onSubmit={onAdd}
              className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre (ej. Comunidad laser)"
                className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
                required
              />
              <input
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="ID o URL de carpeta Drive"
                className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </form>
          ) : null}

          {loading ? (
            <p className="mt-3 text-sm text-text-muted">Cargando fuentes…</p>
          ) : null}

          {!loading && sources.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">
              Aún no hay carpetas. Agrega el ID (o URL) de tu carpeta compartida
              de Drive.
            </p>
          ) : null}

          {sources.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {sources.map((source) => {
                const selected = source.id === activeId;
                return (
                  <li key={source.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveId(source.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm transition ${
                        selected
                          ? "bg-brand-blue/50 text-brand-cream"
                          : "bg-bg-elevated text-text-muted hover:text-brand-cream"
                      }`}
                    >
                      {source.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRemove(source.id)}
                      className="rounded px-1.5 text-xs text-text-muted hover:text-brand-red"
                      aria-label={`Quitar ${source.name}`}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}

      {error ? <p className="shrink-0 text-sm text-brand-red">{error}</p> : null}

      {root ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ExploreMobile root={root} kind={kind} />
          <ExploreDesktop root={root} kind={kind} />
        </div>
      ) : !loading ? (
        <p className="text-sm text-text-muted">
          Selecciona o agrega una carpeta para empezar a explorar.
        </p>
      ) : null}
    </div>
  );
}

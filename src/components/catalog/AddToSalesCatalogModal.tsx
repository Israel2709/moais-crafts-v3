"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { SalesCatalog } from "@/lib/types/sales-catalog";

export function AddToSalesCatalogModal({
  designIds,
  onClose,
  onAdded,
}: {
  designIds: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [catalogs, setCatalogs] = useState<SalesCatalog[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        const res = await fetch(`/api/sales-catalogs?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cargar catálogos");
        setCatalogs(data.catalogs ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    const t = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(t);
  }, [query]);

  const selectedCount = selectedIds.size;

  function toggleCatalog(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createCatalog(event: FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/sales-catalogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          status: "published",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear");
      const catalog = data.catalog as SalesCatalog;
      setCatalogs((prev) => [catalog, ...prev]);
      setSelectedIds((prev) => new Set(prev).add(catalog.id));
      setNewName("");
      setCreating(false);
      setMessage(`Catálogo «${catalog.name}» creado`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    if (selectedCount === 0) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/sales-catalogs/add-designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogIds: Array.from(selectedIds),
          designIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo agregar");
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setSaving(false);
    }
  }

  const sorted = useMemo(
    () =>
      [...catalogs].sort((a, b) => {
        const aSel = selectedIds.has(a.id) ? 0 : 1;
        const bSel = selectedIds.has(b.id) ? 0 : 1;
        if (aSel !== bSel) return aSel - bSel;
        return a.name.localeCompare(b.name, "es");
      }),
    [catalogs, selectedIds],
  );

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-catalog-title"
        className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-2xl border border-border bg-bg-elevated shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <h3
              id="add-to-catalog-title"
              className="font-[family-name:var(--font-display)] text-lg text-brand-cream"
            >
              Agregar a catálogo(s)
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {designIds.length} diseño{designIds.length === 1 ? "" : "s"}{" "}
              seleccionado{designIds.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-brand-orange"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
          <input
            className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm outline-none focus:border-brand-cyan"
            placeholder="Buscar catálogo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {loading ? (
            <p className="text-sm text-text-muted">Cargando…</p>
          ) : null}
          {error ? <p className="text-sm text-brand-red">{error}</p> : null}
          {message ? <p className="text-sm text-brand-cyan">{message}</p> : null}

          <ul className="space-y-2">
            {sorted.map((catalog) => (
              <li key={catalog.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-bg-panel px-3 py-2.5 hover:border-brand-cyan/50">
                  <input
                    type="checkbox"
                    className="mt-1 accent-brand-cyan"
                    checked={selectedIds.has(catalog.id)}
                    onChange={() => toggleCatalog(catalog.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-brand-cream">
                      {catalog.name}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {catalog.designIds.length} diseño
                      {catalog.designIds.length === 1 ? "" : "s"} ·{" "}
                      {catalog.status === "published" ? "publicado" : "borrador"}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {!loading && sorted.length === 0 ? (
            <p className="text-sm text-text-muted">
              No hay catálogos. Crea uno nuevo.
            </p>
          ) : null}

          {creating ? (
            <form onSubmit={createCatalog} className="space-y-2 rounded-xl border border-dashed border-border p-3">
              <p className="text-sm text-brand-cyan">Nuevo catálogo de venta</p>
              <input
                className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm outline-none focus:border-brand-cyan"
                placeholder="Nombre del catálogo"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !newName.trim()}
                  className="rounded-lg bg-brand-cyan/20 px-3 py-1.5 text-sm text-brand-cyan disabled:opacity-50"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="text-sm text-brand-orange"
            >
              + Crear catálogo nuevo
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-2 text-sm text-text-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving || selectedCount === 0}
            className="rounded-lg border border-brand-cyan/50 bg-brand-cyan/15 px-3 py-2 text-sm text-brand-cyan disabled:opacity-50"
          >
            {saving
              ? "Agregando…"
              : `Agregar a ${selectedCount || "…"} catálogo${selectedCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

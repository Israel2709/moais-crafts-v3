"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { SalesCatalog } from "@/lib/types/sales-catalog";

export default function SalesCatalogsPage() {
  const [catalogs, setCatalogs] = useState<SalesCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sales-catalogs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setCatalogs(data.catalogs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/sales-catalogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), status: "published" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear");
      setName("");
      setCreating(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-brand-cream">
            Catálogos de venta
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Colecciones que verá el vendedor en su UI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/p/catalog"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:text-brand-cyan"
          >
            Vista vendedor
          </Link>
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="rounded-lg border border-brand-cyan/50 bg-brand-cyan/15 px-3 py-1.5 text-sm text-brand-cyan"
          >
            {creating ? "Cancelar" : "+ Nuevo catálogo"}
          </button>
        </div>
      </div>

      {creating ? (
        <form
          onSubmit={onCreate}
          className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-bg-panel p-4"
        >
          <label className="min-w-[14rem] flex-1 space-y-1">
            <span className="text-xs text-text-muted">Nombre</span>
            <input
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-brand-cyan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Halloween 2026"
              autoFocus
            />
          </label>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-lg border border-brand-cyan/50 bg-brand-cyan/15 px-3 py-2 text-sm text-brand-cyan disabled:opacity-50"
          >
            {saving ? "Creando…" : "Crear"}
          </button>
        </form>
      ) : null}

      {loading ? <p className="text-sm text-text-muted">Cargando…</p> : null}
      {error ? <p className="text-sm text-brand-red">{error}</p> : null}

      <ul className="space-y-2">
        {catalogs.map((catalog) => (
          <li key={catalog.id}>
            <Link
              href={`/sales-catalogs/${catalog.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-bg-panel px-4 py-3 transition hover:border-brand-cyan"
            >
              <span className="min-w-0">
                <span className="block truncate text-brand-cream">
                  {catalog.name}
                </span>
                <span className="block text-xs text-text-muted">
                  {catalog.designIds.length} diseño
                  {catalog.designIds.length === 1 ? "" : "s"} · /{catalog.slug}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                  catalog.status === "published"
                    ? "bg-brand-cyan/15 text-brand-cyan"
                    : "bg-bg-elevated text-text-muted"
                }`}
              >
                {catalog.status === "published" ? "publicado" : "borrador"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {!loading && catalogs.length === 0 ? (
        <p className="text-sm text-text-muted">
          Aún no hay catálogos. Crea uno o agrégalos desde Mi catálogo.
        </p>
      ) : null}
    </div>
  );
}

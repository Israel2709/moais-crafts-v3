"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DesignCard } from "@/components/design/DesignCard";
import type { Design } from "@/lib/types/design";
import type {
  SalesCatalog,
  SalesCatalogStatus,
} from "@/lib/types/sales-catalog";

export default function SalesCatalogDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [catalog, setCatalog] = useState<SalesCatalog | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch(
      `/api/sales-catalogs/${params.id}?include=designs`,
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No encontrado");
      return;
    }
    setCatalog(data.catalog);
    setDesigns(data.designs ?? []);
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!catalog) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/sales-catalogs/${catalog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: catalog.name,
          description: catalog.description,
          status: catalog.status,
          designIds: catalog.designIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setCatalog(data.catalog);
      setMessage("Guardado");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function removeDesign(designId: string) {
    if (!catalog) return;
    const nextIds = catalog.designIds.filter((id) => id !== designId);
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/sales-catalogs/${catalog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designIds: nextIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setCatalog(data.catalog);
      setDesigns((prev) => prev.filter((d) => d.id !== designId));
      setMessage("Diseño quitado del catálogo");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!catalog) return;
    if (!window.confirm(`¿Eliminar el catálogo «${catalog.name}»?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sales-catalogs/${catalog.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      router.push("/sales-catalogs");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div>
        <p className="text-brand-red">{error}</p>
        <Link href="/sales-catalogs" className="mt-4 inline-block text-brand-cyan">
          ← Volver
        </Link>
      </div>
    );
  }

  if (!catalog) {
    return <p className="text-text-muted">Cargando…</p>;
  }

  const field =
    "w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm outline-none focus:border-brand-cyan";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/sales-catalogs" className="text-sm text-brand-cyan">
        ← Catálogos de venta
      </Link>

      <form onSubmit={onSave} className="space-y-3 rounded-2xl border border-border bg-bg-panel p-4">
        <input
          className={field}
          value={catalog.name}
          onChange={(e) => setCatalog({ ...catalog, name: e.target.value })}
        />
        <textarea
          className={`${field} min-h-20`}
          value={catalog.description}
          onChange={(e) =>
            setCatalog({ ...catalog, description: e.target.value })
          }
          placeholder="Descripción (opcional)"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-text-muted">
            Estado{" "}
            <select
              className="ml-2 rounded-lg border border-border bg-bg-elevated px-2 py-1.5 text-sm"
              value={catalog.status}
              onChange={(e) =>
                setCatalog({
                  ...catalog,
                  status: e.target.value as SalesCatalogStatus,
                })
              }
            >
              <option value="published">publicado</option>
              <option value="draft">borrador</option>
            </select>
          </label>
          <p className="text-xs text-text-muted">
            slug: /{catalog.slug} · {catalog.designIds.length} diseños
          </p>
        </div>
        {message ? <p className="text-sm text-brand-cyan">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg border border-brand-cyan/50 bg-brand-cyan/15 px-3 py-2 text-sm text-brand-cyan disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <Link
            href={`/p/catalog/${catalog.slug}`}
            className="rounded-lg border border-border px-3 py-2 text-sm text-text-muted"
          >
            Ver como vendedor
          </Link>
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={saving}
            className="rounded-lg border border-brand-red/40 px-3 py-2 text-sm text-brand-red disabled:opacity-50"
          >
            Eliminar
          </button>
        </div>
      </form>

      <div>
        <h3 className="mb-3 font-[family-name:var(--font-display)] text-lg">
          Diseños en este catálogo
        </h3>
        {designs.length === 0 ? (
          <p className="text-sm text-text-muted">
            Vacío. Agrega diseños desde{" "}
            <Link href="/catalog" className="text-brand-cyan">
              Mi catálogo
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {designs.map((design) => (
              <div key={design.id} className="relative">
                <DesignCard
                  design={design}
                  href={`/catalog/${design.id}`}
                />
                <button
                  type="button"
                  onClick={() => void removeDesign(design.id)}
                  className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-[10px] text-brand-orange"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

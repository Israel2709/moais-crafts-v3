"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Design, Taxonomies } from "@/lib/types/design";

export default function CatalogDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [design, setDesign] = useState<Design | null>(null);
  const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [dRes, tRes] = await Promise.all([
        fetch(`/api/designs/${params.id}`),
        fetch("/api/taxonomies"),
      ]);
      const dData = await dRes.json();
      const tData = await tRes.json();
      if (!dRes.ok) {
        setError(dData.error || "No encontrado");
        return;
      }
      setDesign(dData.design);
      setTaxonomies(tData.taxonomies ?? null);
    }
    void load();
  }, [params.id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!design) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/designs/${design.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: design.title,
        category: design.category,
        season: design.season,
        franchise: design.franchise,
        notes: design.notes,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || "Error al guardar");
      return;
    }
    setDesign(data.design);
    setMessage("Guardado");
  }

  if (error) {
    return <p className="text-brand-red">{error}</p>;
  }

  if (!design) {
    return <p className="text-text-muted">Cargando…</p>;
  }

  const field =
    "w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm";

  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_1.2fr]">
      <div className="overflow-hidden rounded-2xl border border-border bg-bg-panel">
        {design.previewUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={design.previewUrls[0]}
            alt={design.title}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center text-text-muted">
            Sin preview
          </div>
        )}
      </div>

      <form onSubmit={onSave} className="space-y-3">
        <button
          type="button"
          onClick={() => router.push("/catalog")}
          className="text-sm text-brand-cyan"
        >
          ← Volver a mi catálogo
        </button>
        <input
          className={field}
          value={design.title}
          onChange={(e) => setDesign({ ...design, title: e.target.value })}
        />
        <select
          className={field}
          value={design.category}
          onChange={(e) => setDesign({ ...design, category: e.target.value })}
        >
          {(taxonomies?.categories ?? [
            { slug: design.category, label: design.category },
          ]).map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className={field}
          value={design.season}
          onChange={(e) => setDesign({ ...design, season: e.target.value })}
        >
          {(taxonomies?.seasons ?? [
            { slug: design.season, label: design.season },
          ]).map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className={field}
          value={design.franchise}
          onChange={(e) => setDesign({ ...design, franchise: e.target.value })}
        >
          {(
            taxonomies?.franchises ?? [
              { slug: design.franchise, label: design.franchise },
            ]
          ).map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <textarea
          className={`${field} min-h-24`}
          value={design.notes}
          onChange={(e) => setDesign({ ...design, notes: e.target.value })}
          placeholder="Notas"
        />
        <div className="flex flex-wrap gap-2">
          {design.fileUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-brand-cyan/40 px-3 py-2 text-sm text-brand-cyan"
            >
              Descargar archivo
            </a>
          ))}
          {design.source?.driveFileId ? (
            <a
              href={`https://drive.google.com/file/d/${design.source.driveFileId}/view`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border px-3 py-2 text-sm text-text-muted"
            >
              Ver en Drive
            </a>
          ) : null}
        </div>
        {message ? <p className="text-sm text-brand-cyan">{message}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-brand-cyan/50 bg-brand-cyan/15 px-4 py-2 text-sm text-brand-cyan disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </div>
  );
}

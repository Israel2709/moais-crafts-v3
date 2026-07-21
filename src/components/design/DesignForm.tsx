"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DesignFeedbackModal } from "@/components/design/DesignFeedbackModal";
import {
  normalizeSingleTag,
  type DesignFormValues,
} from "@/lib/designs/form";
import type { Taxonomies, TaxonomyTerm } from "@/lib/types/design";

const fieldClass =
  "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm";

function TagsField({
  tags,
  catalog,
  onChange,
  onCatalogChange,
}: {
  tags: string[];
  catalog: string[];
  onChange: (tags: string[]) => void;
  onCatalogChange: (taxonomies: Taxonomies) => void;
}) {
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = normalizeSingleTag(draft);
    return catalog
      .filter((tag) => !tags.includes(tag))
      .filter((tag) => (q ? tag.includes(q) : true))
      .slice(0, 8);
  }, [catalog, draft, tags]);

  async function registerInCatalog(tag: string) {
    if (catalog.includes(tag)) return;
    try {
      const res = await fetch("/api/taxonomies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "tags", value: tag }),
      });
      const data = await res.json();
      if (res.ok && data.taxonomies) {
        onCatalogChange(data.taxonomies);
      }
    } catch {
      // catalog update is best-effort
    }
  }

  function commitTag(raw: string) {
    const tag = normalizeSingleTag(raw.replace(/,/g, ""));
    if (!tag) {
      setDraft("");
      return;
    }
    if (tags.includes(tag)) {
      setHint(`“${tag}” ya está en la lista`);
      setDraft("");
      return;
    }
    if (tags.length >= 10) {
      setHint("Máximo 10 tags");
      setDraft("");
      return;
    }
    onChange([...tags, tag]);
    void registerInCatalog(tag);
    setHint(null);
    setDraft("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function onDraftChange(value: string) {
    setHint(null);
    if (value.includes(",")) {
      const parts = value.split(",");
      const last = parts.pop() ?? "";
      let next = tags;
      let duplicate: string | null = null;
      for (const part of parts) {
        const tag = normalizeSingleTag(part);
        if (!tag) continue;
        if (next.includes(tag)) {
          duplicate = tag;
          continue;
        }
        if (next.length >= 10) {
          setHint("Máximo 10 tags");
          break;
        }
        next = [...next, tag];
        void registerInCatalog(tag);
      }
      if (next !== tags) onChange(next);
      if (duplicate) setHint(`“${duplicate}” ya está en la lista`);
      setDraft(last);
      setOpen(true);
      return;
    }
    setDraft(value);
    setOpen(true);
  }

  function removeTag(tag: string) {
    onChange(tags.filter((item) => item !== tag));
    setHint(null);
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-text-muted">
        Tags <span className="text-text-muted/70">(máx. 10 · Enter o coma)</span>
      </label>

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full border border-border bg-bg-panel px-2.5 py-0.5 text-xs text-brand-cream hover:border-brand-red"
              >
                {tag} ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative">
        <input
          ref={inputRef}
          className={fieldClass}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // delay so suggestion click can fire
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitTag(draft);
            } else if (e.key === "Backspace" && !draft && tags.length > 0) {
              removeTag(tags[tags.length - 1]!);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="caja, libro, celta…"
          disabled={tags.length >= 10}
          autoComplete="off"
        />
        {open && suggestions.length > 0 ? (
          <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-border bg-bg-panel py-1 shadow-lg">
            {suggestions.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  className="flex w-full px-3 py-1.5 text-left text-xs text-brand-cream hover:bg-bg-elevated"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commitTag(tag)}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-brand-orange">{hint}</p> : null}
      {!draft && catalog.length > 0 && tags.length < 10 ? (
        <div className="flex flex-wrap gap-1">
          {catalog
            .filter((tag) => !tags.includes(tag))
            .slice(0, 6)
            .map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => commitTag(tag)}
                className="rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-text-muted hover:border-brand-cyan hover:text-brand-cyan"
              >
                + {tag}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}

function TaxonomySelect({
  label,
  field,
  value,
  options,
  onChange,
  onTaxonomiesChange,
}: {
  label: string;
  field: "categories" | "seasons";
  value: string;
  options: TaxonomyTerm[];
  onChange: (value: string) => void;
  onTaxonomiesChange: (taxonomies: Taxonomies) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addValue() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/taxonomies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo agregar");
      onTaxonomiesChange(data.taxonomies);
      onChange(data.term?.slug ?? trimmed);
      setDraft("");
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-text-muted">{label}</label>
      <select
        className={fieldClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        {options.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.label}
          </option>
        ))}
      </select>
      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs text-brand-cyan hover:underline"
        >
          + Agregar {label.toLowerCase()}
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            className={fieldClass}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`ej. Día del padre`}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void addValue()}
            className="shrink-0 rounded-lg bg-brand-blue px-3 py-2 text-xs disabled:opacity-60"
          >
            {saving ? "…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setDraft("");
              setError(null);
            }}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-text-muted"
          >
            Cancelar
          </button>
        </div>
      )}
      {error ? <p className="text-xs text-brand-red">{error}</p> : null}
    </div>
  );
}

export function DesignForm({
  values,
  onChange,
  taxonomies,
  onTaxonomiesChange,
  previewFiles,
  onPreviewFilesChange,
  designFiles,
  onDesignFilesChange,
  existingPreviewUrls,
  requireLocalPreviews = false,
  showLocalPreviewInput = true,
  showDesignFiles = false,
  submitting,
  submitLabel = "Guardar",
  onSubmit,
  message,
  error,
  onClearFeedback,
}: {
  values: DesignFormValues;
  onChange: (next: DesignFormValues) => void;
  taxonomies: Taxonomies;
  onTaxonomiesChange: (taxonomies: Taxonomies) => void;
  previewFiles: File[];
  onPreviewFilesChange: (files: File[]) => void;
  designFiles?: File[];
  onDesignFilesChange?: (files: File[]) => void;
  existingPreviewUrls?: string[];
  requireLocalPreviews?: boolean;
  showLocalPreviewInput?: boolean;
  showDesignFiles?: boolean;
  submitting: boolean;
  submitLabel?: string;
  onSubmit: (event: FormEvent) => void;
  message?: string | null;
  error?: string | null;
  onClearFeedback?: () => void;
}) {
  const clearFeedback = useCallback(() => {
    onClearFeedback?.();
  }, [onClearFeedback]);
  const [previewObjectUrls, setPreviewObjectUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = previewFiles.map((file) => URL.createObjectURL(file));
    setPreviewObjectUrls(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [previewFiles]);

  const hasExistingPreviews = (existingPreviewUrls?.length ?? 0) > 0;
  const hasLocalPreviews = previewFiles.length > 0;
  const imagesOk =
    !requireLocalPreviews || hasLocalPreviews || hasExistingPreviews;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-text-muted">Nombre</label>
        <input
          className={fieldClass}
          value={values.title}
          onChange={(e) => onChange({ ...values, title: e.target.value })}
          placeholder="Nombre del diseño"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-text-muted">Descripción</label>
        <textarea
          className={`${fieldClass} min-h-24`}
          value={values.description}
          onChange={(e) =>
            onChange({ ...values, description: e.target.value })
          }
          placeholder="Descripción visible para el vendedor"
          required
        />
      </div>

      <TaxonomySelect
        label="Categoría"
        field="categories"
        value={values.category}
        options={taxonomies.categories}
        onChange={(category) => onChange({ ...values, category })}
        onTaxonomiesChange={onTaxonomiesChange}
      />

      <TaxonomySelect
        label="Temporada"
        field="seasons"
        value={values.season}
        options={taxonomies.seasons}
        onChange={(season) => onChange({ ...values, season })}
        onTaxonomiesChange={onTaxonomiesChange}
      />

      <TagsField
        tags={values.tags}
        catalog={taxonomies.tags ?? []}
        onChange={(tags) => onChange({ ...values, tags })}
        onCatalogChange={onTaxonomiesChange}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs text-text-muted">Precio de fábrica</label>
          <input
            className={fieldClass}
            type="number"
            min="0"
            step="0.01"
            value={values.factoryPrice}
            onChange={(e) =>
              onChange({ ...values, factoryPrice: e.target.value })
            }
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-text-muted">
            Precio sugerido de venta
          </label>
          <input
            className={fieldClass}
            type="number"
            min="0"
            step="0.01"
            value={values.suggestedPrice}
            onChange={(e) =>
              onChange({ ...values, suggestedPrice: e.target.value })
            }
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-text-muted">
          Tiempo estimado de fabricación
        </label>
        <input
          className={fieldClass}
          value={values.fabricationTime}
          onChange={(e) =>
            onChange({ ...values, fabricationTime: e.target.value })
          }
          placeholder="ej. 45 min, 2 horas, 1 día"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-text-muted">Ubicación en Drive</label>
        <input
          className={fieldClass}
          value={values.driveLocation}
          onChange={(e) =>
            onChange({ ...values, driveLocation: e.target.value })
          }
          placeholder="URL o ruta de la carpeta en Drive"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-text-muted">
          Imágenes de muestra
          {requireLocalPreviews && !hasExistingPreviews ? " *" : ""}
        </label>
        {hasExistingPreviews ? (
          <div className="mb-2 grid grid-cols-3 gap-2">
            {existingPreviewUrls!.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="aspect-square rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        ) : null}
        {hasExistingPreviews ? (
          <p className="text-[11px] text-text-muted">
            Se usarán las imágenes de Drive al agregar al catálogo.
          </p>
        ) : null}
        {showLocalPreviewInput ? (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              onPreviewFilesChange(Array.from(e.target.files ?? []))
            }
            className="block w-full text-xs text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue file:px-3 file:py-1.5 file:text-xs file:text-brand-cream"
          />
        ) : null}
        {showLocalPreviewInput && previewObjectUrls.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {previewObjectUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="aspect-square rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>

      {showDesignFiles && onDesignFilesChange ? (
        <div className="space-y-1.5">
          <label className="text-xs text-text-muted">
            Archivos de diseño (opcional)
          </label>
          <input
            type="file"
            multiple
            onChange={(e) =>
              onDesignFilesChange(Array.from(e.target.files ?? []))
            }
            className="block w-full text-xs text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-bg-panel file:px-3 file:py-1.5 file:text-xs file:text-brand-cream"
          />
          {designFiles && designFiles.length > 0 ? (
            <p className="text-[11px] text-text-muted">
              {designFiles.length} archivo
              {designFiles.length === 1 ? "" : "s"} seleccionado
              {designFiles.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="text-xs text-text-muted">Notas</label>
        <textarea
          className={`${fieldClass} min-h-20`}
          value={values.notes}
          onChange={(e) => onChange({ ...values, notes: e.target.value })}
          placeholder="Opcional"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !imagesOk}
        className="w-full rounded-lg bg-brand-red py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {submitting ? "Guardando…" : submitLabel}
      </button>

      {message ? (
        <DesignFeedbackModal
          kind="success"
          title="Diseño guardado"
          text={message}
          onClose={clearFeedback}
        />
      ) : null}
      {error ? (
        <DesignFeedbackModal
          kind="error"
          title="No se pudo guardar"
          text={error}
          onClose={clearFeedback}
        />
      ) : null}
    </form>
  );
}

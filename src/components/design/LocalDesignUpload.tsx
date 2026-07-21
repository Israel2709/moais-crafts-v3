"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { DesignForm } from "@/components/design/DesignForm";
import {
  EMPTY_DESIGN_FORM,
  type DesignFormValues,
} from "@/lib/designs/form";
import { DEFAULT_TAXONOMIES } from "@/lib/firebase/collections";
import type { Taxonomies } from "@/lib/types/design";

export function LocalDesignUpload() {
  const [taxonomies, setTaxonomies] = useState<Taxonomies>(DEFAULT_TAXONOMIES);
  const [values, setValues] = useState<DesignFormValues>(EMPTY_DESIGN_FORM);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/taxonomies")
      .then((r) => r.json())
      .then((d) => {
        if (d.taxonomies) setTaxonomies(d.taxonomies);
      })
      .catch(() => undefined);
  }, []);

  const clearFeedback = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const body = new FormData();
      body.set("title", values.title);
      body.set("category", values.category);
      body.set("season", values.season);
      body.set("tags", JSON.stringify(values.tags));
      body.set("factoryPrice", values.factoryPrice);
      body.set("suggestedPrice", values.suggestedPrice);
      body.set("fabricationTime", values.fabricationTime);
      body.set("driveLocation", values.driveLocation);
      body.set("notes", values.notes);
      for (const file of previewFiles) {
        body.append("previews", file);
      }
      for (const file of designFiles) {
        body.append("files", file);
      }

      const res = await fetch("/api/designs/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");

      setValues({
        ...EMPTY_DESIGN_FORM,
        category: values.category,
        season: values.season,
      });
      setPreviewFiles([]);
      setDesignFiles([]);
      setMessage(`Diseño creado: ${data.design.title} (${data.design.id})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-brand-cream">
          Subir diseño
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Carga un diseño desde tu equipo a Firebase. El mismo formulario se usa
          al agregar desde Drive.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-bg-panel p-4 md:p-5">
        <DesignForm
          values={values}
          onChange={setValues}
          taxonomies={taxonomies}
          onTaxonomiesChange={setTaxonomies}
          previewFiles={previewFiles}
          onPreviewFilesChange={setPreviewFiles}
          designFiles={designFiles}
          onDesignFilesChange={setDesignFiles}
          requireLocalPreviews
          showDesignFiles
          submitting={submitting}
          submitLabel="Subir a catálogo"
          onSubmit={onSubmit}
          message={message}
          error={error}
          onClearFeedback={clearFeedback}
        />
      </div>
    </div>
  );
}

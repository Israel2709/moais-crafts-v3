"use client";

import { useEffect, useState } from "react";
import { DesignCard } from "@/components/design/DesignCard";
import type { Design } from "@/lib/types/design";

export default function PublicCatalogPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/designs?status=published")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error");
        setDesigns(data.designs ?? []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="min-h-dvh px-4 py-8 md:px-10">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-orange">
          Moai&apos;s Crafts
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-brand-cyan">
          Catálogo público
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-muted">
          Stub v1 — solo diseños con status <code>published</code>. Pedidos y
          WhatsApp llegan después.
        </p>
      </header>
      {error ? <p className="text-brand-red">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {designs.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            href={`/p/catalog/${design.id}`}
          />
        ))}
      </div>
      {!error && designs.length === 0 ? (
        <p className="text-sm text-text-muted">Aún no hay diseños publicados.</p>
      ) : null}
    </div>
  );
}

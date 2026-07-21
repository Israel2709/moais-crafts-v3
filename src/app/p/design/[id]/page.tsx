"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LuLoaderCircle } from "react-icons/lu";
import { SellerProductDetail } from "@/components/catalog/SellerProductDetail";
import {
  cacheDesign,
  getCachedDesign,
} from "@/lib/designs/client-cache";
import type { Design } from "@/lib/types/design";

function safeBackHref(from: string | null): string {
  if (!from) return "/p/catalog";
  if (!from.startsWith("/p/")) return "/p/catalog";
  return from;
}

function LoadingState() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4">
      <LuLoaderCircle
        className="h-8 w-8 animate-spin text-brand-cyan"
        aria-hidden
      />
      <p className="text-sm text-text-muted">Cargando…</p>
    </div>
  );
}

function PublicDesignPageInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const backHref = safeBackHref(searchParams.get("from"));
  const [design, setDesign] = useState<Design | null>(
    () => getCachedDesign(params.id) ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedDesign(params.id);
    if (cached) {
      setDesign(cached);
      setError(null);
    }

    let cancelled = false;
    void fetch(`/api/designs/${params.id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No encontrado");
        if (cancelled) return;
        cacheDesign(data.design);
        setDesign(data.design);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        if (!getCachedDesign(params.id)) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (error) {
    return (
      <div className="min-h-dvh px-4 py-8">
        <p className="text-brand-red">{error}</p>
        <Link href={backHref} className="mt-4 inline-block text-brand-cyan">
          Volver
        </Link>
      </div>
    );
  }

  if (!design) return <LoadingState />;

  return <SellerProductDetail design={design} backHref={backHref} />;
}

export default function PublicDesignPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PublicDesignPageInner />
    </Suspense>
  );
}

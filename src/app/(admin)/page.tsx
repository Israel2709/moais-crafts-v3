import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm uppercase tracking-[0.2em] text-brand-orange">
        Moai&apos;s Crafts
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-brand-cream md:text-4xl">
        Catálogo curado de diseños
      </h2>
      <p className="mt-4 max-w-xl text-text-muted">
        Explora carpetas de Drive por tipo, guarda lo útil en Firebase (Raziel
        Hub) y filtra tu catálogo.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/laser"
          className="rounded-2xl border border-border bg-bg-panel p-5 transition hover:border-brand-cyan"
        >
          <p className="text-brand-cyan">Archivos laser</p>
          <p className="mt-2 text-sm text-text-muted">
            Carpetas de Drive con diseños para corte láser. Varias fuentes.
          </p>
        </Link>
        <Link
          href="/3d"
          className="rounded-2xl border border-border bg-bg-panel p-5 transition hover:border-brand-orange"
        >
          <p className="text-brand-orange">Archivos 3D</p>
          <p className="mt-2 text-sm text-text-muted">
            Carpetas de Drive con STL y otros archivos 3D. Varias fuentes.
          </p>
        </Link>
        <Link
          href="/amigurumis"
          className="rounded-2xl border border-border bg-bg-panel p-5 transition hover:border-brand-cream"
        >
          <p className="text-brand-cream">Amigurumis</p>
          <p className="mt-2 text-sm text-text-muted">
            Carpetas de Drive con patrones y archivos de amigurumis.
          </p>
        </Link>
        <Link
          href="/catalog"
          className="rounded-2xl border border-border bg-bg-panel p-5 transition hover:border-brand-cyan"
        >
          <p className="text-brand-cyan">Mi catálogo</p>
          <p className="mt-2 text-sm text-text-muted">
            Solo lo que ya curaste — listo para publicar después.
          </p>
        </Link>
      </div>
    </div>
  );
}

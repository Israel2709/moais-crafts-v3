import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm uppercase tracking-[0.2em] text-brand-orange">
        Moai&apos;s Crafts
      </p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-brand-cream md:text-4xl">
        Tu catálogo curado de diseños laser
      </h2>
      <p className="mt-4 max-w-xl text-text-muted">
        Explora el Drive compartido, guarda solo lo que te sirve en Firebase
        (Raziel Hub) y filtra por nombre, categoría, temporada y franquicia.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/explore"
          className="rounded-2xl border border-border bg-bg-panel p-5 transition hover:border-brand-cyan"
        >
          <p className="text-brand-cyan">Explorar Drive</p>
          <p className="mt-2 text-sm text-text-muted">
            Busca y navega carpetas. Agrega diseños a tu catálogo.
          </p>
        </Link>
        <Link
          href="/catalog"
          className="rounded-2xl border border-border bg-bg-panel p-5 transition hover:border-brand-orange"
        >
          <p className="text-brand-orange">Mi catálogo</p>
          <p className="mt-2 text-sm text-text-muted">
            Solo lo que ya curaste — listo para publicar después.
          </p>
        </Link>
      </div>
    </div>
  );
}

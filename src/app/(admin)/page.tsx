import Link from "next/link";
import {
  LuBox,
  LuFolderOpen,
  LuGlobe,
  LuHeart,
  LuLibrary,
  LuUpload,
} from "react-icons/lu";

const actions = [
  {
    href: "/upload",
    label: "Subir diseño",
    hint: "Agrega un diseño nuevo al catálogo.",
    icon: LuUpload,
    tone: "bg-brand-red text-brand-cream shadow-brand-red/30",
    primary: true,
  },
  {
    href: "/laser",
    label: "Archivos laser",
    hint: "Explora carpetas de Drive para corte láser.",
    icon: LuFolderOpen,
    tone: "border border-border bg-bg-panel hover:border-brand-cyan",
    primary: false,
  },
  {
    href: "/3d",
    label: "Archivos 3D",
    hint: "STL y otros archivos 3D desde Drive.",
    icon: LuBox,
    tone: "border border-border bg-bg-panel hover:border-brand-orange",
    primary: false,
  },
  {
    href: "/amigurumis",
    label: "Amigurumis",
    hint: "Patrones y archivos de amigurumis.",
    icon: LuHeart,
    tone: "border border-border bg-bg-panel hover:border-brand-cream",
    primary: false,
  },
  {
    href: "/catalog",
    label: "Mi catálogo",
    hint: "Tu colección personal de diseños curados.",
    icon: LuLibrary,
    tone: "border border-border bg-bg-panel hover:border-brand-cyan",
    primary: false,
  },
  {
    href: "/sales-catalogs",
    label: "Catálogos de venta",
    hint: "Colecciones publicadas para el vendedor.",
    icon: LuGlobe,
    tone: "border border-border bg-bg-panel hover:border-brand-orange",
    primary: false,
  },
] as const;

export default function HomePage() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">
        Inicio
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-brand-cream">
        ¿Qué quieres hacer?
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        Explora Drive, cura tu catálogo y arma los packs de venta.
      </p>

      <div className="mt-6 grid gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-start gap-3 rounded-2xl p-4 transition active:scale-[0.99] ${
                action.primary
                  ? `${action.tone} shadow-lg`
                  : action.tone
              }`}
            >
              <span
                className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  action.primary
                    ? "bg-black/15"
                    : "bg-bg-elevated text-brand-cyan"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm font-semibold ${
                    action.primary ? "" : "text-brand-cream"
                  }`}
                >
                  {action.label}
                </span>
                <span
                  className={`mt-1 block text-xs leading-relaxed ${
                    action.primary ? "text-brand-cream/85" : "text-text-muted"
                  }`}
                >
                  {action.hint}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

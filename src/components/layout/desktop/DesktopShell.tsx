"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/explore", label: "Explorar Drive" },
  { href: "/catalog", label: "Mi catálogo" },
  { href: "/p/catalog", label: "Vista pública" },
];

export function DesktopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="hidden min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-r border-border bg-bg-elevated px-5 py-6">
        <div className="mb-10">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-brand-cyan">
            Moai&apos;s Catalog
          </p>
          <p className="mt-1 text-sm text-text-muted">Raziel Hub · laser cut</p>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-brand-blue/40 text-brand-cream"
                    : "text-text-muted hover:bg-bg-panel hover:text-brand-cream"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between border-b border-border px-8 py-4">
          <h1 className="font-[family-name:var(--font-display)] text-xl text-brand-cream">
            Panel de diseños
          </h1>
          <span className="rounded-full border border-brand-orange/40 px-3 py-1 text-xs text-brand-orange">
            PWA · dark
          </span>
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

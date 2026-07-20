"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Inicio" },
  { href: "/explore", label: "Explorar" },
  { href: "/catalog", label: "Catálogo" },
];

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col md:hidden">
      <header className="sticky top-0 z-20 border-b border-border bg-bg-elevated/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-red bg-bg-panel text-xs font-bold text-brand-cyan">
            MC
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-brand-cyan">
              Moai&apos;s Catalog
            </p>
            <p className="text-xs text-text-muted">Laser cut designs</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg-elevated/95 backdrop-blur">
        <ul className="grid grid-cols-3">
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`flex flex-col items-center gap-1 px-2 py-3 text-xs ${
                    active ? "text-brand-cyan" : "text-text-muted"
                  }`}
                >
                  <span
                    className={`h-1 w-8 rounded-full ${
                      active ? "bg-brand-orange" : "bg-transparent"
                    }`}
                  />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

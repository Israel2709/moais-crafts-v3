"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/admin/SignOutButton";

const tabs = [
  { href: "/laser", label: "Laser" },
  { href: "/3d", label: "3D" },
  { href: "/amigurumis", label: "Ami" },
  { href: "/catalog", label: "Catálogo" },
];

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden md:hidden">
      <header className="sticky top-0 z-20 border-b border-border bg-bg-elevated/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-brand-red bg-bg-panel text-xs font-bold text-brand-cyan"
          >
            MC
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-brand-cyan">
              Moai&apos;s Catalog
            </p>
            <p className="text-xs text-text-muted">Laser cut designs</p>
          </div>
          <SignOutButton className="shrink-0 text-xs text-text-muted" />
        </div>
      </header>

      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-24 pt-4">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg-elevated/95 backdrop-blur">
        <ul className="grid grid-cols-4">
          {tabs.map((tab) => {
            const active =
              pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`flex flex-col items-center gap-1 px-1 py-3 text-[11px] ${
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

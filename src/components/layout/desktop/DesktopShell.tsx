"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LuBox,
  LuFolderOpen,
  LuGlobe,
  LuHeart,
  LuHouse,
  LuLibrary,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuLogOut,
  LuUpload,
} from "react-icons/lu";
import { SiGoogledrive } from "react-icons/si";
import type { IconType } from "react-icons";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { kindFromPathname, KIND_ROUTES } from "@/lib/drive/kind-labels";

const SIDEBAR_KEY = "moais-sidebar-collapsed";

const links: { href: string; label: string; icon: IconType }[] = [
  { href: "/", label: "Inicio", icon: LuHouse },
  { href: "/upload", label: "Subir diseño", icon: LuUpload },
  { href: "/laser", label: "Archivos laser", icon: LuFolderOpen },
  { href: "/3d", label: "Archivos 3D", icon: LuBox },
  { href: "/amigurumis", label: "Amigurumis", icon: LuHeart },
  { href: "/catalog", label: "Mi catálogo", icon: LuLibrary },
  { href: "/sales-catalogs", label: "Catálogos de venta", icon: LuGlobe },
];

export function DesktopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_KEY);
    setCollapsed(stored === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function onSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(getClientAuth()).catch(() => undefined);
      window.location.href = "/";
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div
      className={`hidden h-dvh overflow-hidden md:grid ${
        collapsed
          ? "md:grid-cols-[72px_minmax(0,1fr)]"
          : "md:grid-cols-[240px_minmax(0,1fr)]"
      }`}
    >
      <aside
        className={`flex h-full min-h-0 flex-col border-r border-border bg-bg-elevated py-5 transition-[padding] ${
          collapsed ? "items-center px-2" : "px-5"
        }`}
      >
        <div className="mb-8 w-full">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-brand-cyan">
                MC
              </p>
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Expandir panel"
                aria-label="Expandir panel"
                className="rounded-lg p-1.5 text-text-muted transition hover:bg-bg-panel hover:text-brand-cream"
              >
                <LuPanelLeftOpen className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 font-[family-name:var(--font-display)] text-lg font-semibold text-brand-cyan">
                  Moai&apos;s Catalog
                </p>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  title="Colapsar panel"
                  aria-label="Colapsar panel"
                  className="shrink-0 rounded-lg p-1.5 text-text-muted transition hover:bg-bg-panel hover:text-brand-cream"
                >
                  <LuPanelLeftClose className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="mt-1 text-sm text-text-muted">Raziel Hub · laser cut</p>
            </>
          )}
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={`flex items-center gap-3 rounded-lg text-sm transition ${
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
                } ${
                  active
                    ? "bg-brand-blue/40 text-brand-cream"
                    : "text-text-muted hover:bg-bg-panel hover:text-brand-cream"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {!collapsed ? <span className="truncate">{link.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div
          className={`mt-4 flex w-full border-t border-border pt-4 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => void onSignOut()}
            disabled={signingOut}
            title="Cerrar sesión"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted transition hover:bg-bg-panel hover:text-brand-orange disabled:opacity-60 ${
              collapsed ? "justify-center px-2" : ""
            }`}
          >
            <LuLogOut className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed ? (
              <span>{signingOut ? "Saliendo…" : "Cerrar sesión"}</span>
            ) : null}
          </button>
        </div>
      </aside>

      <div className="grid h-dvh min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]">
        <header className="flex items-center justify-between gap-4 border-b border-border px-8 py-4">
          <h1 className="min-w-0 font-[family-name:var(--font-display)] text-xl text-brand-cream">
            Panel de diseños
          </h1>
          <a
            href={`/api/drive/auth?return=${KIND_ROUTES[kindFromPathname(pathname)]}`}
            title="Conectar con Google Drive"
            aria-label="Conectar con Google Drive"
            className="shrink-0 rounded-lg border border-border bg-bg-panel p-2 text-brand-cyan transition hover:border-brand-cyan hover:bg-bg-elevated"
          >
            <SiGoogledrive className="h-4 w-4" aria-hidden />
          </a>
        </header>
        <main className="box-border min-h-0 min-w-0 overflow-hidden px-8 py-6">
          <div className="h-full min-h-0 overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

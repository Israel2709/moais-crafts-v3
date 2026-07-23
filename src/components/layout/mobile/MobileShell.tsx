"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuBox,
  LuFolderOpen,
  LuHeart,
  LuLibrary,
  LuPlus,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SignOutButton } from "@/components/admin/SignOutButton";

const sideTabs: {
  href: string;
  label: string;
  icon: IconType;
  activeIcon: IconType;
}[] = [
  { href: "/laser", label: "Laser", icon: LuFolderOpen, activeIcon: LuFolderOpen },
  { href: "/3d", label: "3D", icon: LuBox, activeIcon: LuBox },
  { href: "/amigurumis", label: "Ami", icon: LuHeart, activeIcon: LuHeart },
  { href: "/catalog", label: "Catálogo", icon: LuLibrary, activeIcon: LuLibrary },
];

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh min-w-0 w-full max-w-lg flex-col overflow-x-hidden md:hidden">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-bg-elevated/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="shrink-0" aria-label="Inicio Moai's Crafts">
            <BrandLogo size="sm" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-brand-cyan">
              Moai&apos;s Crafts
            </p>
            <p className="text-xs text-text-muted">Laser cut · panel</p>
          </div>
          <SignOutButton className="shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-medium text-text-muted transition hover:bg-bg-panel hover:text-brand-orange" />
        </div>
      </header>

      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-28 pt-5">
        {children}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-bg-elevated/92 backdrop-blur-md">
        <div className="relative mx-auto flex max-w-lg items-end justify-around px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          {sideTabs.slice(0, 2).map((tab) => (
            <MobileTab key={tab.href} {...tab} pathname={pathname} />
          ))}

          <Link
            href="/upload"
            aria-label="Subir diseño"
            title="Subir"
            className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-brand-red text-brand-cream shadow-lg shadow-brand-red/35 transition active:scale-95"
          >
            <LuPlus className="h-7 w-7" aria-hidden />
          </Link>

          {sideTabs.slice(2).map((tab) => (
            <MobileTab key={tab.href} {...tab} pathname={pathname} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileTab({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: IconType;
  activeIcon: IconType;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`flex min-w-[4.5rem] flex-col items-center gap-0.5 rounded-2xl px-2.5 py-1.5 text-[11px] transition ${
        active
          ? "bg-brand-cyan font-semibold text-bg shadow-sm shadow-brand-cyan/25"
          : "font-medium text-text-muted hover:bg-bg-panel hover:text-brand-cyan"
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LuLoaderCircle, LuLogOut } from "react-icons/lu";
import { getClientAuth } from "@/lib/firebase/client";
import type { AuthRole } from "@/lib/auth/index";

export function SellerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/session")
      .then((res) => res.json())
      .then(
        (data: {
          authenticated?: boolean;
          role?: AuthRole | null;
          user?: { email?: string };
        }) => {
          if (
            data.authenticated &&
            (data.role === "seller" || data.role === "admin")
          ) {
            setEmail(data.user?.email ?? null);
            setRole(data.role);
            setReady(true);
            return;
          }
          router.replace("/");
        },
      )
      .catch(() => router.replace("/"));
  }, [router]);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(getClientAuth()).catch(() => undefined);
      router.replace("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  if (!ready) {
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

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-bg-elevated/95 px-4 py-3 backdrop-blur-md md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-orange">
              Moai&apos;s Crafts
            </p>
            <p className="truncate text-sm text-text-muted">
              {role === "admin" ? "Vista vendedor (admin)" : "Vendedor"}
              {email ? ` · ${email}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void onSignOut()}
            disabled={signingOut}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-muted transition hover:border-brand-orange hover:text-brand-orange disabled:opacity-60"
          >
            <LuLogOut className="h-4 w-4" aria-hidden />
            {signingOut ? "Saliendo…" : "Salir"}
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

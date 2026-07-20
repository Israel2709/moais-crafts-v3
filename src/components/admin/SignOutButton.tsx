"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function onSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(getClientAuth()).catch(() => undefined);
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onSignOut()}
      disabled={loading}
      className={
        className ??
        "text-xs text-text-muted underline-offset-2 hover:text-brand-orange hover:underline disabled:opacity-60"
      }
    >
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";

export function AdminSecretGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data: { authenticated?: boolean }) => {
        setAuthenticated(Boolean(data.authenticated));
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Secreto inválido");
      return;
    }
    setAuthenticated(true);
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-text-muted">
        Cargando…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-6 shadow-xl"
        >
          <p className="font-[family-name:var(--font-display)] text-lg text-brand-cyan">
            Acceso admin temporal
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Ingresa <code className="text-brand-orange">MOAIS_ADMIN_SECRET</code>{" "}
            (se reemplazará con Auth estilo gastly-app).
          </p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-4 w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-brand-cream outline-none focus:border-brand-cyan"
            placeholder="Admin secret"
            required
          />
          {error ? <p className="mt-2 text-sm text-brand-red">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-brand-red px-4 py-2 font-medium text-brand-cream disabled:opacity-60"
          >
            {loading ? "Validando…" : "Entrar"}
          </button>
          <p className="mt-4 text-center text-xs text-text-muted">
            La vista pública{" "}
            <a className="text-brand-cyan underline" href="/p/catalog">
              /p/catalog
            </a>{" "}
            no requiere secreto.
          </p>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

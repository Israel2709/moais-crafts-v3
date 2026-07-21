"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import type { AuthRole } from "@/lib/auth/index";

type SessionResponse = {
  authenticated?: boolean;
  role?: AuthRole | null;
  error?: string;
  user?: { email?: string; role?: AuthRole };
};

function prefersRedirectSignIn() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

async function parseSessionResponse(res: Response): Promise<SessionResponse> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "El servidor no respondió JSON. En Vercel configura FIREBASE_SERVICE_ACCOUNT_JSON y redespliega.",
    );
  }
  try {
    return (await res.json()) as SessionResponse;
  } catch {
    throw new Error(
      "Respuesta inválida del servidor al crear la sesión. Revisa las variables de entorno en Vercel.",
    );
  }
}

async function createSession(idToken: string): Promise<AuthRole> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await parseSessionResponse(res);
  if (!res.ok) {
    await signOut(getClientAuth()).catch(() => undefined);
    throw new Error(data.error || "No se pudo crear la sesión");
  }
  const role = data.role ?? data.user?.role;
  if (!role) {
    throw new Error("No se pudo determinar el rol del usuario");
  }
  return role;
}

function authErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Error de autenticación";
  }
  const code =
    "code" in error && typeof error.code === "string" ? error.code : "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Correo o contraseña incorrectos";
  }
  if (code === "auth/user-not-found") {
    return "Usuario no encontrado";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Inicio de sesión cancelado";
  }
  if (code === "auth/popup-blocked") {
    return "El navegador bloqueó la ventana de Google. Intenta de nuevo.";
  }
  return error.message;
}

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const redirect = await getRedirectResult(getClientAuth());
        if (redirect?.user) {
          const idToken = await redirect.user.getIdToken();
          const role = await createSession(idToken);
          if (cancelled) return;
          if (role === "seller") {
            router.replace("/p/catalog");
            return;
          }
          setAuthenticated(true);
          setReady(true);
          return;
        }
      } catch (err) {
        if (!cancelled) setError(authErrorMessage(err));
      }

      try {
        const res = await fetch("/api/auth/session");
        const data = await parseSessionResponse(res);
        if (cancelled) return;
        if (data.authenticated && data.role === "seller") {
          router.replace("/p/catalog");
          return;
        }
        setAuthenticated(Boolean(data.authenticated && data.role === "admin"));
      } catch {
        // keep login form
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function finishLogin(role: AuthRole) {
    if (role === "seller") {
      router.replace("/p/catalog");
      return;
    }
    setAuthenticated(true);
  }

  async function onEmailSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(
        getClientAuth(),
        email.trim(),
        password,
      );
      const idToken = await credential.user.getIdToken();
      const role = await createSession(idToken);
      await finishLogin(role);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const auth = getClientAuth();

      if (prefersRedirectSignIn()) {
        await signInWithRedirect(auth, provider);
        return;
      }

      try {
        const credential = await signInWithPopup(auth, provider);
        const idToken = await credential.user.getIdToken();
        const role = await createSession(idToken);
        await finishLogin(role);
      } catch (popupErr) {
        const code =
          popupErr instanceof Error &&
          "code" in popupErr &&
          typeof popupErr.code === "string"
            ? popupErr.code
            : "";
        if (
          code === "auth/popup-blocked" ||
          code === "auth/operation-not-supported-in-this-environment"
        ) {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
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
        <div className="w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-6 shadow-xl">
          <p className="font-[family-name:var(--font-display)] text-lg text-brand-cyan">
            Moai&apos;s Crafts
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Entra con Google o correo. Admins van al panel; vendedores a los
            catálogos de venta.
          </p>

          <button
            type="button"
            onClick={() => void onGoogleSignIn()}
            disabled={loading}
            className="mt-5 w-full rounded-lg border border-brand-cyan/50 bg-bg-panel px-4 py-2.5 text-sm font-medium text-brand-cream transition hover:border-brand-cyan disabled:opacity-60"
          >
            Continuar con Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
            <span className="h-px flex-1 bg-border" />
            o con correo
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onEmailSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-brand-cream outline-none focus:border-brand-cyan"
              placeholder="Correo"
              autoComplete="email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-brand-cream outline-none focus:border-brand-cyan"
              placeholder="Contraseña"
              autoComplete="current-password"
              required
            />
            {error ? <p className="text-sm text-brand-red">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-red px-4 py-2 font-medium text-brand-cream disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

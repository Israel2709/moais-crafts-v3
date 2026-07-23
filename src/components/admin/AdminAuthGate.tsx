"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { AuthRole } from "@/lib/auth/index";

type SessionResponse = {
  authenticated?: boolean;
  role?: AuthRole | null;
  error?: string;
  user?: { email?: string; role?: AuthRole };
};

/** localStorage survives iOS Safari leaving for Google better than sessionStorage. */
const GOOGLE_REDIRECT_KEY = "moais.googleRedirect";

/** Survives React Strict Mode double-mount; getRedirectResult is one-shot. */
let redirectResultPromise: Promise<User | null> | null = null;

function readPendingGoogleRedirect(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(GOOGLE_REDIRECT_KEY) === "1";
  } catch {
    return false;
  }
}

function setPendingGoogleRedirect(pending: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (pending) {
      window.localStorage.setItem(GOOGLE_REDIRECT_KEY, "1");
    } else {
      window.localStorage.removeItem(GOOGLE_REDIRECT_KEY);
    }
  } catch {
    // Private mode may block storage; redirect recovery is best-effort.
  }
}

async function parseSessionResponse(res: Response): Promise<SessionResponse> {
  const text = await res.text();
  try {
    return JSON.parse(text) as SessionResponse;
  } catch {
    throw new Error(
      `El servidor respondió ${res.status} sin JSON. Revisa FIREBASE_SERVICE_ACCOUNT_JSON en Vercel (entorno Production) y que no exista FIREBASE_SERVICE_ACCOUNT_PATH apuntando a un archivo local.`,
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

function consumeRedirectUser(allowCurrentUser: boolean): Promise<User | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = (async () => {
      const auth = getClientAuth();
      const result = await getRedirectResult(auth);
      if (result?.user) return result.user;
      return allowCurrentUser ? auth.currentUser : null;
    })().catch((err) => {
      redirectResultPromise = null;
      throw err;
    });
  }
  return redirectResultPromise;
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
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "Inicio de sesión cancelado";
  }
  if (code === "auth/popup-blocked") {
    return "El navegador bloqueó la ventana de Google. Intenta de nuevo.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Este dominio no está autorizado en Firebase Authentication.";
  }
  return error.message;
}

function waitForAuthUser(timeoutMs = 8000): Promise<User | null> {
  const auth = getClientAuth();
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      unsub();
      resolve(auth.currentUser);
    }, timeoutMs);
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      window.clearTimeout(timer);
      unsub();
      resolve(user);
    });
  });
}

function shouldFallbackToRedirect(error: unknown): boolean {
  if (!(error instanceof Error) || !("code" in error)) return false;
  const code = typeof error.code === "string" ? error.code : "";
  return (
    code === "auth/popup-blocked" ||
    code === "auth/operation-not-supported-in-this-environment"
  );
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

    async function finishWithRole(role: AuthRole) {
      if (cancelled) return;
      if (role === "seller") {
        router.replace("/p/catalog");
        return;
      }
      setAuthenticated(true);
      setReady(true);
    }

    async function bootstrap() {
      const pendingRedirect = readPendingGoogleRedirect();

      try {
        const redirectUser = await consumeRedirectUser(pendingRedirect);
        const user =
          redirectUser ??
          (pendingRedirect ? await waitForAuthUser() : null);

        if (user && pendingRedirect) {
          setPendingGoogleRedirect(false);
          const idToken = await user.getIdToken(/* forceRefresh */ true);
          const role = await createSession(idToken);
          await finishWithRole(role);
          return;
        }

        if (!pendingRedirect) {
          const res = await fetch("/api/auth/session");
          const data = await parseSessionResponse(res);
          if (cancelled) return;
          if (data.authenticated && data.role === "seller") {
            router.replace("/p/catalog");
            return;
          }
          if (data.authenticated && data.role === "admin") {
            setAuthenticated(true);
            setReady(true);
            return;
          }
        }

        if (pendingRedirect && !user) {
          setPendingGoogleRedirect(false);
          if (!cancelled) {
            const host =
              typeof window !== "undefined" ? window.location.hostname : "";
            setError(
              `No se pudo completar el login con Google en este navegador. Prueba Chrome (no in-app), confirma que "${host}" esté en Firebase Authorized domains, o usa correo/contraseña.`,
            );
          }
        }
      } catch (err) {
        setPendingGoogleRedirect(false);
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
      const auth = getClientAuth();
      const credential = await signInWithEmailAndPassword(
        auth,
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

      // Reset one-shot redirect consumer for a fresh attempt.
      redirectResultPromise = null;

      // Prefer popup on mobile too — redirect often loses auth state on iOS/Android
      // after returning from accounts.google.com.
      try {
        const credential = await signInWithPopup(auth, provider);
        setPendingGoogleRedirect(false);
        const idToken = await credential.user.getIdToken();
        const role = await createSession(idToken);
        await finishLogin(role);
        return;
      } catch (popupErr) {
        if (!shouldFallbackToRedirect(popupErr)) {
          throw popupErr;
        }
      }

      setPendingGoogleRedirect(true);
      await signInWithRedirect(auth, provider);
    } catch (err) {
      setPendingGoogleRedirect(false);
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
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo size="hero" priority />
          <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-brand-cyan">
            Moai&apos;s Crafts
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Entra con Google o correo. Admins van al panel; vendedores a los
            catálogos de venta.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-bg-elevated/90 p-5 shadow-sm">
          <button
            type="button"
            onClick={() => void onGoogleSignIn()}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-panel px-4 py-2.5 text-sm font-semibold text-brand-cream transition hover:border-brand-cyan active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Conectando…" : "Continuar con Google"}
          </button>

          {error ? (
            <p className="rounded-xl border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="h-px flex-1 bg-border" />
            o con correo
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onEmailSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-panel px-3 py-2.5 text-brand-cream outline-none transition focus:border-brand-cyan"
              placeholder="Correo"
              autoComplete="email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-panel px-3 py-2.5 text-brand-cream outline-none transition focus:border-brand-cyan"
              placeholder="Contraseña"
              autoComplete="current-password"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-brand-cream shadow-sm shadow-brand-red/30 transition active:scale-[0.98] disabled:opacity-60"
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

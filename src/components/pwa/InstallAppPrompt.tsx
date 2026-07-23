"use client";

import { useEffect, useState } from "react";
import { LuDownload, LuShare, LuX } from "react-icons/lu";

const DISMISS_KEY = "moais.pwaInstallDismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/i.test(ua);
  const iPadOs =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // ignore
  }
}

/**
 * Visible install CTA — Chrome/Android uses beforeinstallprompt;
 * iOS Safari has no native prompt, so we show Add to Home Screen steps
 * (same UX gap Gastly covers via the browser menu / share sheet).
 */
export function InstallAppPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay() || wasDismissed()) return;

    if (isIosDevice()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  if (!visible) return null;

  async function onInstall() {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setVisible(false);
      dismiss();
    } finally {
      setInstalling(false);
    }
  }

  function onClose() {
    dismiss();
    setVisible(false);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-border bg-bg-elevated/95 p-3 shadow-xl backdrop-blur-md">
        <div className="mt-0.5 rounded-lg bg-brand-cyan/15 p-2 text-brand-cyan">
          {iosHint ? (
            <LuShare className="h-5 w-5" aria-hidden />
          ) : (
            <LuDownload className="h-5 w-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-cream">
            Instalar Moai&apos;s Crafts
          </p>
          {iosHint ? (
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              En Safari: toca <span className="text-brand-cream">Compartir</span>{" "}
              y luego{" "}
              <span className="text-brand-cream">Añadir a pantalla de inicio</span>.
            </p>
          ) : (
            <p className="mt-1 text-xs text-text-muted">
              Acceso rápido como app, sin pasar por el navegador.
            </p>
          )}
          {!iosHint ? (
            <button
              type="button"
              onClick={() => void onInstall()}
              disabled={installing || !deferred}
              className="mt-2 rounded-lg bg-brand-cyan px-3 py-1.5 text-xs font-medium text-bg-base disabled:opacity-60"
            >
              {installing ? "Instalando…" : "Instalar"}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-muted transition hover:bg-bg-panel hover:text-brand-cream"
          aria-label="Cerrar"
        >
          <LuX className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

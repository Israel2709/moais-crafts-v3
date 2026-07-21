"use client";

import { useEffect } from "react";

export function DesignFeedbackModal({
  kind,
  title,
  text,
  onClose,
}: {
  kind: "success" | "error";
  title: string;
  text: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (kind !== "success") return;
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [kind, text, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="design-feedback-title"
      onClick={kind === "success" ? onClose : undefined}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-bg-panel p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id="design-feedback-title"
          className={`text-sm font-medium ${
            kind === "success" ? "text-brand-cyan" : "text-brand-red"
          }`}
        >
          {title}
        </p>
        <p className="mt-2 break-words text-sm text-brand-cream">{text}</p>
        {kind === "success" ? (
          <p className="mt-3 text-[11px] text-text-muted">
            Se cierra sola en 5 segundos…
          </p>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-lg bg-brand-red py-2 text-sm font-medium"
          >
            Entendido
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";

export function FullscreenPreviewGallery({
  urls,
  alt,
  index,
  onIndexChange,
  onClose,
  footerLabel = "Pedido por WhatsApp pronto",
}: {
  urls: string[];
  alt: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  footerLabel?: string;
}) {
  const titleId = useId();
  const [animate, setAnimate] = useState(true);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (urls.length < 2) return;
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const dir = event.key === "ArrowRight" ? 1 : -1;
      const next = index + dir;
      if (next < 0 || next >= urls.length) {
        onIndexChange((next + urls.length) % urls.length);
        return;
      }
      onIndexChange(next);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, urls.length, onClose, onIndexChange]);

  function setIndex(next: number, withAnimation: boolean) {
    setAnimate(withAnimation);
    onIndexChange(next);
  }

  function go(dir: 1 | -1) {
    if (urls.length < 2) return;
    const next = index + dir;
    if (next < 0 || next >= urls.length) {
      setIndex((next + urls.length) % urls.length, false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
      return;
    }
    setIndex(next, true);
  }

  function onTouchStart(event: TouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null || urls.length < 2) return;
    const end = event.changedTouches[0]?.clientX;
    if (end == null) return;
    const delta = end - start;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) go(1);
    else go(-1);
  }

  if (!mounted || urls.length === 0) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex flex-col bg-black"
    >
      <header className="relative z-10 flex shrink-0 items-center justify-center px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white"
          aria-label="Cerrar"
        >
          <LuX className="h-6 w-6" />
        </button>
        <p id={titleId} className="text-sm font-medium text-white">
          {index + 1}/{urls.length}
        </p>
      </header>

      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full"
          style={{
            width: `${urls.length * 100}%`,
            transform: `translateX(-${(index / urls.length) * 100}%)`,
            transition: animate
              ? "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
          }}
        >
          {urls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="flex h-full shrink-0 items-center justify-center"
              style={{ width: `${100 / urls.length}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={alt}
                draggable={false}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          disabled
          className="w-full rounded-full bg-brand-orange py-3.5 text-center text-base font-semibold text-bg opacity-90"
        >
          {footerLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}

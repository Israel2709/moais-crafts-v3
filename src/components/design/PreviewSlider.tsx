"use client";

import { useRef, useState, type MouseEvent, type TouchEvent } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export function PreviewSlider({
  urls,
  alt,
  aspectClassName,
  imageClassName,
  emptyLabel = "Sin preview",
  showArrows = true,
  showCounter = true,
  index: controlledIndex,
  onIndexChange,
  onImageClick,
}: {
  urls: string[];
  alt: string;
  aspectClassName: string;
  imageClassName?: string;
  emptyLabel?: string;
  showArrows?: boolean;
  showCounter?: boolean;
  index?: number;
  onIndexChange?: (index: number) => void;
  onImageClick?: (index: number) => void;
}) {
  const [uncontrolledIndex, setUncontrolledIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchMoved = useRef(false);
  const index = controlledIndex ?? uncontrolledIndex;

  function setIndex(next: number, withAnimation: boolean) {
    setAnimate(withAnimation);
    if (controlledIndex == null) setUncontrolledIndex(next);
    onIndexChange?.(next);
  }

  if (urls.length === 0) {
    return (
      <div
        className={`relative flex items-center justify-center bg-bg-elevated text-sm text-text-muted ${aspectClassName}`}
      >
        {emptyLabel}
      </div>
    );
  }

  function go(dir: 1 | -1, event?: MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
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
    touchMoved.current = false;
  }

  function onTouchMove(event: TouchEvent) {
    const start = touchStartX.current;
    const x = event.changedTouches[0]?.clientX;
    if (start == null || x == null) return;
    if (Math.abs(x - start) > 12) touchMoved.current = true;
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

  function handleSurfaceClick(event: MouseEvent) {
    if (touchMoved.current) return;
    if ((event.target as HTMLElement).closest("button")) return;
    onImageClick?.(index);
  }

  return (
    <div
      className={`relative overflow-hidden bg-bg-elevated ${aspectClassName} ${
        onImageClick ? "cursor-zoom-in" : ""
      }`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleSurfaceClick}
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
            className="h-full shrink-0"
            style={{ width: `${100 / urls.length}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={alt}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              className={imageClassName ?? "h-full w-full object-cover"}
            />
          </div>
        ))}
      </div>

      {urls.length > 1 ? (
        <>
          {showArrows ? (
            <>
              <button
                type="button"
                onClick={(event) => go(-1, event)}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-bg-panel/90 p-1.5 text-brand-cream"
                aria-label="Imagen anterior"
              >
                <LuChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(event) => go(1, event)}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-bg-panel/90 p-1.5 text-brand-cream"
                aria-label="Imagen siguiente"
              >
                <LuChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}
          {showCounter ? (
            <p className="absolute bottom-2 right-2 z-10 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] text-brand-cream">
              {index + 1}/{urls.length}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

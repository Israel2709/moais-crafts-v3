"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DesignFolderResultCard } from "@/components/explore/DesignFolderResultCard";
import type { DesignFolderHit } from "@/lib/types/design";

const PAGE_SIZE = 24;
const ROW_ESTIMATE_PX = 340;
const GAP_PX = 12;

function useColumnCount(layout: "mobile" | "desktop") {
  const [cols, setCols] = useState(layout === "mobile" ? 1 : 2);

  useEffect(() => {
    function update() {
      if (layout === "mobile") {
        setCols(window.innerWidth >= 640 ? 2 : 1);
        return;
      }
      const width = window.innerWidth;
      if (width >= 1280) setCols(4);
      else if (width >= 1024) setCols(3);
      else setCols(2);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [layout]);

  return cols;
}

function SearchPagination({
  page,
  pageCount,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
      <p className="text-xs text-text-muted">
        {from}–{to} de {total}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs text-text-muted">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onChange(page + 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SearchResultsGrid({
  items,
  selectedId,
  onAdd,
  layout,
  emptyLabel = "Sin coincidencias.",
  loading = false,
}: {
  items: DesignFolderHit[];
  selectedId?: string | null;
  onAdd: (hit: DesignFolderHit) => void;
  layout: "mobile" | "desktop";
  emptyLabel?: string;
  loading?: boolean;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(layout);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [items]);

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, safePage]);

  const rowCount = Math.ceil(pageItems.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE_PX + GAP_PX,
    overscan: 1,
  });

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [safePage, columns]);

  if (!loading && items.length === 0) {
    return <p className="mt-4 text-sm text-text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const start = virtualRow.index * columns;
            const rowItems = pageItems.slice(start, start + columns);
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  paddingBottom: GAP_PX,
                }}
              >
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                >
                  {rowItems.map((hit) => (
                    <DesignFolderResultCard
                      key={hit.id}
                      hit={hit}
                      selected={selectedId === hit.id}
                      onAdd={() => onAdd(hit)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SearchPagination
        page={safePage}
        pageCount={pageCount}
        total={items.length}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />
    </div>
  );
}

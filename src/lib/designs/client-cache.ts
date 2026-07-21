import type { Design } from "@/lib/types/design";

const cache = new Map<string, Design>();

export function cacheDesign(design: Design) {
  cache.set(design.id, design);
}

export function cacheDesigns(designs: Design[]) {
  for (const design of designs) cache.set(design.id, design);
}

export function getCachedDesign(id: string): Design | undefined {
  return cache.get(id);
}

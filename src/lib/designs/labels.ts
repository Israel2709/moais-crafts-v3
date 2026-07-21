import { labelFromSlug } from "@/lib/designs/slugify";
import { DEFAULT_TAXONOMIES } from "@/lib/designs/taxonomy";
import type { TaxonomyTerm } from "@/lib/types/design";

/** Prefer known default labels (with accents), else prettify the slug. */
export function resolveTermLabel(slug: string): string {
  if (!slug) return "";
  const pools: TaxonomyTerm[][] = [
    DEFAULT_TAXONOMIES.categories,
    DEFAULT_TAXONOMIES.seasons,
    DEFAULT_TAXONOMIES.franchises,
  ];
  for (const list of pools) {
    const found = list.find((term) => term.slug === slug);
    if (found) return found.label;
  }
  return labelFromSlug(slug);
}

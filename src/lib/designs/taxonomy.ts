import type { Taxonomies, TaxonomyTerm } from "@/lib/types/design";
import { labelFromSlug, slugify } from "@/lib/designs/slugify";

export const DEFAULT_TAXONOMIES: Taxonomies = {
  categories: [
    { slug: "juguetes", label: "Juguetes" },
    { slug: "decoracion", label: "Decoración" },
    { slug: "llaveros", label: "Llaveros" },
    { slug: "organizacion", label: "Organización" },
    { slug: "otros", label: "Otros" },
  ],
  seasons: [
    { slug: "todo-el-ano", label: "Todo el año" },
    { slug: "navidad", label: "Navidad" },
    { slug: "dia-del-padre", label: "Día del padre" },
    { slug: "dia-de-la-madre", label: "Día de la madre" },
    { slug: "halloween", label: "Halloween" },
    { slug: "san-valentin", label: "San Valentín" },
  ],
  franchises: [{ slug: "sin-franquicia", label: "Sin franquicia" }],
  tags: [
    "caja",
    "libro",
    "libreta",
    "adorno",
    "accesorio",
    "celta",
    "llavero",
    "organizador",
    "marco",
    "figura",
  ],
};

function knownLabel(
  slug: string,
  defaults: TaxonomyTerm[],
): string | undefined {
  return defaults.find((term) => term.slug === slug)?.label;
}

/** Accept legacy string[] or {slug,label}[] and normalize. */
export function normalizeTaxonomyList(
  raw: unknown,
  defaults: TaxonomyTerm[],
): TaxonomyTerm[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaults;
  }

  const terms: TaxonomyTerm[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    let slug = "";
    let label = "";

    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) continue;
      slug = slugify(trimmed) || trimmed.toLowerCase();
      label =
        knownLabel(slug, defaults) ??
        (trimmed === slug || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)
          ? labelFromSlug(slug)
          : trimmed);
    } else if (item && typeof item === "object") {
      const record = item as { slug?: unknown; label?: unknown };
      const rawSlug = typeof record.slug === "string" ? record.slug.trim() : "";
      const rawLabel =
        typeof record.label === "string" ? record.label.trim() : "";
      slug = slugify(rawSlug || rawLabel);
      label =
        rawLabel || knownLabel(slug, defaults) || labelFromSlug(slug);
    }

    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    terms.push({ slug, label });
  }

  return terms.length > 0
    ? terms.sort((a, b) => a.label.localeCompare(b.label, "es"))
    : defaults;
}

export function normalizeTagCatalog(
  raw: unknown,
  defaults: string[] = DEFAULT_TAXONOMIES.tags,
): string[] {
  if (!Array.isArray(raw)) {
    return [...defaults].sort((a, b) => a.localeCompare(b, "es"));
  }

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of raw) {
    const cleaned =
      typeof item === "string"
        ? item.trim().toLowerCase()
        : item &&
            typeof item === "object" &&
            typeof (item as { label?: unknown }).label === "string"
          ? String((item as { label: string }).label)
              .trim()
              .toLowerCase()
          : item &&
              typeof item === "object" &&
              typeof (item as { slug?: unknown }).slug === "string"
            ? String((item as { slug: string }).slug)
                .trim()
                .toLowerCase()
            : "";
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    tags.push(cleaned);
  }

  if (tags.length === 0) {
    return [...defaults].sort((a, b) => a.localeCompare(b, "es"));
  }
  return tags.sort((a, b) => a.localeCompare(b, "es"));
}

export function normalizeTaxonomies(data: {
  categories?: unknown;
  seasons?: unknown;
  franchises?: unknown;
  tags?: unknown;
}): Taxonomies {
  return {
    categories: normalizeTaxonomyList(
      data.categories,
      DEFAULT_TAXONOMIES.categories,
    ),
    seasons: normalizeTaxonomyList(data.seasons, DEFAULT_TAXONOMIES.seasons),
    franchises: normalizeTaxonomyList(
      data.franchises,
      DEFAULT_TAXONOMIES.franchises,
    ),
    tags: normalizeTagCatalog(data.tags, DEFAULT_TAXONOMIES.tags),
  };
}

function isLegacyTermList(list: unknown): boolean {
  if (!Array.isArray(list) || list.length === 0) return true;
  return list.some((item) => {
    if (typeof item === "string") return true;
    if (!item || typeof item !== "object") return true;
    const record = item as { slug?: unknown; label?: unknown };
    return typeof record.slug !== "string" || typeof record.label !== "string";
  });
}

export function taxonomiesNeedRewrite(raw: {
  categories?: unknown;
  seasons?: unknown;
  franchises?: unknown;
  tags?: unknown;
}): boolean {
  if (
    isLegacyTermList(raw.categories) ||
    isLegacyTermList(raw.seasons) ||
    isLegacyTermList(raw.franchises)
  ) {
    return true;
  }
  // Tags catalog missing or never migrated
  if (!Array.isArray(raw.tags)) return true;
  return false;
}

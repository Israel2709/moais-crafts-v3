import {
  FieldValue,
  type DocumentData,
} from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getAdminDb } from "@/lib/firebase/server";
import { slugify } from "@/lib/designs/slugify";
import { getDesignById } from "@/lib/designs/service";
import type { Design } from "@/lib/types/design";
import type {
  SalesCatalog,
  SalesCatalogStatus,
} from "@/lib/types/sales-catalog";

function mapSalesCatalog(id: string, data: DocumentData): SalesCatalog {
  return {
    id,
    name: data.name ?? "",
    slug: data.slug ?? id,
    description: data.description ?? "",
    status: (data.status as SalesCatalogStatus) ?? "draft",
    designIds: Array.isArray(data.designIds) ? data.designIds : [],
    createdAt:
      data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? "",
    updatedAt:
      data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? "",
  };
}

export async function listSalesCatalogs(options?: {
  status?: SalesCatalogStatus;
  q?: string;
}): Promise<SalesCatalog[]> {
  const db = getAdminDb();
  let query = db.collection(COLLECTIONS.salesCatalogs);
  const snap = options?.status
    ? await query.where("status", "==", options.status).get()
    : await query.get();

  let catalogs = snap.docs.map((doc) => mapSalesCatalog(doc.id, doc.data()));
  const q = options?.q?.trim().toLowerCase();
  if (q) {
    catalogs = catalogs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }
  return catalogs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSalesCatalogById(
  id: string,
): Promise<SalesCatalog | null> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.salesCatalogs).doc(id).get();
  if (!snap.exists) return null;
  return mapSalesCatalog(snap.id, snap.data()!);
}

export async function getSalesCatalogBySlug(
  slug: string,
): Promise<SalesCatalog | null> {
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.salesCatalogs)
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return mapSalesCatalog(doc.id, doc.data());
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "catalogo";
  let candidate = root;
  let n = 2;
  while (true) {
    const existing = await getSalesCatalogBySlug(candidate);
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
}

export async function createSalesCatalog(input: {
  name: string;
  description?: string;
  status?: SalesCatalogStatus;
  designIds?: string[];
}): Promise<SalesCatalog> {
  const name = input.name.trim();
  if (!name) throw new Error("El nombre es obligatorio");

  const slug = await ensureUniqueSlug(name);
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.salesCatalogs).doc();
  const now = FieldValue.serverTimestamp();
  const designIds = Array.from(new Set(input.designIds ?? []));

  await ref.set({
    name,
    slug,
    description: input.description?.trim() ?? "",
    status: input.status ?? "published",
    designIds,
    createdAt: now,
    updatedAt: now,
  });

  const created = await getSalesCatalogById(ref.id);
  if (!created) throw new Error("Failed to read created sales catalog");
  return created;
}

export async function updateSalesCatalog(
  id: string,
  patch: Partial<
    Pick<SalesCatalog, "name" | "description" | "status" | "designIds" | "slug">
  >,
): Promise<SalesCatalog> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.salesCatalogs).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Catálogo no encontrado");

  const next: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new Error("El nombre es obligatorio");
    next.name = name;
  }
  if (patch.description !== undefined) {
    next.description = patch.description.trim();
  }
  if (patch.status !== undefined) {
    next.status = patch.status;
  }
  if (patch.designIds !== undefined) {
    next.designIds = Array.from(new Set(patch.designIds));
  }
  if (patch.slug !== undefined) {
    const slug = await ensureUniqueSlug(patch.slug, id);
    next.slug = slug;
  }

  await ref.update(next);
  const updated = await getSalesCatalogById(id);
  if (!updated) throw new Error("Catálogo no encontrado tras actualizar");
  return updated;
}

export async function deleteSalesCatalog(id: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.salesCatalogs).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Catálogo no encontrado");
  await ref.delete();
}

/** Append design IDs to catalogs (idempotent, preserves existing order). */
export async function addDesignsToSalesCatalogs(
  catalogIds: string[],
  designIds: string[],
): Promise<SalesCatalog[]> {
  const uniqueCatalogIds = Array.from(new Set(catalogIds.filter(Boolean)));
  const uniqueDesignIds = Array.from(new Set(designIds.filter(Boolean)));
  if (uniqueCatalogIds.length === 0) {
    throw new Error("Selecciona al menos un catálogo");
  }
  if (uniqueDesignIds.length === 0) {
    throw new Error("Selecciona al menos un diseño");
  }

  const updated: SalesCatalog[] = [];
  for (const catalogId of uniqueCatalogIds) {
    const catalog = await getSalesCatalogById(catalogId);
    if (!catalog) throw new Error(`Catálogo no encontrado: ${catalogId}`);
    const merged = [...catalog.designIds];
    for (const designId of uniqueDesignIds) {
      if (!merged.includes(designId)) merged.push(designId);
    }
    updated.push(
      await updateSalesCatalog(catalogId, { designIds: merged }),
    );
  }
  return updated;
}

export async function isDesignInPublishedCatalog(
  designId: string,
): Promise<boolean> {
  const published = await listSalesCatalogs({ status: "published" });
  return published.some((c) => c.designIds.includes(designId));
}

export async function getDesignsForSalesCatalog(
  catalog: SalesCatalog,
): Promise<Design[]> {
  const designs: Design[] = [];
  for (const id of catalog.designIds) {
    const design = await getDesignById(id);
    if (design) designs.push(design);
  }
  return designs;
}

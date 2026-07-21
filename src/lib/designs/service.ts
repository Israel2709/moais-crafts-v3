import {
  FieldValue,
  type DocumentData,
} from "firebase-admin/firestore";
import {
  COLLECTIONS,
  DEFAULT_TAXONOMIES,
  STORAGE_PREFIX,
  TAXONOMIES_DOC_ID,
} from "@/lib/firebase/collections";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/server";
import { downloadDriveFile, getDriveFileMeta, listDriveChildren } from "@/lib/drive/client";
import {
  isDesignDriveFile,
  isImageDriveFile,
} from "@/lib/drive/design-files";
import { slugify } from "@/lib/designs/slugify";
import {
  normalizeTaxonomies,
  taxonomiesNeedRewrite,
} from "@/lib/designs/taxonomy";
import type {
  Design,
  Taxonomies,
  TaxonomyTerm,
} from "@/lib/types/design";

function mapDesign(id: string, data: DocumentData): Design {
  return {
    id,
    title: data.title ?? "",
    category: data.category ?? "",
    season: data.season ?? "",
    franchise: data.franchise ?? "",
    tags: data.tags ?? [],
    factoryPrice:
      typeof data.factoryPrice === "number" ? data.factoryPrice : null,
    suggestedPrice:
      typeof data.suggestedPrice === "number" ? data.suggestedPrice : null,
    fabricationTime: data.fabricationTime ?? "",
    driveLocation: data.driveLocation ?? data.source?.drivePath ?? "",
    previewUrls: data.previewUrls ?? [],
    fileUrls: data.fileUrls ?? [],
    previewPaths: data.previewPaths ?? [],
    filePaths: data.filePaths ?? [],
    source: data.source ?? null,
    notes: data.notes ?? "",
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? "",
  };
}

export async function ensureTaxonomies(): Promise<Taxonomies> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.taxonomies).doc(TAXONOMIES_DOC_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set(DEFAULT_TAXONOMIES);
    return DEFAULT_TAXONOMIES;
  }

  const data = snap.data() ?? {};
  const normalized = normalizeTaxonomies(data);

  if (taxonomiesNeedRewrite(data)) {
    await ref.set(normalized);
  }

  return normalized;
}

export async function addTaxonomyValue(
  field: "categories" | "seasons" | "tags",
  rawLabel: string,
): Promise<{ taxonomies: Taxonomies; term: TaxonomyTerm | { slug: string; label: string } }> {
  const label = rawLabel.trim();
  if (!label) {
    throw new Error("El valor no puede estar vacío");
  }

  if (field === "tags") {
    const tag = label.toLowerCase();
    const current = await ensureTaxonomies();
    if (current.tags.includes(tag)) {
      return {
        taxonomies: current,
        term: { slug: tag, label: tag },
      };
    }
    const next: Taxonomies = {
      ...current,
      tags: [...current.tags, tag].sort((a, b) => a.localeCompare(b, "es")),
    };
    const db = getAdminDb();
    await db.collection(COLLECTIONS.taxonomies).doc(TAXONOMIES_DOC_ID).set(next, {
      merge: true,
    });
    return { taxonomies: next, term: { slug: tag, label: tag } };
  }

  const slug = slugify(label);
  if (!slug) {
    throw new Error("No se pudo generar un identificador válido");
  }

  const current = await ensureTaxonomies();
  const list = current[field];
  const existing = list.find((item) => item.slug === slug);
  if (existing) {
    return { taxonomies: current, term: existing };
  }

  const term: TaxonomyTerm = { slug, label };
  const next: Taxonomies = {
    ...current,
    [field]: [...list, term].sort((a, b) =>
      a.label.localeCompare(b.label, "es"),
    ),
  };

  const db = getAdminDb();
  await db.collection(COLLECTIONS.taxonomies).doc(TAXONOMIES_DOC_ID).set(next, {
    merge: true,
  });
  return { taxonomies: next, term };
}

/** Register many tags into the shared catalog (idempotent). */
export async function ensureTagsInCatalog(tags: string[]): Promise<Taxonomies> {
  const cleaned = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  if (cleaned.length === 0) {
    return ensureTaxonomies();
  }

  const current = await ensureTaxonomies();
  const seen = new Set(current.tags);
  let changed = false;
  const nextTags = [...current.tags];
  for (const tag of cleaned) {
    if (seen.has(tag)) continue;
    seen.add(tag);
    nextTags.push(tag);
    changed = true;
  }
  if (!changed) return current;

  const next: Taxonomies = {
    ...current,
    tags: nextTags.sort((a, b) => a.localeCompare(b, "es")),
  };
  const db = getAdminDb();
  await db.collection(COLLECTIONS.taxonomies).doc(TAXONOMIES_DOC_ID).set(next, {
    merge: true,
  });
  return next;
}

export async function listDesigns(): Promise<Design[]> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.designs).get();
  const designs = snap.docs.map((doc) => mapDesign(doc.id, doc.data()));
  return designs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDesignById(id: string): Promise<Design | null> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.designs).doc(id).get();
  if (!snap.exists) {
    return null;
  }
  return mapDesign(snap.id, snap.data()!);
}

export async function findDesignByDriveFileId(
  driveFileId: string,
): Promise<Design | null> {
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.designs)
    .where("source.driveFileId", "==", driveFileId)
    .limit(1)
    .get();
  if (snap.empty) {
    return null;
  }
  const doc = snap.docs[0];
  return mapDesign(doc.id, doc.data());
}

async function uploadBuffer(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ path: string; url: string }> {
  const bucket = getAdminStorage().bucket();
  const file = bucket.file(storagePath);
  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });
  await file.makePublic().catch(() => undefined);
  const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  return { path: storagePath, url };
}

function isImageMime(mime: string) {
  return mime.startsWith("image/");
}

export async function createDesignFromDrive(input: {
  driveFileId: string;
  title: string;
  category: string;
  season: string;
  franchise?: string;
  tags?: string[];
  factoryPrice?: number | null;
  suggestedPrice?: number | null;
  fabricationTime?: string;
  driveLocation?: string;
  notes?: string;
}): Promise<Design> {
  const existing = await findDesignByDriveFileId(input.driveFileId);
  if (existing) {
    return existing;
  }

  const meta = await getDriveFileMeta(input.driveFileId);
  const downloaded = await downloadDriveFile(input.driveFileId);

  const db = getAdminDb();
  const docRef = db.collection(COLLECTIONS.designs).doc();
  const designId = docRef.id;

  const safeName = downloaded.name.replace(/[^\w.\-]+/g, "_");
  const filePath = `${STORAGE_PREFIX}/${designId}/files/${safeName}`;
  const uploaded = await uploadBuffer(
    filePath,
    downloaded.buffer,
    downloaded.mimeType,
  );

  const previewPaths: string[] = [];
  const previewUrls: string[] = [];

  if (isImageMime(downloaded.mimeType)) {
    const previewPath = `${STORAGE_PREFIX}/${designId}/previews/${safeName}`;
    const preview = await uploadBuffer(
      previewPath,
      downloaded.buffer,
      downloaded.mimeType,
    );
    previewPaths.push(preview.path);
    previewUrls.push(preview.url);
  }

  const now = FieldValue.serverTimestamp();
  const payload = {
    title: input.title || meta.name,
    category: input.category,
    season: input.season,
    franchise: input.franchise ?? "sin-franquicia",
    tags: input.tags ?? [],
    factoryPrice: input.factoryPrice ?? null,
    suggestedPrice: input.suggestedPrice ?? null,
    fabricationTime: input.fabricationTime ?? "",
    driveLocation: input.driveLocation ?? meta.name,
    previewUrls,
    fileUrls: [uploaded.url],
    previewPaths,
    filePaths: [uploaded.path],
    source: {
      driveFileId: meta.id,
      drivePath: input.driveLocation ?? meta.name,
      driveModifiedTime: meta.modifiedTime,
      mimeType: meta.mimeType,
      name: meta.name,
    },
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (input.tags?.length) {
    await ensureTagsInCatalog(input.tags);
  }

  await docRef.set(payload);
  const created = await getDesignById(designId);
  if (!created) {
    throw new Error("Failed to read created design");
  }
  return created;
}

export async function createDesignFromDriveFolder(input: {
  driveFolderId: string;
  title: string;
  category: string;
  season: string;
  franchise?: string;
  tags?: string[];
  factoryPrice?: number | null;
  suggestedPrice?: number | null;
  fabricationTime?: string;
  driveLocation?: string;
  drivePath?: string;
  notes?: string;
  extraPreviewFiles?: { buffer: Buffer; mimeType: string; name: string }[];
}): Promise<Design> {
  const existing = await findDesignByDriveFileId(input.driveFolderId);
  if (existing) {
    return existing;
  }

  const meta = await getDriveFileMeta(input.driveFolderId);
  if (!meta.isFolder) {
    throw new Error("El ID no corresponde a una carpeta de Drive");
  }

  const children = await listDriveChildren(input.driveFolderId);
  const images = children.filter(isImageDriveFile);
  const designs = children.filter(isDesignDriveFile);

  if (
    images.length === 0 &&
    (!input.extraPreviewFiles || input.extraPreviewFiles.length === 0)
  ) {
    throw new Error(
      "La carpeta debe contener al menos una imagen de muestra (o súbela en el formulario)",
    );
  }
  if (designs.length === 0) {
    throw new Error(
      "La carpeta debe contener al menos un archivo de diseño",
    );
  }

  const db = getAdminDb();
  const docRef = db.collection(COLLECTIONS.designs).doc();
  const designId = docRef.id;

  const previewPaths: string[] = [];
  const previewUrls: string[] = [];
  const filePaths: string[] = [];
  const fileUrls: string[] = [];

  for (const image of images) {
    const downloaded = await downloadDriveFile(image.id);
    const safeName = downloaded.name.replace(/[^\w.\-]+/g, "_");
    const previewPath = `${STORAGE_PREFIX}/${designId}/previews/${safeName}`;
    const preview = await uploadBuffer(
      previewPath,
      downloaded.buffer,
      downloaded.mimeType,
    );
    previewPaths.push(preview.path);
    previewUrls.push(preview.url);
  }

  for (const extra of input.extraPreviewFiles ?? []) {
    const safeName = extra.name.replace(/[^\w.\-]+/g, "_");
    const previewPath = `${STORAGE_PREFIX}/${designId}/previews/${safeName}`;
    const preview = await uploadBuffer(
      previewPath,
      extra.buffer,
      extra.mimeType,
    );
    previewPaths.push(preview.path);
    previewUrls.push(preview.url);
  }

  for (const design of designs) {
    const downloaded = await downloadDriveFile(design.id);
    const safeName = downloaded.name.replace(/[^\w.\-]+/g, "_");
    const filePath = `${STORAGE_PREFIX}/${designId}/files/${safeName}`;
    const uploaded = await uploadBuffer(
      filePath,
      downloaded.buffer,
      downloaded.mimeType,
    );
    filePaths.push(uploaded.path);
    fileUrls.push(uploaded.url);
  }

  const driveLocation =
    input.driveLocation ?? input.drivePath ?? meta.name;

  const now = FieldValue.serverTimestamp();
  const payload = {
    title: input.title || meta.name,
    category: input.category,
    season: input.season,
    franchise: input.franchise ?? "sin-franquicia",
    tags: input.tags ?? [],
    factoryPrice: input.factoryPrice ?? null,
    suggestedPrice: input.suggestedPrice ?? null,
    fabricationTime: input.fabricationTime ?? "",
    driveLocation,
    previewUrls,
    fileUrls,
    previewPaths,
    filePaths,
    source: {
      driveFileId: meta.id,
      drivePath: driveLocation,
      driveModifiedTime: meta.modifiedTime,
      mimeType: meta.mimeType,
      name: meta.name,
    },
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (input.tags?.length) {
    await ensureTagsInCatalog(input.tags);
  }

  await docRef.set(payload);
  const created = await getDesignById(designId);
  if (!created) {
    throw new Error("Failed to read created design");
  }
  return created;
}

export async function createDesignFromUpload(input: {
  title: string;
  category: string;
  season: string;
  franchise?: string;
  tags?: string[];
  factoryPrice?: number | null;
  suggestedPrice?: number | null;
  fabricationTime?: string;
  driveLocation?: string;
  notes?: string;
  previewFiles: { buffer: Buffer; mimeType: string; name: string }[];
  designFiles?: { buffer: Buffer; mimeType: string; name: string }[];
}): Promise<Design> {
  if (input.previewFiles.length === 0) {
    throw new Error("Agrega al menos una imagen de muestra");
  }

  const db = getAdminDb();
  const docRef = db.collection(COLLECTIONS.designs).doc();
  const designId = docRef.id;

  const previewPaths: string[] = [];
  const previewUrls: string[] = [];
  const filePaths: string[] = [];
  const fileUrls: string[] = [];

  for (const file of input.previewFiles) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const previewPath = `${STORAGE_PREFIX}/${designId}/previews/${safeName}`;
    const preview = await uploadBuffer(
      previewPath,
      file.buffer,
      file.mimeType,
    );
    previewPaths.push(preview.path);
    previewUrls.push(preview.url);
  }

  for (const file of input.designFiles ?? []) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const filePath = `${STORAGE_PREFIX}/${designId}/files/${safeName}`;
    const uploaded = await uploadBuffer(filePath, file.buffer, file.mimeType);
    filePaths.push(uploaded.path);
    fileUrls.push(uploaded.url);
  }

  const now = FieldValue.serverTimestamp();
  const payload = {
    title: input.title,
    category: input.category,
    season: input.season,
    franchise: input.franchise ?? "sin-franquicia",
    tags: input.tags ?? [],
    factoryPrice: input.factoryPrice ?? null,
    suggestedPrice: input.suggestedPrice ?? null,
    fabricationTime: input.fabricationTime ?? "",
    driveLocation: input.driveLocation ?? "",
    previewUrls,
    fileUrls,
    previewPaths,
    filePaths,
    source: null,
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (input.tags?.length) {
    await ensureTagsInCatalog(input.tags);
  }

  await docRef.set(payload);
  const created = await getDesignById(designId);
  if (!created) {
    throw new Error("Failed to read created design");
  }
  return created;
}

export async function updateDesign(
  id: string,
  patch: Partial<
    Pick<
      Design,
      | "title"
      | "category"
      | "season"
      | "franchise"
      | "tags"
      | "factoryPrice"
      | "suggestedPrice"
      | "fabricationTime"
      | "driveLocation"
      | "notes"
    >
  >,
): Promise<Design> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.designs).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Design not found");
  }
  await ref.update({
    ...patch,
    updatedAt: FieldValue.serverTimestamp(),
  });
  const updated = await getDesignById(id);
  if (!updated) {
    throw new Error("Design not found after update");
  }
  return updated;
}

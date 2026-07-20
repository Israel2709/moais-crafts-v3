import {
  FieldValue,
  type DocumentData,
  type Query,
} from "firebase-admin/firestore";
import {
  COLLECTIONS,
  DEFAULT_TAXONOMIES,
  STORAGE_PREFIX,
  TAXONOMIES_DOC_ID,
} from "@/lib/firebase/collections";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/server";
import { downloadDriveFile, getDriveFileMeta } from "@/lib/drive/client";
import type { Design, DesignStatus, Taxonomies } from "@/lib/types/design";

function mapDesign(id: string, data: DocumentData): Design {
  return {
    id,
    title: data.title ?? "",
    category: data.category ?? "",
    season: data.season ?? "",
    franchise: data.franchise ?? "",
    tags: data.tags ?? [],
    previewUrls: data.previewUrls ?? [],
    fileUrls: data.fileUrls ?? [],
    previewPaths: data.previewPaths ?? [],
    filePaths: data.filePaths ?? [],
    status: (data.status as DesignStatus) ?? "draft",
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
  return {
    categories: data.categories ?? DEFAULT_TAXONOMIES.categories,
    seasons: data.seasons ?? DEFAULT_TAXONOMIES.seasons,
    franchises: data.franchises ?? DEFAULT_TAXONOMIES.franchises,
  };
}

export async function listDesigns(options?: {
  status?: DesignStatus;
}): Promise<Design[]> {
  const db = getAdminDb();
  let query: Query = db.collection(COLLECTIONS.designs);
  if (options?.status) {
    query = query.where("status", "==", options.status);
  }
  const snap = await query.get();
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
  franchise: string;
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
    franchise: input.franchise,
    tags: [],
    previewUrls,
    fileUrls: [uploaded.url],
    previewPaths,
    filePaths: [uploaded.path],
    status: "draft" as DesignStatus,
    source: {
      driveFileId: meta.id,
      drivePath: meta.name,
      driveModifiedTime: meta.modifiedTime,
      mimeType: meta.mimeType,
      name: meta.name,
    },
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };

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
      | "notes"
      | "status"
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

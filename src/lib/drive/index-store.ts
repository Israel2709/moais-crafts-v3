import {
  FieldValue,
  type DocumentData,
} from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getAdminDb } from "@/lib/firebase/server";
import { nameMatchesQuery } from "@/lib/drive/design-files";
import type {
  DesignFolderHit,
  DesignKind,
  DriveIndexMeta,
} from "@/lib/types/design";

function packageDocId(kind: DesignKind, folderId: string) {
  return `${kind}__${folderId}`;
}

function mapHit(data: DocumentData): DesignFolderHit {
  return {
    id: data.id ?? "",
    name: data.name ?? "",
    path: data.path ?? "",
    webViewLink: data.webViewLink ?? null,
    previewFileIds: data.previewFileIds ?? [],
    designFiles: data.designFiles ?? [],
  };
}

function mapMeta(kind: DesignKind, data: DocumentData): DriveIndexMeta {
  return {
    kind,
    updatedAt:
      data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? "",
    scannedFolders: data.scannedFolders ?? 0,
    packageCount: data.packageCount ?? 0,
    sourceFolderIds: data.sourceFolderIds ?? [],
    sourceNames: data.sourceNames ?? [],
  };
}

export async function getDriveIndexMeta(
  kind: DesignKind,
): Promise<DriveIndexMeta | null> {
  const db = getAdminDb();
  const snap = await db.collection(COLLECTIONS.driveIndexMeta).doc(kind).get();
  if (!snap.exists) return null;
  return mapMeta(kind, snap.data()!);
}

export async function listIndexedDesignPackages(
  kind: DesignKind,
): Promise<DesignFolderHit[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.driveIndexPackages)
    .where("kind", "==", kind)
    .get();

  return snap.docs
    .map((doc) => mapHit(doc.data()))
    .sort((a, b) => a.path.localeCompare(b.path, "es"));
}

export async function searchIndexedDesignPackages(
  kind: DesignKind,
  query: string,
): Promise<DesignFolderHit[]> {
  const packages = await listIndexedDesignPackages(kind);
  return packages.filter((item) => nameMatchesQuery(item.name, query));
}

export async function replaceDriveIndex(input: {
  kind: DesignKind;
  packages: DesignFolderHit[];
  scannedFolders: number;
  sourceFolderIds: string[];
  sourceNames: string[];
}): Promise<DriveIndexMeta> {
  const db = getAdminDb();
  const existing = await db
    .collection(COLLECTIONS.driveIndexPackages)
    .where("kind", "==", input.kind)
    .get();

  // Delete old packages in batches of 400
  const oldDocs = existing.docs;
  for (let i = 0; i < oldDocs.length; i += 400) {
    const batch = db.batch();
    for (const doc of oldDocs.slice(i, i + 400)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }

  // Write new packages in batches of 400
  for (let i = 0; i < input.packages.length; i += 400) {
    const batch = db.batch();
    for (const pkg of input.packages.slice(i, i + 400)) {
      const ref = db
        .collection(COLLECTIONS.driveIndexPackages)
        .doc(packageDocId(input.kind, pkg.id));
      batch.set(ref, {
        kind: input.kind,
        id: pkg.id,
        name: pkg.name,
        nameLower: pkg.name.toLowerCase(),
        path: pkg.path,
        webViewLink: pkg.webViewLink,
        previewFileIds: pkg.previewFileIds,
        designFiles: pkg.designFiles,
      });
    }
    await batch.commit();
  }

  const metaRef = db.collection(COLLECTIONS.driveIndexMeta).doc(input.kind);
  await metaRef.set({
    kind: input.kind,
    scannedFolders: input.scannedFolders,
    packageCount: input.packages.length,
    sourceFolderIds: input.sourceFolderIds,
    sourceNames: input.sourceNames,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const snap = await metaRef.get();
  return mapMeta(input.kind, snap.data()!);
}

export function withStaleFlag(
  meta: DriveIndexMeta | null,
  currentSourceFolderIds: string[],
): DriveIndexMeta | null {
  if (!meta) return null;
  const indexed = [...meta.sourceFolderIds].sort().join("|");
  const current = [...currentSourceFolderIds].sort().join("|");
  return {
    ...meta,
    stale: indexed !== current,
  };
}

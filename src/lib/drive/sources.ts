import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { z } from "zod";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getAdminDb } from "@/lib/firebase/server";
import type { DesignKind, DriveLibrarySource } from "@/lib/types/design";
import { extractDriveFolderId } from "@/lib/drive/folder-id";

const createSchema = z.object({
  kind: z.enum(["laser", "3d"]),
  name: z.string().trim().min(1).max(120),
  folderId: z.string().trim().min(1).max(200),
});

function mapSource(id: string, data: DocumentData): DriveLibrarySource {
  return {
    id,
    kind: data.kind as DesignKind,
    name: data.name ?? "",
    folderId: data.folderId ?? "",
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? "",
  };
}

export async function listDriveLibrarySources(
  kind: DesignKind,
): Promise<DriveLibrarySource[]> {
  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.driveSources)
    .where("kind", "==", kind)
    .get();

  return snap.docs
    .map((doc) => mapSource(doc.id, doc.data()))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function createDriveLibrarySource(input: {
  kind: DesignKind;
  name: string;
  folderId: string;
}): Promise<DriveLibrarySource> {
  const parsed = createSchema.parse(input);
  const folderId = extractDriveFolderId(parsed.folderId);

  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.driveSources).doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    kind: parsed.kind,
    name: parsed.name,
    folderId,
    createdAt: now,
    updatedAt: now,
  });

  const snap = await ref.get();
  return mapSource(snap.id, snap.data()!);
}

export async function deleteDriveLibrarySource(id: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.driveSources).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Fuente no encontrada");
  }
  await ref.delete();
}

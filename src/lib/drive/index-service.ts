import { crawlDesignPackageFolders } from "@/lib/drive/client";
import {
  replaceDriveIndex,
  withStaleFlag,
  getDriveIndexMeta,
  searchIndexedDesignPackages,
} from "@/lib/drive/index-store";
import { listDriveLibrarySources } from "@/lib/drive/sources";
import type {
  DesignFolderHit,
  DesignKind,
  DesignSearchProgress,
  DriveIndexMeta,
} from "@/lib/types/design";

export async function getIndexStatus(
  kind: DesignKind,
): Promise<DriveIndexMeta | null> {
  const sources = await listDriveLibrarySources(kind);
  const meta = await getDriveIndexMeta(kind);
  return withStaleFlag(
    meta,
    sources.map((s) => s.folderId),
  );
}

export async function searchFromDriveIndex(
  kind: DesignKind,
  query: string,
): Promise<{
  items: DesignFolderHit[];
  meta: DriveIndexMeta | null;
  message?: string;
}> {
  const sources = await listDriveLibrarySources(kind);
  if (sources.length === 0) {
    return {
      items: [],
      meta: null,
      message: "No hay carpetas fuente registradas para esta sección.",
    };
  }

  const meta = withStaleFlag(
    await getDriveIndexMeta(kind),
    sources.map((s) => s.folderId),
  );

  if (!meta) {
    return {
      items: [],
      meta: null,
      message:
        "No hay índice todavía. Pulsa «Actualizar índice» para indexar Drive (solo la primera vez tarda).",
    };
  }

  const items = await searchIndexedDesignPackages(kind, query);
  return {
    items,
    meta,
    message: meta.stale
      ? "El índice no coincide con las carpetas fuente actuales. Conviene actualizarlo."
      : undefined,
  };
}

export async function rebuildDriveIndex(
  kind: DesignKind,
  options?: {
    onProgress?: (progress: DesignSearchProgress) => void | Promise<void>;
    onPackage?: (hit: DesignFolderHit) => void | Promise<void>;
  },
): Promise<{ meta: DriveIndexMeta; packages: DesignFolderHit[] }> {
  const sources = await listDriveLibrarySources(kind);
  if (sources.length === 0) {
    throw new Error("No hay carpetas fuente registradas para esta sección.");
  }

  const roots = sources.map((source) => ({
    folderId: source.folderId,
    name: source.name,
  }));

  const { packages, scannedFolders } = await crawlDesignPackageFolders(roots, {
    onProgress: options?.onProgress,
    onPackage: options?.onPackage,
  });

  const meta = await replaceDriveIndex({
    kind,
    packages,
    scannedFolders,
    sourceFolderIds: sources.map((s) => s.folderId),
    sourceNames: sources.map((s) => s.name),
  });

  return { meta: { ...meta, stale: false }, packages };
}

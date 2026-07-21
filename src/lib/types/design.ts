/** Catalog content kind — laser, 3D, amigurumis. */
export type DesignKind = "laser" | "3d" | "amigurumis";

/** A configured Drive folder root for a given kind (multiple allowed). */
export type DriveLibrarySource = {
  id: string;
  kind: DesignKind;
  name: string;
  folderId: string;
  createdAt: string;
  updatedAt: string;
};

export type DriveSource = {
  driveFileId: string;
  drivePath: string;
  driveModifiedTime: string | null;
  mimeType: string;
  name: string;
};

export type Design = {
  id: string;
  title: string;
  category: string;
  season: string;
  franchise: string;
  tags: string[];
  factoryPrice: number | null;
  suggestedPrice: number | null;
  fabricationTime: string;
  driveLocation: string;
  previewUrls: string[];
  fileUrls: string[];
  previewPaths: string[];
  filePaths: string[];
  source: DriveSource | null;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type TaxonomyTerm = {
  slug: string;
  label: string;
};

export type Taxonomies = {
  categories: TaxonomyTerm[];
  seasons: TaxonomyTerm[];
  franchises: TaxonomyTerm[];
  /** Catalog of reusable design tags (normalized lowercase). */
  tags: string[];
};

export type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: string | null;
  thumbnailLink: string | null;
  iconLink: string | null;
  webViewLink: string | null;
  isFolder: boolean;
  parents: string[];
};

/** Folder that matches a search and contains preview images + design files. */
export type DesignFolderHit = {
  id: string;
  name: string;
  path: string;
  webViewLink: string | null;
  previewFileIds: string[];
  designFiles: { id: string; name: string; mimeType: string }[];
};

/** Estimated BFS search progress: percent ≈ scanned / (scanned + queueLeft). */
export type DesignSearchProgress = {
  scanned: number;
  queueLeft: number;
  hits: number;
  percent: number;
  currentPath: string;
};

export type DesignSearchStreamEvent =
  | { type: "progress"; progress: DesignSearchProgress }
  | { type: "hit"; item: DesignFolderHit }
  | { type: "done"; items: DesignFolderHit[] }
  | { type: "message"; message: string }
  | { type: "error"; error: string };

/** Snapshot of design-package folders crawled from Drive for a kind. */
export type DriveIndexMeta = {
  kind: DesignKind;
  updatedAt: string;
  scannedFolders: number;
  packageCount: number;
  sourceFolderIds: string[];
  sourceNames: string[];
  stale?: boolean;
};

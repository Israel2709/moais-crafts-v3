export type DesignStatus = "draft" | "published";

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
  previewUrls: string[];
  fileUrls: string[];
  previewPaths: string[];
  filePaths: string[];
  status: DesignStatus;
  source: DriveSource | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Taxonomies = {
  categories: string[];
  seasons: string[];
  franchises: string[];
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

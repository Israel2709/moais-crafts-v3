import type { DriveItem } from "@/lib/types/design";

const DESIGN_EXTENSIONS = new Set([
  "zip",
  "rar",
  "7z",
  "svg",
  "ai",
  "eps",
  "dxf",
  "dwg",
  "pdf",
  "cdr",
  "plt",
  "stl",
  "3mf",
  "obj",
  "step",
  "stp",
  "iges",
  "igs",
]);

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "tif",
  "tiff",
]);

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1] ?? "";
}

export function isImageDriveFile(item: DriveItem): boolean {
  if (item.isFolder) return false;
  if (item.mimeType.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.has(extensionOf(item.name));
}

export function isDesignDriveFile(item: DriveItem): boolean {
  if (item.isFolder) return false;
  if (isImageDriveFile(item)) return false;
  const ext = extensionOf(item.name);
  if (DESIGN_EXTENSIONS.has(ext)) return true;
  // Common Adobe / vector mime types without clear extension
  return (
    item.mimeType.includes("postscript") ||
    item.mimeType.includes("illustrator") ||
    item.mimeType === "application/zip" ||
    item.mimeType === "application/x-zip-compressed" ||
    item.mimeType === "application/pdf"
  );
}

export function isDesignPackageFolder(
  images: DriveItem[],
  designs: DriveItem[],
): boolean {
  return images.length > 0 && designs.length > 0;
}

export function nameMatchesQuery(name: string, query: string): boolean {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

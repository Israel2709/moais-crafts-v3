/** Firestore / Storage isolation prefixes inside raziel-app-hub */
export const COLLECTIONS = {
  designs: "moaisCatalog_designs",
  salesCatalogs: "moaisCatalog_salesCatalogs",
  taxonomies: "moaisCatalog_taxonomies",
  admins: "moaisCatalog_admins",
  driveSources: "moaisCatalog_driveSources",
  driveIndexMeta: "moaisCatalog_driveIndexMeta",
  driveIndexPackages: "moaisCatalog_driveIndexPackages",
} as const;

export const STORAGE_PREFIX = "moais-catalog";

export const TAXONOMIES_DOC_ID = "default";

export { DEFAULT_TAXONOMIES } from "@/lib/designs/taxonomy";

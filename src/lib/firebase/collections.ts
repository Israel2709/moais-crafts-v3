/** Firestore / Storage isolation prefixes inside raziel-app-hub */
export const COLLECTIONS = {
  designs: "moaisCatalog_designs",
  taxonomies: "moaisCatalog_taxonomies",
  admins: "moaisCatalog_admins",
  driveSources: "moaisCatalog_driveSources",
} as const;

export const STORAGE_PREFIX = "moais-catalog";

export const TAXONOMIES_DOC_ID = "default";

export const DEFAULT_TAXONOMIES = {
  categories: ["juguetes", "decoracion", "llaveros", "organizacion", "otros"],
  seasons: ["todo-el-ano", "navidad", "dia-del-padre", "dia-de-la-madre", "halloween", "san-valentin"],
  franchises: ["sin-franquicia"],
};

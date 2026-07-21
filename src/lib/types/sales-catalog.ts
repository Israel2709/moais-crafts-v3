export type SalesCatalogStatus = "draft" | "published";

/** Curated collection of designs shown to sellers when published. */
export type SalesCatalog = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: SalesCatalogStatus;
  designIds: string[];
  createdAt: string;
  updatedAt: string;
};

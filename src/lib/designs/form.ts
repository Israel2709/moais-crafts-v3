export type DesignFormValues = {
  title: string;
  category: string;
  season: string;
  tags: string[];
  factoryPrice: string;
  suggestedPrice: string;
  fabricationTime: string;
  driveLocation: string;
  notes: string;
};

export const EMPTY_DESIGN_FORM: DesignFormValues = {
  title: "",
  category: "otros",
  season: "todo-el-ano",
  tags: [],
  factoryPrice: "",
  suggestedPrice: "",
  fabricationTime: "",
  driveLocation: "",
  notes: "",
};

export function parseOptionalPrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Precio inválido");
  }
  return value;
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const cleaned = tag.trim().toLowerCase();
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    result.push(cleaned);
    if (result.length >= 10) break;
  }
  return result;
}

export function normalizeSingleTag(raw: string): string {
  return raw.trim().toLowerCase();
}

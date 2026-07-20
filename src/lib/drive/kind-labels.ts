import type { DesignKind } from "@/lib/types/design";

export const KIND_LABELS: Record<DesignKind, string> = {
  laser: "Archivos laser",
  "3d": "Archivos 3D",
  amigurumis: "Amigurumis",
};

export const KIND_DESCRIPTIONS: Record<DesignKind, string> = {
  laser:
    "Fuentes de Drive con diseños para corte láser. Puedes agregar varias carpetas.",
  "3d":
    "Fuentes de Drive con archivos 3D (STL, etc.). Puedes agregar varias carpetas.",
  amigurumis:
    "Fuentes de Drive con patrones y archivos de amigurumis. Puedes agregar varias carpetas.",
};

export const KIND_ROUTES: Record<DesignKind, `/${DesignKind}`> = {
  laser: "/laser",
  "3d": "/3d",
  amigurumis: "/amigurumis",
};

export const DESIGN_KINDS = ["laser", "3d", "amigurumis"] as const satisfies readonly DesignKind[];

export function kindFromPathname(pathname: string): DesignKind {
  if (pathname.startsWith("/3d")) return "3d";
  if (pathname.startsWith("/amigurumis")) return "amigurumis";
  return "laser";
}

import { NextRequest } from "next/server";
import { z } from "zod";
import { searchDriveFiles } from "@/lib/drive/client";
import { listDriveLibrarySources } from "@/lib/drive/sources";
import { DESIGN_KINDS } from "@/lib/drive/kind-labels";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";

const kindSchema = z.enum(DESIGN_KINDS);

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) {
      return Response.json({ items: [] });
    }

    const kind = kindSchema.parse(request.nextUrl.searchParams.get("kind"));
    const sources = await listDriveLibrarySources(kind);
    const rootFolderIds = sources.map((source) => source.folderId);

    if (rootFolderIds.length === 0) {
      return Response.json({
        items: [],
        message: "No hay carpetas fuente registradas para esta sección.",
      });
    }

    const items = await searchDriveFiles(q, { rootFolderIds });
    return Response.json({ items });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Query kind=laser|3d|amigurumis is required" },
        { status: 400 },
      );
    }
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

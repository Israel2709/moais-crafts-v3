import { NextRequest } from "next/server";
import { z } from "zod";
import { searchFromDriveIndex } from "@/lib/drive/index-service";
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
      return Response.json({ items: [], fromIndex: true });
    }

    const kind = kindSchema.parse(request.nextUrl.searchParams.get("kind"));
    const result = await searchFromDriveIndex(kind, q);

    return Response.json({
      items: result.items,
      fromIndex: true,
      meta: result.meta,
      message: result.message,
    });
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

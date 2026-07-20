import { NextRequest } from "next/server";
import { z } from "zod";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";
import {
  createDriveLibrarySource,
  listDriveLibrarySources,
} from "@/lib/drive/sources";
import type { DesignKind } from "@/lib/types/design";
import { DESIGN_KINDS } from "@/lib/drive/kind-labels";

const kindSchema = z.enum(DESIGN_KINDS);

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const kindParam = request.nextUrl.searchParams.get("kind");
    const kind = kindSchema.parse(kindParam);
    const sources = await listDriveLibrarySources(kind as DesignKind);
    return Response.json({ sources });
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

export async function POST(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const body = await request.json();
    const source = await createDriveLibrarySource(body);
    return Response.json({ source }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "Invalid" }, {
        status: 400,
      });
    }
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

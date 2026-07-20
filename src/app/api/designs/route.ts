import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/admin-secret";
import { ensureTaxonomies, listDesigns } from "@/lib/designs/service";
import type { DesignStatus } from "@/lib/types/design";

export async function GET(request: NextRequest) {
  try {
    const statusParam = request.nextUrl.searchParams.get("status");
    const publishedOnly = statusParam === "published";

    if (!publishedOnly) {
      await assertAdminRequest(request);
    }

    await ensureTaxonomies();
    const designs = await listDesigns(
      publishedOnly ? { status: "published" satisfies DesignStatus } : undefined,
    );
    return Response.json({ designs });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";
import { ensureTaxonomies } from "@/lib/designs/service";

export async function GET(request: NextRequest) {
  try {
    // Taxonomies are readable for catalog filters; seed requires admin if missing admin SDK
    try {
      const taxonomies = await ensureTaxonomies();
      return Response.json({ taxonomies });
    } catch {
      await assertAdminRequest(request);
      const taxonomies = await ensureTaxonomies();
      return Response.json({ taxonomies });
    }
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";
import { ensureTaxonomies, listDesigns } from "@/lib/designs/service";

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    await ensureTaxonomies();
    const designs = await listDesigns();
    return Response.json({ designs });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

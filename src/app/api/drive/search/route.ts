import { NextRequest } from "next/server";
import { searchDriveFiles } from "@/lib/drive/client";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/admin-secret";

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) {
      return Response.json({ items: [] });
    }
    const items = await searchDriveFiles(q);
    return Response.json({ items });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

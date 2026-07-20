import { NextRequest } from "next/server";
import { listDriveChildren } from "@/lib/drive/client";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const folderId =
      request.nextUrl.searchParams.get("folderId") ||
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ||
      "root";
    const items = await listDriveChildren(folderId);
    return Response.json({ folderId, items });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

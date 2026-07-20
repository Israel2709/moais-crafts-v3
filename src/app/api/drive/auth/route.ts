import { NextRequest } from "next/server";
import { getDriveAuthUrl } from "@/lib/drive/client";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/admin-secret";

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const url = getDriveAuthUrl();
    return Response.redirect(url);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

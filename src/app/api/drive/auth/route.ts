import { NextRequest } from "next/server";
import { getDriveAuthUrl } from "@/lib/drive/client";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";

function resolveReturnPath(request: NextRequest): "/laser" | "/3d" {
  const explicit = request.nextUrl.searchParams.get("return");
  if (explicit === "/3d" || explicit === "/laser") {
    return explicit;
  }
  const referer = request.headers.get("referer") ?? "";
  if (referer.includes("/3d")) {
    return "/3d";
  }
  return "/laser";
}

export async function GET(request: NextRequest) {
  try {
    await assertAdminRequest(request);
    const url = getDriveAuthUrl(resolveReturnPath(request));
    return Response.redirect(url);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

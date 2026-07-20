import { NextRequest } from "next/server";
import { getDriveAuthUrl } from "@/lib/drive/client";
import { KIND_ROUTES, kindFromPathname } from "@/lib/drive/kind-labels";
import type { DesignKind } from "@/lib/types/design";
import {
  AdminAuthError,
  adminErrorResponse,
  assertAdminRequest,
} from "@/lib/auth/session";

function resolveReturnPath(request: NextRequest): `/${DesignKind}` {
  const explicit = request.nextUrl.searchParams.get("return");
  if (
    explicit === "/3d" ||
    explicit === "/laser" ||
    explicit === "/amigurumis"
  ) {
    return explicit;
  }
  const referer = request.headers.get("referer") ?? "";
  try {
    const path = new URL(referer).pathname;
    return KIND_ROUTES[kindFromPathname(path)];
  } catch {
    return "/laser";
  }
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

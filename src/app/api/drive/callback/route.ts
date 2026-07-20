import { NextRequest } from "next/server";
import { exchangeCodeForTokens } from "@/lib/drive/client";
import { adminErrorResponse } from "@/lib/auth/session";

/** OAuth callback must be reachable without admin header (Google redirect). */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return Response.json({ error: "Missing code" }, { status: 400 });
    }
    const tokens = await exchangeCodeForTokens(code);
    void tokens;
    const next = request.nextUrl.searchParams.get("state") || "/3d";
    const safeNext =
      next.startsWith("/") && !next.startsWith("//") ? next : "/3d";
    return Response.redirect(
      new URL(`${safeNext}?drive=connected`, request.url),
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

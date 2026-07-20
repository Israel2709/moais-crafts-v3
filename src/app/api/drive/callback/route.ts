import { NextRequest } from "next/server";
import { exchangeCodeForTokens } from "@/lib/drive/client";
import { adminErrorResponse } from "@/lib/admin-secret";

/** OAuth callback must be reachable without admin header (Google redirect). */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return Response.json({ error: "Missing code" }, { status: 400 });
    }
    const tokens = await exchangeCodeForTokens(code);
    void tokens;
    return Response.redirect(new URL("/explore?drive=connected", request.url));
  } catch (error) {
    return adminErrorResponse(error);
  }
}

import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  clearAdminSessionCookie,
  createAdminSessionCookie,
  readAdminSession,
  setAdminSessionCookie,
} from "@/lib/auth/session";

export async function GET() {
  const user = await readAdminSession();
  return Response.json({
    authenticated: Boolean(user),
    user,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { idToken?: string };
    if (!body.idToken) {
      return Response.json({ error: "idToken required" }, { status: 400 });
    }

    const { sessionCookie, user } = await createAdminSessionCookie(body.idToken);
    await setAdminSessionCookie(sessionCookie);
    return Response.json({ ok: true, user });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    await clearAdminSessionCookie();
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return adminErrorResponse(error);
    }
    return adminErrorResponse(error);
  }
}

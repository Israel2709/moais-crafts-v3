import { NextRequest } from "next/server";
import {
  AdminAuthError,
  adminErrorResponse,
  clearAdminSessionCookie,
  createSessionCookie,
  readSession,
  setAdminSessionCookie,
} from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await readSession();
    return Response.json({
      authenticated: Boolean(user),
      user,
      role: user?.role ?? null,
    });
  } catch {
    return Response.json({
      authenticated: false,
      user: null,
      role: null,
      error:
        "Firebase Admin no está configurado. En Vercel agrega FIREBASE_SERVICE_ACCOUNT_JSON.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { idToken?: string };
    if (!body.idToken) {
      return Response.json({ error: "idToken required" }, { status: 400 });
    }

    const { sessionCookie, user } = await createSessionCookie(body.idToken);
    await setAdminSessionCookie(sessionCookie);
    return Response.json({ ok: true, user, role: user.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (
      message.includes("Firebase Admin credentials missing") ||
      message.includes("FIREBASE_SERVICE_ACCOUNT")
    ) {
      return Response.json(
        {
          error:
            "Firebase Admin no está configurado en el servidor. En Vercel agrega FIREBASE_SERVICE_ACCOUNT_JSON.",
        },
        { status: 500 },
      );
    }
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

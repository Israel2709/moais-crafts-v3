import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function GET() {
  try {
    const { readSession } = await import("@/lib/auth/session");
    const user = await readSession();
    return json({
      authenticated: Boolean(user),
      user,
      role: user?.role ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json(
      {
        authenticated: false,
        user: null,
        role: null,
        error: message,
      },
      200,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { createSessionCookie, setAdminSessionCookie } =
      await import("@/lib/auth/session");

    const body = (await request.json()) as { idToken?: string };
    if (!body.idToken) {
      return json({ error: "idToken required" }, 400);
    }

    const { sessionCookie, user } = await createSessionCookie(body.idToken);
    await setAdminSessionCookie(sessionCookie);
    return json({ ok: true, user, role: user.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (
      message.includes("Firebase Admin credentials missing") ||
      message.includes("FIREBASE_SERVICE_ACCOUNT")
    ) {
      return json(
        {
          error:
            "Firebase Admin no está configurado en el servidor. Revisa FIREBASE_SERVICE_ACCOUNT_JSON en Vercel (Production) y redespliega.",
        },
        500,
      );
    }
    try {
      const { adminErrorResponse } = await import("@/lib/auth/session");
      return adminErrorResponse(error);
    } catch {
      return json({ error: message }, 500);
    }
  }
}

export async function DELETE() {
  try {
    const { clearAdminSessionCookie } = await import("@/lib/auth/session");
    await clearAdminSessionCookie();
    return json({ ok: true });
  } catch (error) {
    try {
      const { adminErrorResponse } = await import("@/lib/auth/session");
      return adminErrorResponse(error);
    } catch {
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      return json({ error: message }, 500);
    }
  }
}

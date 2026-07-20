import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  adminErrorResponse,
  getExpectedAdminSecret,
  isValidAdminSecret,
} from "@/lib/admin-secret";

export async function GET() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  return Response.json({ authenticated: isValidAdminSecret(value) });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { secret?: string };
    const expected = getExpectedAdminSecret();
    if (body.secret !== expected) {
      return Response.json({ error: "Invalid secret" }, { status: 401 });
    }
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, body.secret, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}

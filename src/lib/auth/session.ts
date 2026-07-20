import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  isSuperAdminEmail,
  type AuthUser,
} from "@/lib/auth/index";
import { getAdminAuth } from "@/lib/firebase/server";

export class AdminAuthError extends Error {
  status: number;

  constructor(message = "Admin authentication required", status = 401) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

export function adminErrorResponse(error: unknown): Response {
  if (error instanceof AdminAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}

export async function createAdminSessionCookie(idToken: string): Promise<{
  sessionCookie: string;
  user: AuthUser;
}> {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken);

  if (!isSuperAdminEmail(decoded.email)) {
    throw new AdminAuthError("No autorizado para el panel admin", 403);
  }

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  return {
    sessionCookie,
    user: {
      uid: decoded.uid,
      email: decoded.email ?? "",
    },
  };
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function setAdminSessionCookie(sessionCookie: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
}

export async function readAdminSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    if (!isSuperAdminEmail(decoded.email)) {
      return null;
    }
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
    };
  } catch {
    return null;
  }
}

export async function assertAdminRequest(
  _request?: NextRequest,
): Promise<DecodedIdToken> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    throw new AdminAuthError();
  }

  let decoded: DecodedIdToken;
  try {
    decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    throw new AdminAuthError();
  }

  if (!isSuperAdminEmail(decoded.email)) {
    throw new AdminAuthError("No autorizado para el panel admin", 403);
  }

  return decoded;
}

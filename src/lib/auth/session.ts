import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  getAuthRole,
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

function userFromDecoded(decoded: DecodedIdToken): AuthUser | null {
  const role = getAuthRole(decoded.email);
  if (!role) return null;
  return {
    uid: decoded.uid,
    email: decoded.email ?? "",
    role,
  };
}

export async function createSessionCookie(idToken: string): Promise<{
  sessionCookie: string;
  user: AuthUser;
}> {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken);
  const user = userFromDecoded(decoded);

  if (!user) {
    throw new AdminAuthError("No autorizado para esta app", 403);
  }

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  return { sessionCookie, user };
}

/** @deprecated Prefer createSessionCookie */
export async function createAdminSessionCookie(idToken: string) {
  return createSessionCookie(idToken);
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

export async function readSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return userFromDecoded(decoded);
  } catch {
    return null;
  }
}

/** Session only if the user is a super admin. */
export async function readAdminSession(): Promise<AuthUser | null> {
  const user = await readSession();
  if (!user || user.role !== "admin") return null;
  return user;
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

export async function assertSellerOrAdminRequest(
  _request?: NextRequest,
): Promise<DecodedIdToken> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    throw new AdminAuthError("Authentication required", 401);
  }

  let decoded: DecodedIdToken;
  try {
    decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    throw new AdminAuthError("Authentication required", 401);
  }

  if (!getAuthRole(decoded.email)) {
    throw new AdminAuthError("No autorizado", 403);
  }

  return decoded;
}

import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE = "moais_admin_secret";

export function getExpectedAdminSecret(): string {
  const secret = process.env.MOAIS_ADMIN_SECRET;
  if (!secret) {
    throw new Error("MOAIS_ADMIN_SECRET is not configured");
  }
  return secret;
}

export function isValidAdminSecret(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  try {
    return value === getExpectedAdminSecret();
  } catch {
    return false;
  }
}

export async function assertAdminRequest(request: NextRequest): Promise<void> {
  const header = request.headers.get("x-moais-admin-secret");
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isValidAdminSecret(header) && !isValidAdminSecret(cookie)) {
    throw new AdminAuthError();
  }
}

export class AdminAuthError extends Error {
  status = 401;

  constructor() {
    super("Admin secret required");
    this.name = "AdminAuthError";
  }
}

export function adminErrorResponse(error: unknown): Response {
  if (error instanceof AdminAuthError) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}

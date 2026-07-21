export const SESSION_COOKIE = "moais_session";

/** Session cookie lifetime (Firebase max is 14 days). */
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

export type AuthRole = "admin" | "seller";

export type AuthUser = {
  uid: string;
  email: string;
  role: AuthRole;
};

function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getSuperAdminEmails(): string[] {
  return parseEmailList(process.env.MOAIS_SUPER_ADMIN_EMAILS ?? "");
}

export function getSellerEmails(): string[] {
  return parseEmailList(process.env.MOAIS_SELLER_EMAILS ?? "");
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getSuperAdminEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

export function isSellerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getSellerEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

/** Admin wins if the email is in both lists. */
export function getAuthRole(
  email: string | null | undefined,
): AuthRole | null {
  if (isSuperAdminEmail(email)) return "admin";
  if (isSellerEmail(email)) return "seller";
  return null;
}

export function isAllowedAppEmail(email: string | null | undefined): boolean {
  return getAuthRole(email) != null;
}

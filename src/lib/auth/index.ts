export const SESSION_COOKIE = "moais_session";

/** Session cookie lifetime (Firebase max is 14 days). */
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;

export type AuthUser = {
  uid: string;
  email: string;
};

export function getSuperAdminEmails(): string[] {
  const raw = process.env.MOAIS_SUPER_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  const allowed = getSuperAdminEmails();
  if (allowed.length === 0) {
    return false;
  }
  return allowed.includes(email.trim().toLowerCase());
}

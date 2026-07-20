/**
 * Auth stub — Moai's Catalog v1 has no user authentication.
 *
 * Future (gastly-app pattern):
 * 1. Enable Firebase Auth in raziel-app-hub
 * 2. Mirror gastly-app session provider / route guards
 * 3. Replace MOAIS_ADMIN_SECRET with ID token verification in API routes
 * 4. Use moaisCatalog_admins/{uid} (or custom claims) for staff access
 *
 * Clone reference when available:
 *   git clone <Israel2709/gastly-app> ../_refs/gastly-app
 */

export const AUTH_STATUS = "disabled" as const;

export type FutureAuthUser = {
  uid: string;
  email: string | null;
};

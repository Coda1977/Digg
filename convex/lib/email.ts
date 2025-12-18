/**
 * Shared email utility functions for Convex backend
 */

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function parseAdminEmails(raw: string | undefined): Set<string> {
  if (!raw) return new Set<string>();
  const parts = raw
    .split(/[\s,]+/g)
    .map((part) => normalizeEmail(part))
    .filter((part): part is string => part !== null);
  return new Set(parts);
}

export function getAdminEmailsFromEnv(): Set<string> {
  return parseAdminEmails(
    process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL
  );
}

/**
 * Shared error handling utilities
 */

/**
 * Extracts a human-readable error message from an unknown error value.
 * Use this instead of the repeated `err instanceof Error ? err.message : "fallback"` pattern.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

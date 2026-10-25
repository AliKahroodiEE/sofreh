/**
 * Runtime configuration. `NEXT_PUBLIC_*` values are inlined at build time,
 * so the Docker image receives the API origin as a build argument.
 */

/** Origin of the Sofreh API, e.g. `http://localhost:4100` (no trailing slash). */
export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100").replace(/\/+$/, "");

/** Base URL of the versioned REST API. */
export const API_BASE = `${API_ORIGIN}/api/v1`;

/**
 * The API returns uploaded images as paths relative to its origin
 * (`/uploads/seed-latte.webp`). Turn them into absolute URLs.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

import { API_BASE_URL } from "@/services/api";

/** Origin of the backend, which serves /media (built-in images) and /uploads (images uploaded in the admin panel). */
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

/** Resolves an image path stored in the database to a URL the browser can load. */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

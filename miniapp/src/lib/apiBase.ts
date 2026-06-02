/** Direct Render API (dev / emergency fallback). */
export const DEFAULT_PRODUCTION_API_URL = "https://nutricrew-dddi.onrender.com/api";

function normalizeApiUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Production uses same-origin `/api` (Vercel → Render proxy, no CORS in Telegram).
 * Development uses VITE_API_URL or local server.
 */
export function getApiBase(): string {
  if (import.meta.env.DEV) {
    return normalizeApiUrl(import.meta.env.VITE_API_URL ?? "http://localhost:3000/api");
  }
  return "/api";
}

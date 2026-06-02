/** Render production API (used when Vercel /api proxy is unavailable). */
export const PRODUCTION_API_URL = "https://nutricrew-dddi.onrender.com/api";

function normalizeApiUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Production calls Render directly (CORS allows *.vercel.app). Dev uses local server. */
export function getApiBase(): string {
  if (import.meta.env.DEV) {
    return normalizeApiUrl(import.meta.env.VITE_API_URL ?? "http://localhost:3000/api");
  }
  const baked = import.meta.env.VITE_API_URL;
  if (baked) {
    return normalizeApiUrl(baked);
  }
  return PRODUCTION_API_URL;
}

export function isInsideTelegram(): boolean {
  return Boolean(window.Telegram?.WebApp);
}

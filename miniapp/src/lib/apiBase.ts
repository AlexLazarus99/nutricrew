/** Production Render API (fallback if env / runtime-config missing). */
export const DEFAULT_PRODUCTION_API_URL = "https://nutricrew-dddi.onrender.com/api";

let cachedBase: string | null = null;

function normalizeApiUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Resolves API base URL (dev / Vercel env / runtime-config.json / Render default /api proxy). */
export async function getApiBase(): Promise<string> {
  if (cachedBase) return cachedBase;

  if (import.meta.env.DEV) {
    cachedBase = normalizeApiUrl(import.meta.env.VITE_API_URL ?? "http://localhost:3000/api");
    return cachedBase;
  }

  const baked = import.meta.env.VITE_API_URL;
  if (baked) {
    cachedBase = normalizeApiUrl(baked);
    return cachedBase;
  }

  try {
    const res = await fetch("/runtime-config.json", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { apiUrl?: string };
      if (data.apiUrl) {
        cachedBase = normalizeApiUrl(data.apiUrl);
        return cachedBase;
      }
    }
  } catch {
    /* use fallback */
  }

  cachedBase = normalizeApiUrl(DEFAULT_PRODUCTION_API_URL);
  return cachedBase;
}

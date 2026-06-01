import { config } from "../config.js";

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}

export function getAllowedCorsOrigins(): string[] {
  const list = new Set<string>([
    normalizeOrigin(config.webappUrl),
    "http://localhost:5173",
  ]);

  const extra = process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  for (const origin of extra) {
    list.add(normalizeOrigin(origin));
  }

  return [...list];
}

/** Allow configured origins and any Vercel deployment (*.vercel.app). */
export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);
  if (getAllowedCorsOrigins().some((allowed) => normalizeOrigin(allowed) === normalized)) {
    return true;
  }

  return /^https:\/\/[\w-]+\.vercel\.app$/.test(normalized);
}

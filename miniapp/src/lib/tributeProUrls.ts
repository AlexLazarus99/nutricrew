/** Default Pro checkout links when the API has no TRIBUTE_PRO_URL yet. */
export const FALLBACK_TRIBUTE_PRO_URLS = [
  "https://t.me/tribute/app?startapp=ep_8xu227KkHfYz8ptLQJWsBaCLxHdPT3mHVdOhOTNE59ruNXvQnV",
  "https://t.me/tribute/app?startapp=ep_8xu22rXBIwrLAW3OZI1UFoDzmaIvDjZCFE3WV6d39Z1hY6fIuq",
] as const;

export function parseTributeProUrls(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function resolveTributeProUrls(
  fromApi?: string[] | string | null | undefined,
): string[] {
  if (Array.isArray(fromApi)) {
    const urls = fromApi.map((u) => u.trim()).filter(Boolean);
    if (urls.length) return urls;
  } else {
    const urls = parseTributeProUrls(fromApi);
    if (urls.length) return urls;
  }
  return [...FALLBACK_TRIBUTE_PRO_URLS];
}

export function primaryTributeProUrl(fromApi?: string[] | string | null): string {
  return resolveTributeProUrls(fromApi)[0] ?? FALLBACK_TRIBUTE_PRO_URLS[0];
}

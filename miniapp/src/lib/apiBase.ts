/** Production Render API — hardcoded so Vercel env vars are not required. */
export const PRODUCTION_API_URL = "https://nutricrew-dddi.onrender.com/api";

export const APP_BUILD = "2026-06-03-lv50-fix";

function normalizeApiUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function getApiBase(): string {
  if (import.meta.env.DEV) {
    return normalizeApiUrl(import.meta.env.VITE_API_URL ?? "http://localhost:3000/api");
  }
  return PRODUCTION_API_URL;
}

import { isTelegramClient } from "../lib/telegramReady.js";

export function isInsideTelegram(): boolean {
  return isTelegramClient();
}

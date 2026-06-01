import type { AppLocale } from "./localeTypes";

export type { AppLocale } from "./localeTypes";

const STORAGE_KEY = "nutricrew_locale";

export function getStoredLocale(): AppLocale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "en" || v === "ru") return v;
    return null;
  } catch {
    return null;
  }
}

export function setStoredLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function detectInitialLocale(): AppLocale {
  const stored = getStoredLocale();
  if (stored) return stored;

  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (tgLang?.toLowerCase().startsWith("ru")) return "ru";

  const browser = navigator.language?.toLowerCase();
  if (browser?.startsWith("ru")) return "ru";

  return "en";
}

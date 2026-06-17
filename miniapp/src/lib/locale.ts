import { APP_LOCALES, isAppLocale, type AppLocale } from "./localeConfig";
import { detectSystemLocale } from "./formatLocale";

export type { AppLocale } from "./localeConfig";
export { APP_LOCALE_OPTIONS, APP_LOCALES, isAppLocale } from "./localeConfig";

const STORAGE_KEY = "nutricrew_locale";

export function getStoredLocale(): AppLocale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isAppLocale(v) ? v : null;
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

/** Saved choice wins; otherwise Telegram → browser → English. */
export function detectInitialLocale(): AppLocale {
  const stored = getStoredLocale();
  if (stored) return stored;
  return detectSystemLocale();
}

export function assertAppLocale(value: string): AppLocale | null {
  return isAppLocale(value) ? value : null;
}

export function allAppLocales(): readonly AppLocale[] {
  return APP_LOCALES;
}

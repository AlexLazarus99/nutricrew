import type { AppLocale } from "../types.js";

export const APP_LOCALES = [
  "en", "ru", "fr", "es", "de", "tr", "pt", "sv", "it", "ar", "pl", "zh", "hi",
] as const satisfies readonly AppLocale[];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value ?? "");
}

/** Language name for LLM prompts (vision / meal analysis). */
export function llmLanguageName(locale: AppLocale): string {
  const names: Record<AppLocale, string> = {
    en: "English",
    ru: "Russian",
    fr: "French",
    es: "Spanish",
    de: "German",
    tr: "Turkish",
    pt: "Portuguese",
    sv: "Swedish",
    it: "Italian",
    ar: "Arabic",
    pl: "Polish",
    zh: "Chinese",
    hi: "Hindi",
  };
  return names[locale];
}

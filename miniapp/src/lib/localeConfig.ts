export const APP_LOCALE_OPTIONS = [
  { code: "en", flag: "🇬🇧", nativeLabel: "English" },
  { code: "ru", flag: "🇷🇺", nativeLabel: "Русский" },
  { code: "fr", flag: "🇫🇷", nativeLabel: "Français" },
  { code: "es", flag: "🇪🇸", nativeLabel: "Español" },
  { code: "de", flag: "🇩🇪", nativeLabel: "Deutsch" },
  { code: "tr", flag: "🇹🇷", nativeLabel: "Türkçe" },
  { code: "pt", flag: "🇵🇹", nativeLabel: "Português" },
  { code: "sv", flag: "🇸🇪", nativeLabel: "Svenska" },
  { code: "it", flag: "🇮🇹", nativeLabel: "Italiano" },
  { code: "ar", flag: "🇸🇦", nativeLabel: "العربية" },
  { code: "pl", flag: "🇵🇱", nativeLabel: "Polski" },
  { code: "zh", flag: "🇨🇳", nativeLabel: "中文" },
  { code: "hi", flag: "🇮🇳", nativeLabel: "हिन्दी" },
] as const;

export type AppLocale = (typeof APP_LOCALE_OPTIONS)[number]["code"];

export const APP_LOCALES = APP_LOCALE_OPTIONS.map((o) => o.code) as AppLocale[];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale);
}

export function localeOption(code: AppLocale) {
  return APP_LOCALE_OPTIONS.find((o) => o.code === code)!;
}

/** BCP-47 tag for dates, numbers, and Intl formatters. */
export const LOCALE_TAGS: Record<AppLocale, string> = {
  en: "en-US",
  ru: "ru-RU",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  tr: "tr-TR",
  pt: "pt-PT",
  sv: "sv-SE",
  it: "it-IT",
  ar: "ar-SA",
  pl: "pl-PL",
  zh: "zh-CN",
  hi: "hi-IN",
};

export function isRtlLocale(locale: string): boolean {
  return locale.startsWith("ar");
}

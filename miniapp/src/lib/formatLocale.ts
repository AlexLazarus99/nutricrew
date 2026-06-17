import { isAppLocale, LOCALE_TAGS, type AppLocale } from "./localeConfig";

/** Map BCP-47 base codes and common aliases to NutriCrew app locales. */
const LANGUAGE_ALIASES: Record<string, AppLocale> = {
  en: "en",
  ru: "ru",
  uk: "ru",
  be: "ru",
  fr: "fr",
  es: "es",
  de: "de",
  tr: "tr",
  pt: "pt",
  sv: "sv",
  it: "it",
  ar: "ar",
  pl: "pl",
  zh: "zh",
  hi: "hi",
};

function normalizeLanguageTag(tag: string | null | undefined): string | null {
  if (!tag?.trim()) return null;
  return tag.trim().toLowerCase().replace(/_/g, "-");
}

/** Match Telegram / browser language tag to a supported app locale. */
export function matchAppLocale(language: string | null | undefined): AppLocale | null {
  const normalized = normalizeLanguageTag(language);
  if (!normalized) return null;

  if (isAppLocale(normalized)) return normalized;

  const base = normalized.split("-")[0];
  if (isAppLocale(base)) return base;

  const alias = LANGUAGE_ALIASES[base];
  if (alias) return alias;

  return null;
}

export function resolveAppLocale(language: string | null | undefined): AppLocale {
  return matchAppLocale(language) ?? "en";
}

export function detectSystemLocale(): AppLocale {
  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  const fromTelegram = matchAppLocale(tgLang);
  if (fromTelegram) return fromTelegram;

  const browserTags = [
    navigator.language,
    ...(navigator.languages ?? []),
  ];

  for (const tag of browserTags) {
    const matched = matchAppLocale(tag);
    if (matched) return matched;
  }

  return "en";
}

export function intlLocaleTag(language: string | null | undefined): string {
  const locale = resolveAppLocale(language);
  return LOCALE_TAGS[locale];
}

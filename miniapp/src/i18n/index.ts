import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectInitialLocale, type AppLocale } from "../lib/locale";
import { isRtlLocale } from "../lib/localeConfig";
import { resolveAppLocale } from "../lib/formatLocale";

const wellnessLoaded = new Set<AppLocale>();
const wellnessLoads = new Map<AppLocale, Promise<void>>();

const baseLoaders: Record<AppLocale, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import("../locales/en.json"),
  ru: () => import("../locales/ru.json"),
  fr: () => import("../locales/fr.json"),
  es: () => import("../locales/es.json"),
  de: () => import("../locales/de.json"),
  tr: () => import("../locales/tr.json"),
  pt: () => import("../locales/pt.json"),
  sv: () => import("../locales/sv.json"),
  it: () => import("../locales/it.json"),
  ar: () => import("../locales/ar.json"),
  pl: () => import("../locales/pl.json"),
  zh: () => import("../locales/zh.json"),
  hi: () => import("../locales/hi.json"),
};

function wellnessGuideLooksComplete(lng: AppLocale): boolean {
  const sample = i18n.t("wellness.bodyTypes.ectomorph.name", { lng });
  return sample !== "wellness.bodyTypes.ectomorph.name" && sample.length > 0;
}

async function loadBaseBundle(locale: AppLocale) {
  return (await baseLoaders[locale]()).default;
}

async function loadWellnessBundle(locale: AppLocale) {
  const useRu = locale === "ru";
  if (useRu) {
    const [exercises, exerciseNames, dishNames, dishRecipes] = await Promise.all([
      import("../locales/exercises.ru.json"),
      import("../locales/exerciseNames.ru.json"),
      import("../locales/dishNames.ru.json"),
      import("../locales/dishRecipes.ru.json"),
    ]);
    return {
      exercises: exercises.default,
      exerciseNames: exerciseNames.default,
      dishNames: dishNames.default,
      dishRecipes: dishRecipes.default,
    };
  }
  const [exercises, exerciseNames, dishNames, dishRecipes] = await Promise.all([
    import("../locales/exercises.en.json"),
    import("../locales/exerciseNames.en.json"),
    import("../locales/dishNames.en.json"),
    import("../locales/dishRecipes.en.json"),
  ]);
  return {
    exercises: exercises.default,
    exerciseNames: exerciseNames.default,
    dishNames: dishNames.default,
    dishRecipes: dishRecipes.default,
  };
}

export async function initI18n() {
  const lng = detectInitialLocale();
  const base = await loadBaseBundle(lng);
  await i18n.use(initReactI18next).init({
    resources: {
      [lng]: { translation: base },
    },
    lng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
  document.documentElement.lang = lng;
  document.documentElement.dir = isRtlLocale(lng) ? "rtl" : "ltr";
  return i18n;
}

export async function ensureLocale(locale: AppLocale) {
  if (i18n.hasResourceBundle(locale, "translation")) {
    return;
  }
  const base = await loadBaseBundle(locale);
  i18n.addResourceBundle(locale, "translation", base, true, false);
}

/** Wellness guide strings (~120 KB) — load only when guide or meal plans are opened. */
export async function ensureWellnessTranslations(locale?: AppLocale) {
  const lng: AppLocale = locale ?? resolveAppLocale(i18n.language);

  if (wellnessLoaded.has(lng) && wellnessGuideLooksComplete(lng)) return;

  const pending = wellnessLoads.get(lng);
  if (pending) return pending;

  const job = (async () => {
    await ensureLocale(lng);
    const [base, extras] = await Promise.all([loadBaseBundle(lng), loadWellnessBundle(lng)]);
    const wellness = (base.wellness ?? {}) as Record<string, unknown>;

    i18n.addResourceBundle(
      lng,
      "translation",
      {
        ...base,
        wellness: { ...wellness, exercises: extras.exercises },
        exerciseNames: extras.exerciseNames,
        dishNames: extras.dishNames,
        dishRecipes: extras.dishRecipes,
      },
      true,
      true,
    );

    if (!wellnessGuideLooksComplete(lng)) {
      wellnessLoaded.delete(lng);
      throw new Error(`Wellness guide translations incomplete for ${lng}`);
    }

    wellnessLoaded.add(lng);
    if (i18n.language === lng) {
      await i18n.changeLanguage(lng);
    }
  })();

  wellnessLoads.set(lng, job);
  try {
    await job;
  } finally {
    wellnessLoads.delete(lng);
  }
}

export default i18n;

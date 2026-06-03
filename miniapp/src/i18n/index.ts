import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectInitialLocale, type AppLocale } from "../lib/locale";

const wellnessLoaded = new Set<AppLocale>();

async function loadBaseBundle(locale: AppLocale) {
  if (locale === "ru") {
    return (await import("../locales/ru.json")).default;
  }
  return (await import("../locales/en.json")).default;
}

async function loadWellnessBundle(locale: AppLocale) {
  if (locale === "ru") {
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
  const lng: AppLocale =
    locale ?? (i18n.language.startsWith("ru") ? "ru" : "en");
  if (wellnessLoaded.has(lng)) return;

  await ensureLocale(lng);
  const extras = await loadWellnessBundle(lng);
  const base = (i18n.getResourceBundle(lng, "translation") ?? {}) as Record<
    string,
    unknown
  >;
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
  wellnessLoaded.add(lng);
}

export default i18n;

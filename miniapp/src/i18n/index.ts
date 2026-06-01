import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enBase from "../locales/en.json";
import ruBase from "../locales/ru.json";
import exercisesEn from "../locales/exercises.en.json";
import exercisesRu from "../locales/exercises.ru.json";
import exerciseNamesEn from "../locales/exerciseNames.en.json";
import exerciseNamesRu from "../locales/exerciseNames.ru.json";
import dishNamesEn from "../locales/dishNames.en.json";
import dishNamesRu from "../locales/dishNames.ru.json";
import dishRecipesEn from "../locales/dishRecipes.en.json";
import dishRecipesRu from "../locales/dishRecipes.ru.json";
import { detectInitialLocale } from "../lib/locale";

const en = {
  ...enBase,
  wellness: { ...enBase.wellness, exercises: exercisesEn },
  exerciseNames: exerciseNamesEn,
  dishNames: dishNamesEn,
  dishRecipes: dishRecipesEn,
};

const ru = {
  ...ruBase,
  wellness: { ...ruBase.wellness, exercises: exercisesRu },
  exerciseNames: exerciseNamesRu,
  dishNames: dishNamesRu,
  dishRecipes: dishRecipesRu,
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: detectInitialLocale(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;

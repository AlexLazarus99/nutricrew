/**
 * Energy from macronutrients — general Atwater factors (FAO/WHO, 2001).
 * Used in clinical dietetics, food labeling (EU/US), and national tables.
 * @see FAO Food and Nutrition Paper 77 — Human energy requirements
 */
export const ATWATER = {
  protein: 4,
  /** Available carbohydrates (total carbs minus fiber) */
  carbs: 4,
  fat: 9,
  /** Non-digestible fiber — partial energy contribution */
  fiber: 2,
  alcohol: 7,
} as const;

export type MacroProfile = {
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG?: number;
  alcoholG?: number;
};

export type NutritionSource = "usda" | "who_fao" | "clinical_ru";

/** kcal per 100 g or 100 ml from macro composition (clinical Atwater method). */
export function kcalFromMacros(m: MacroProfile): number {
  const fiber = m.fiberG ?? 0;
  const availableCarbs = Math.max(0, m.carbsG - fiber);
  const alcohol = m.alcoholG ?? 0;
  return Math.round(
    m.proteinG * ATWATER.protein +
      availableCarbs * ATWATER.carbs +
      m.fatG * ATWATER.fat +
      fiber * ATWATER.fiber +
      alcohol * ATWATER.alcohol,
  );
}

export type AtwaterBreakdown = {
  fromProtein: number;
  fromCarbs: number;
  fromFat: number;
  fromFiber: number;
  fromAlcohol: number;
  total: number;
};

export function atwaterBreakdown(m: MacroProfile): AtwaterBreakdown {
  const fiber = m.fiberG ?? 0;
  const availableCarbs = Math.max(0, m.carbsG - fiber);
  const alcohol = m.alcoholG ?? 0;
  const fromProtein = Math.round(m.proteinG * ATWATER.protein);
  const fromCarbs = Math.round(availableCarbs * ATWATER.carbs);
  const fromFat = Math.round(m.fatG * ATWATER.fat);
  const fromFiber = Math.round(fiber * ATWATER.fiber);
  const fromAlcohol = Math.round(alcohol * ATWATER.alcohol);
  return {
    fromProtein,
    fromCarbs,
    fromFat,
    fromFiber,
    fromAlcohol,
    total: fromProtein + fromCarbs + fromFat + fromFiber + fromAlcohol,
  };
}

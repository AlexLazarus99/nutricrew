import { FOOD_CATALOG } from "./catalog";
import { kcalFromMacros } from "./nutrition";
import type { FoodItem } from "./types";

export type { FoodCategory, FoodItem, FoodUnit } from "./types";
export { FOOD_CATEGORIES } from "./types";
export { ATWATER, atwaterBreakdown, kcalFromMacros } from "./nutrition";
export type { MacroProfile, NutritionSource } from "./nutrition";

function isAlcoholicDrink(entry: (typeof FOOD_CATALOG)[number]): boolean {
  return (entry.macros.alcoholG ?? 0) >= 0.5;
}

/** Foods with kcal computed via Atwater factors; alcoholic drinks excluded. */
export const FOOD_ITEMS: FoodItem[] = FOOD_CATALOG.filter(
  (entry) => !isAlcoholicDrink(entry),
).map((entry) => ({
  ...entry,
  calories: kcalFromMacros(entry.macros),
}));

export const FOOD_COUNT = FOOD_ITEMS.length;

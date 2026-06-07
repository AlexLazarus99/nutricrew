import { kcalFromMacros } from "../data/calorieQuiz/nutrition";
import type { FoodItem } from "../data/calorieQuiz/types";

export type PortionMacros = {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** Scale per-100 g/ml catalog macros to a portion size. */
export function macrosForPortion(
  item: FoodItem,
  amount: number,
  label: string,
): PortionMacros {
  const ratio = Math.max(0, amount) / 100;
  const protein = Math.round(item.macros.proteinG * ratio * 10) / 10;
  const carbs = Math.round(item.macros.carbsG * ratio * 10) / 10;
  const fat = Math.round(item.macros.fatG * ratio * 10) / 10;
  const calories = Math.round(kcalFromMacros({
    proteinG: item.macros.proteinG * ratio,
    fatG: item.macros.fatG * ratio,
    carbsG: item.macros.carbsG * ratio,
    fiberG: item.macros.fiberG ? item.macros.fiberG * ratio : undefined,
  }));

  return {
    description: `${label} (${Math.round(amount)} ${item.unit})`,
    calories,
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

/** Scale per-100 g OFF values to a portion size. */
export function macrosFromPer100g(
  name: string,
  per100: { calories: number; protein: number; carbs: number; fat: number },
  grams: number,
): PortionMacros {
  const ratio = Math.max(0, grams) / 100;
  const protein = Math.round(per100.protein * ratio);
  const carbs = Math.round(per100.carbs * ratio);
  const fat = Math.round(per100.fat * ratio);
  const calories = Math.round(per100.calories * ratio);

  return {
    description: `${name} (${Math.round(grams)} g)`,
    calories,
    protein,
    carbs,
    fat,
  };
}

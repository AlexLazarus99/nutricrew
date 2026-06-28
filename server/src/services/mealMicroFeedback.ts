import * as mealsRepo from "../repositories/meals.js";
import { buildTrends } from "./trends.js";
import { getProGoals } from "./proExtras.js";
import { getUserAiTier } from "./userAiTier.js";
import { isUserPro } from "./userPro.js";
import type { DbUser } from "../types.js";

type MealInput = {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealSlot?: string;
};

export async function buildMealMicroFeedback(
  user: DbUser,
  input: MealInput,
): Promise<string | null> {
  const tier = await getUserAiTier(user.id);
  const ru = user.locale?.startsWith("ru");
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayMeals = await mealsRepo.findMealsInRange(user.id, todayStart, new Date());
  const todayCalories = todayMeals.reduce((s, m) => s + m.calories, 0) + input.calories;
  const todayProtein = todayMeals.reduce((s, m) => s + m.protein, 0) + input.protein;

  let calorieTarget: number | null = null;
  let proteinTarget: number | null = null;
  if (tier === "pro" && (await isUserPro(user.id))) {
    try {
      const goals = await getProGoals(user, "maintain");
      calorieTarget = goals.calories;
      proteinTarget = goals.protein;
    } catch {
      /* profile incomplete */
    }
  } else {
    const trends = await buildTrends(user, "7d");
    calorieTarget = trends.kcalTarget;
    proteinTarget = trends.proteinTarget;
  }

  const lines: string[] = [];

  if (input.protein >= 25) {
    lines.push(
      ru
        ? "Хороший приём по белку — мышцам и сытости это на пользу."
        : "Solid protein in this meal — good for fullness and recovery.",
    );
  } else if (input.protein < 12 && input.calories > 350) {
    lines.push(
      ru
        ? "Мало белка для такой калорийности — добавь яйцо, творог или курицу."
        : "Low protein for the calories — try eggs, cottage cheese, or chicken.",
    );
  }

  if (proteinTarget && todayProtein < proteinTarget * 0.45 && todayCalories > 0) {
    const left = Math.max(0, proteinTarget - todayProtein);
    if (tier !== "free") {
      lines.push(
        ru
          ? `До цели по белку сегодня ещё ~${left} г.`
          : `~${left}g protein left to hit today's target.`,
      );
    }
  }

  if (calorieTarget && todayCalories > calorieTarget * 1.15) {
    lines.push(
      ru
        ? "Сегодня калорий уже выше цели — на ужин выбери что-то полегче."
        : "Today's calories are above target — keep dinner lighter.",
    );
  } else if (calorieTarget && todayCalories < calorieTarget * 0.55 && todayMeals.length >= 1) {
    lines.push(
      ru
        ? "Пока недобор по калориям — не пропусти полноценный перекус."
        : "Still under calories today — don't skip a proper snack.",
    );
  }

  if (lines.length === 0) {
    lines.push(
      ru
        ? "Запись сохранена — так проще держать баланс в течение дня."
        : "Logged — keeping a steady diary makes progress easier.",
    );
  }

  if (tier === "free") {
    return lines[0] ?? null;
  }

  if (tier === "lite") {
    return lines.slice(0, 2).join(" ");
  }

  return lines.slice(0, 3).join(" ");
}

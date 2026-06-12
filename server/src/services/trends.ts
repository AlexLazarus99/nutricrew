import * as mealsRepo from "../repositories/meals.js";
import * as wellnessRepo from "../repositories/wellness.js";
import type { DbUser } from "../types.js";

export type TrendsRange = "7d" | "30d" | "90d";

function rangeToDays(range: TrendsRange): number {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
}

function estimateDailyKcalTarget(user: DbUser): number | null {
  if (user.weight_kg == null || user.height_cm == null || user.age == null) return null;
  const bmr = 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5;
  return Math.round(bmr * 1.45);
}

function estimateDailyProteinTarget(user: DbUser): number | null {
  if (user.weight_kg == null) return null;
  return Math.round(user.weight_kg * 1.6);
}

export async function buildTrends(user: DbUser, range: TrendsRange = "30d") {
  const days = rangeToDays(range);
  const to = new Date();
  to.setUTCHours(24, 0, 0, 0);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days);

  const byDay = await mealsRepo.aggregateMealsByDay(user.id, from, to);
  const weightLogs = await wellnessRepo.getWeightLogs(user.id, days);
  const waterHistory = await wellnessRepo.getWaterHistory(user.id, days);

  const daily: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    meals: number;
  }> = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const agg = byDay.get(key) ?? { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
    daily.push({
      date: key,
      calories: agg.calories,
      protein: agg.protein,
      carbs: agg.carbs,
      fat: agg.fat,
      meals: agg.count,
    });
  }

  const loggedDays = daily.filter((d) => d.meals > 0);
  const avgCalories =
    loggedDays.length > 0
      ? Math.round(loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length)
      : 0;
  const avgProtein =
    loggedDays.length > 0
      ? Math.round(loggedDays.reduce((s, d) => s + d.protein, 0) / loggedDays.length)
      : 0;

  const kcalTarget = estimateDailyKcalTarget(user);
  const proteinTarget = estimateDailyProteinTarget(user);

  const insights: string[] = [];
  if (proteinTarget && loggedDays.length >= 3) {
    const lowProteinDays = loggedDays.filter((d) => d.protein < proteinTarget * 0.85).length;
    if (lowProteinDays >= Math.ceil(loggedDays.length * 0.5)) {
      insights.push("protein_low");
    }
  }
  if (kcalTarget && loggedDays.length >= 3) {
    const overDays = loggedDays.filter((d) => d.calories > kcalTarget * 1.15).length;
    if (overDays >= Math.ceil(loggedDays.length * 0.4)) {
      insights.push("calories_high");
    }
  }
  if (loggedDays.length >= 5) {
    insights.push("consistent_logging");
  }

  return {
    range,
    daily,
    avgCalories,
    avgProtein,
    kcalTarget,
    proteinTarget,
    weightLogs: weightLogs.reverse(),
    waterHistory,
    insights,
    daysLogged: loggedDays.length,
  };
}

export function insightText(insight: string, locale: string): string {
  const ru = locale.startsWith("ru");
  switch (insight) {
    case "protein_low":
      return ru
        ? "Белка часто меньше нормы — добавьте яйца, творог или бобовые."
        : "Protein is often below target — try eggs, cottage cheese, or legumes.";
    case "calories_high":
      return ru
        ? "Калорийность часто выше цели — попробуйте меньшие порции на ужин."
        : "Calories often exceed target — consider smaller dinner portions.";
    case "consistent_logging":
      return ru
        ? "Отличная регулярность — так проще видеть прогресс."
        : "Great logging consistency — easier to spot progress.";
    default:
      return "";
  }
}

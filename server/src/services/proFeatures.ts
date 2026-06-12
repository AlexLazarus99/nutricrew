import * as mealsRepo from "../repositories/meals.js";
import { prisma } from "../db/client.js";
import { isUserPro } from "./userPro.js";
import { buildWeeklyReport } from "./weeklyReport.js";
import { insightText, buildTrends } from "./trends.js";
import type { DbUser } from "../types.js";

export async function coachReply(user: DbUser, question: string) {
  const pro = await isUserPro(user.id);
  if (!pro) throw new Error("PRO_REQUIRED");

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);
  const meals = await mealsRepo.findMealsInRange(user.id, since, new Date());
  const summary = meals
    .slice(0, 20)
    .map((m) => `${m.description}: ${m.calories} kcal, P${m.protein}g`)
    .join("; ");
  const q = question.trim().slice(0, 400);
  const locale = user.locale ?? "en";
  const ru = locale.startsWith("ru");

  if (!summary) {
    return {
      answer: ru
        ? "Пока мало данных за неделю — залогируй 2–3 приёма пищи, и я смогу дать совет."
        : "Not enough meals this week — log 2–3 meals and I can advise.",
    };
  }

  const trends = await buildTrends(user, "7d");
  const tips: string[] = trends.insights.map((i) => insightText(i, locale)).filter(Boolean);

  const answer = ru
    ? `На основе вашего дневника (${meals.length} приёмов): ${tips.join(" ") || "Баланс в целом стабильный."} Ваш вопрос: «${q}» — попробуйте добавить белок к завтраку и держать воду 2 л/день.`
    : `Based on your diary (${meals.length} meals): ${tips.join(" ") || "Overall balance looks steady."} Re: "${q}" — try adding protein at breakfast and ~2L water daily.`;

  return { answer };
}

export async function weeklyDigest(user: DbUser) {
  const pro = await isUserPro(user.id);
  if (!pro) throw new Error("PRO_REQUIRED");
  const report = await buildWeeklyReport(user);
  const trends = await buildTrends(user, "7d");
  const locale = user.locale ?? "en";
  return {
    ...report,
    insights: trends.insights.map((i) => insightText(i, locale)),
    avgCalories: trends.avgCalories,
    avgProtein: trends.avgProtein,
  };
}

export async function buildMealPlan(user: DbUser) {
  const pro = await isUserPro(user.id);
  if (!pro) throw new Error("PRO_REQUIRED");

  const favorites = await prisma.favoriteMeal.findMany({
    where: { userId: BigInt(user.id) },
    orderBy: { useCount: "desc" },
    take: 9,
  });

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slots = ["breakfast", "lunch", "dinner"] as const;
  const plan = days.map((day, di) => ({
    day,
    meals: slots.map((slot, si) => {
      const fav = favorites[(di * 3 + si) % Math.max(1, favorites.length)];
      if (fav) {
        return {
          slot,
          description: fav.description,
          calories: fav.calories,
          protein: fav.protein,
        };
      }
      return {
        slot,
        description: slot === "breakfast" ? "Oatmeal + fruit" : slot === "lunch" ? "Chicken salad" : "Fish + vegetables",
        calories: slot === "breakfast" ? 350 : slot === "lunch" ? 520 : 480,
        protein: slot === "breakfast" ? 12 : slot === "lunch" ? 35 : 40,
      };
    }),
  }));

  return { plan };
}

export async function shoppingListFromPlan(user: DbUser) {
  const { plan } = await buildMealPlan(user);
  const items = new Set<string>();
  for (const day of plan) {
    for (const meal of day.meals) {
      items.add(meal.description.split(/[,+]/)[0]?.trim() ?? meal.description);
    }
  }
  items.add("Vegetables");
  items.add("Water");
  return { items: [...items].slice(0, 20) };
}

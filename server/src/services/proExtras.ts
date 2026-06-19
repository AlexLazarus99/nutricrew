import * as mealsRepo from "../repositories/meals.js";
import { prisma } from "../db/client.js";
import { getPublicSocialLinks } from "../config.js";
import { buildTeamInviteUrl } from "../lib/inviteLink.js";
import { assertUserPro } from "../lib/assertPro.js";
import { grantStreakFreeze } from "../repositories/growth.js";
import { buildTrends } from "./trends.js";
import { buildMealPlan } from "./proFeatures.js";
import type { DbUser } from "../types.js";

export type ProGoalMode = "lose" | "maintain" | "gain";

function bmr(user: DbUser): number | null {
  if (user.weight_kg == null || user.height_cm == null || user.age == null) return null;
  return 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5;
}

export async function getProGoals(user: DbUser, mode: ProGoalMode = "maintain") {
  await assertUserPro(user.id);
  const base = bmr(user);
  const activity = base != null ? Math.round(base * 1.45) : null;
  const calorieTarget =
    activity != null
      ? mode === "lose"
        ? activity - 400
        : mode === "gain"
          ? activity + 300
          : activity
      : null;
  const proteinTarget = user.weight_kg != null ? Math.round(user.weight_kg * 1.8) : null;
  const waterMl = 2000;
  const steps = user.id ? 8000 : 8000;

  return {
    mode,
    calories: calorieTarget,
    protein: proteinTarget,
    waterMl,
    steps,
    explain:
      user.locale?.startsWith("ru")
        ? "Цели рассчитаны по весу, росту и возрасту из профиля."
        : "Goals are based on your profile weight, height, and age.",
  };
}

export async function buildFourWeekMealPlan(user: DbUser) {
  await assertUserPro(user.id);
  const { plan: week1 } = await buildMealPlan(user);
  const weeks = [week1];
  for (let w = 1; w < 4; w++) {
    weeks.push(
      week1.map((day, di) => ({
        ...day,
        day: `W${w + 1}-${day.day}`,
        meals: day.meals.map((meal, mi) => ({
          ...meal,
          description:
            w % 2 === 0
              ? meal.description
              : `${meal.description} (alt)`,
        })),
      })),
    );
  }
  return { weeks };
}

export async function plateReview(user: DbUser, description: string) {
  await assertUserPro(user.id);
  const text = description.trim().slice(0, 500);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 3);
  const meals = await mealsRepo.findMealsInRange(user.id, since, new Date());
  const avgProtein =
    meals.length > 0
      ? Math.round(meals.reduce((s, m) => s + m.protein, 0) / meals.length)
      : 0;
  const ru = user.locale?.startsWith("ru");
  const goals = await getProGoals(user, "maintain");

  const tips: string[] = [];
  if (goals.protein && avgProtein < goals.protein * 0.7) {
    tips.push(
      ru
        ? "Добавьте источник белка — курицу, рыбу, творог или бобовые."
        : "Add a protein source — chicken, fish, cottage cheese, or legumes.",
    );
  }
  if (/сладк|sweet|dessert|торт|cake/i.test(text)) {
    tips.push(
      ru
        ? "Много быстрых углеводов — попробуйте половину порции или замену на ягоды."
        : "Likely high in fast carbs — try half portion or swap sweets for berries.",
    );
  }
  if (tips.length === 0) {
    tips.push(
      ru
        ? "Сбалансированный приём — добавьте овощи и воду 250 мл."
        : "Looks balanced — add vegetables and ~250 ml water.",
    );
  }

  return {
    summary: ru
      ? `Разбор тарелки «${text}» с учётом вашего дневника.`
      : `Plate review for "${text}" based on your recent diary.`,
    tips,
    goals,
  };
}

export async function exportDiaryCsv(user: DbUser): Promise<string> {
  await assertUserPro(user.id);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const meals = await mealsRepo.findMealsInRange(user.id, since, new Date());
  const header = "date,description,calories,protein,carbs,fat,points";
  const rows = meals.map((m) => {
    const date = m.created_at.toISOString().slice(0, 10);
    const desc = `"${m.description.replace(/"/g, '""')}"`;
    return `${date},${desc},${m.calories},${m.protein},${m.carbs},${m.fat},${m.points}`;
  });
  return [header, ...rows].join("\n");
}

export async function getProPerks(user: DbUser) {
  await assertUserPro(user.id);
  const social = getPublicSocialLinks();
  const inviteCode = user.team_id
    ? (await prisma.team.findUnique({ where: { id: user.team_id }, select: { inviteCode: true } }))
        ?.inviteCode
    : null;
  const partnerInviteUrl = inviteCode
    ? buildTeamInviteUrl(inviteCode, user.telegram_id)
    : null;

  return {
    channelUrl: social.telegramChannel || null,
    partnerInviteUrl,
    birdBoostDiscountPercent: 50,
    priorityAi: true,
    monthlyFreezeIncluded: true,
  };
}

export async function grantMonthlyProFreeze(userId: number): Promise<boolean> {
  const monthKey = new Date().toISOString().slice(0, 7);
  const existing = await prisma.starTransaction.findFirst({
    where: {
      userId: BigInt(userId),
      type: "pro_monthly_freeze",
      createdAt: { gte: new Date(`${monthKey}-01T00:00:00.000Z`) },
    },
  });
  if (existing) return false;
  await grantStreakFreeze(userId, 1);
  await prisma.starTransaction.create({
    data: {
      userId: BigInt(userId),
      amount: 0,
      type: "pro_monthly_freeze",
      referenceId: monthKey,
    },
  });
  return true;
}

export async function buildDeficitSummary(user: DbUser, range: "7d" | "30d" | "90d" = "30d") {
  await assertUserPro(user.id);
  const trends = await buildTrends(user, range);
  const daily = trends.daily.map((d) => {
    const target = trends.kcalTarget ?? 0;
    const balance = target > 0 && d.meals > 0 ? d.calories - target : null;
    return { date: d.date, calories: d.calories, target, balance };
  });
  const logged = daily.filter((d) => d.balance != null);
  const totalBalance = logged.reduce((s, d) => s + (d.balance ?? 0), 0);
  const avgBalance =
    logged.length > 0 ? Math.round(totalBalance / logged.length) : 0;
  return {
    range,
    daily,
    avgBalance,
    totalBalance,
    projectedKgPerWeek: Math.round((avgBalance * 7) / 7700 * 10) / 10,
  };
}

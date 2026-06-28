import * as mealsRepo from "../repositories/meals.js";
import * as teamsRepo from "../repositories/teams.js";
import { getCurrentWeekKey } from "../lib/week.js";
import { buildTrends, insightText } from "./trends.js";
import { buildWeeklyNarrative } from "./aiNarrative.js";
import type { DbUser } from "../types.js";

function weekStartFromKey(weekKey: string): Date {
  const [y, w] = weekKey.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const start = new Date(jan4);
  start.setUTCDate(jan4.getUTCDate() - day + 1 + (w - 1) * 7);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export async function buildWeeklyReport(user: DbUser, weekKey = getCurrentWeekKey()) {
  const start = weekStartFromKey(weekKey);
  const end = new Date();
  const meals = await mealsRepo.findMealsInRange(user.id, start, end);

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      points: acc.points + m.points,
      count: acc.count + 1,
    }),
    { calories: 0, protein: 0, points: 0, count: 0 },
  );

  let teamRank: number | null = null;
  let teamPoints: number | null = null;
  let teamName: string | null = null;

  if (user.team_id) {
    const team = await teamsRepo.findById(user.team_id);
    teamName = team?.name ?? null;
    const board = await teamsRepo.getLeaderboard(weekKey, 50);
    const idx = board.findIndex((t) => t.team_id === user.team_id);
    if (idx >= 0) {
      teamRank = idx + 1;
      teamPoints = board[idx]!.points;
    }
  }

  const daysLogged = new Set(
    meals.map((m) => m.created_at.toISOString().slice(0, 10)),
  ).size;

  const trends = await buildTrends(user, "7d");
  const locale = user.locale ?? "en";

  const base = {
    weekKey,
    mealsLogged: totals.count,
    daysLogged,
    calories: totals.calories,
    protein: totals.protein,
    points: totals.points,
    streak: user.current_streak,
    longestStreak: user.longest_streak,
    teamName,
    teamRank,
    teamPoints,
    avgCaloriesPerMeal: totals.count ? Math.round(totals.calories / totals.count) : 0,
    insights: trends.insights.map((i) => insightText(i, locale)),
    avgCalories: trends.avgCalories,
    avgProtein: trends.avgProtein,
  };

  return {
    ...base,
    narrative: buildWeeklyNarrative(user, base),
  };
}

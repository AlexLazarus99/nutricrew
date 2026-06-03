import { QUEST_DEFINITIONS, getQuestById, type QuestDef, type QuestPeriod } from "../lib/questDefinitions.js";
import { getCurrentWeekKey, todayUtc } from "../lib/week.js";
import * as mealsRepo from "../repositories/meals.js";
import * as engagementRepo from "../repositories/engagement.js";
import * as birdGameRepo from "../repositories/birdGame.js";
import * as questsRepo from "../repositories/quests.js";
import * as teamsRepo from "../repositories/teams.js";
import * as usersRepo from "../repositories/users.js";
import type { DbUser } from "../types.js";

export type QuestStatus = "locked" | "active" | "ready" | "claimed";

export type QuestView = {
  id: string;
  period: QuestPeriod;
  titleKey: string;
  descKey: string;
  emoji: string;
  target: number;
  progress: number;
  status: QuestStatus;
  rewards: { xp: number; team: number; stars: number };
  periodKey: string;
};

export type QuestBoard = {
  daily: QuestView[];
  weekly: QuestView[];
  once: QuestView[];
  readyCount: number;
  claimedToday: number;
};

type QuestStats = {
  mealsToday: number;
  mealsWeek: number;
  streak: number;
  todayPoints: number;
  hasTeam: boolean;
  teamLoggedToday: number;
  gameBonusToday: boolean;
  quizBonusToday: boolean;
  birdBestScore: number;
  totalMeals: number;
};

function periodKeyFor(period: QuestPeriod): string {
  if (period === "daily") return todayUtc();
  if (period === "weekly") return getCurrentWeekKey();
  return "once";
}

function weekStartUtc(): Date {
  const key = getCurrentWeekKey();
  const [year, weekPart] = key.split("-W");
  const week = Number(weekPart);
  const jan4 = new Date(Date.UTC(Number(year), 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

async function loadStats(user: DbUser): Promise<QuestStats> {
  const mealsToday = await mealsRepo.countMealsToday(user.id);
  const mealsWeek = await mealsRepo.countMealsSince(user.id, weekStartUtc());
  const todayPoints = await mealsRepo.getTodayPoints(user.id);
  const dailyBonus = await engagementRepo.getDailyBonusStatus(user.id);
  const birdBest = await birdGameRepo.getBestScore(user.id);
  const totalMeals = await mealsRepo.countUserMeals(user.id);

  let teamLoggedToday = 0;
  if (user.team_id) {
    teamLoggedToday = await mealsRepo.countMembersLoggedToday(user.team_id);
  }

  return {
    mealsToday,
    mealsWeek,
    streak: user.current_streak,
    todayPoints,
    hasTeam: Boolean(user.team_id),
    teamLoggedToday,
    gameBonusToday: dailyBonus.game,
    quizBonusToday: dailyBonus.quiz,
    birdBestScore: birdBest?.score ?? 0,
    totalMeals,
  };
}

function evaluateProgress(def: QuestDef, stats: QuestStats): number {
  switch (def.metric) {
    case "meals_today":
      return stats.mealsToday;
    case "meals_week":
      return stats.mealsWeek;
    case "today_points":
      return stats.todayPoints;
    case "streak_days":
      if (def.id === "daily_streak") {
        return stats.streak >= 1 && stats.mealsToday >= 1 ? 1 : 0;
      }
      return stats.streak;
    case "has_team":
      if (def.id === "daily_crew_meal") {
        return stats.hasTeam && stats.mealsToday >= 1 ? 1 : 0;
      }
      return stats.hasTeam ? 1 : 0;
    case "team_logged_today":
      return stats.teamLoggedToday;
    case "daily_bonus_game":
      return stats.gameBonusToday ? 1 : 0;
    case "daily_bonus_quiz":
      return stats.quizBonusToday ? 1 : 0;
    case "bird_best_score":
      return stats.birdBestScore;
    case "total_meals":
      return stats.totalMeals;
    default:
      return 0;
  }
}

function isUnlocked(def: QuestDef, stats: QuestStats): boolean {
  if (def.period === "once") return true;
  if (def.id === "daily_crew_meal" || def.id === "once_join_team") {
    return stats.hasTeam;
  }
  if (def.id === "weekly_team_active") {
    return stats.hasTeam;
  }
  if (def.id === "daily_streak") {
    return stats.streak >= 1;
  }
  if (def.metric === "daily_bonus_game" || def.metric === "daily_bonus_quiz") {
    return true;
  }
  if (def.metric === "bird_best_score" && def.period === "weekly") {
    return true;
  }
  return true;
}

async function buildQuestView(
  user: DbUser,
  def: QuestDef,
  stats: QuestStats,
): Promise<QuestView> {
  const periodKey = periodKeyFor(def.period);
  const claimed = await questsRepo.isClaimed(user.id, def.id, periodKey);
  const progress = evaluateProgress(def, stats);
  const unlocked = isUnlocked(def, stats);

  let status: QuestStatus = "active";
  if (claimed) status = "claimed";
  else if (!unlocked) status = "locked";
  else if (progress >= def.target) status = "ready";

  return {
    id: def.id,
    period: def.period,
    titleKey: def.titleKey,
    descKey: def.descKey,
    emoji: def.emoji,
    target: def.target,
    progress: Math.min(progress, def.target),
    status,
    rewards: def.rewards,
    periodKey,
  };
}

export async function getQuestBoard(user: DbUser): Promise<QuestBoard> {
  const stats = await loadStats(user);
  const views = await Promise.all(
    QUEST_DEFINITIONS.map((def) => buildQuestView(user, def, stats)),
  );

  const daily = views.filter((q) => q.period === "daily").sort((a, b) => a.id.localeCompare(b.id));
  const weekly = views.filter((q) => q.period === "weekly");
  const once = views.filter((q) => q.period === "once");

  const sortOrder = Object.fromEntries(QUEST_DEFINITIONS.map((d) => [d.id, d.sort]));
  const sortFn = (a: QuestView, b: QuestView) => {
    const order = { ready: 0, active: 1, locked: 2, claimed: 3 };
    return (
      order[a.status] - order[b.status] ||
      (sortOrder[a.id] ?? 0) - (sortOrder[b.id] ?? 0)
    );
  };

  daily.sort(sortFn);
  weekly.sort(sortFn);
  once.sort(sortFn);

  const readyCount = views.filter((q) => q.status === "ready").length;
  const claimedToday = views.filter(
    (q) => q.period === "daily" && q.status === "claimed",
  ).length;

  return { daily, weekly, once, readyCount, claimedToday };
}

export async function claimQuest(
  user: DbUser,
  questId: string,
): Promise<{ ok: boolean; rewards?: QuestView["rewards"]; error?: string }> {
  const def = getQuestById(questId);
  if (!def) return { ok: false, error: "QUEST_NOT_FOUND" };

  const stats = await loadStats(user);
  const periodKey = periodKeyFor(def.period);

  if (await questsRepo.isClaimed(user.id, def.id, periodKey)) {
    return { ok: false, error: "ALREADY_CLAIMED" };
  }

  const progress = evaluateProgress(def, stats);
  if (!isUnlocked(def, stats)) {
    return { ok: false, error: "QUEST_LOCKED" };
  }
  if (progress < def.target) {
    return { ok: false, error: "QUEST_NOT_READY" };
  }

  await questsRepo.recordClaim({
    userId: user.id,
    questId: def.id,
    periodKey,
    rewardXp: def.rewards.xp,
    rewardTeam: def.rewards.team,
    rewardStars: def.rewards.stars,
  });

  if (user.team_id && def.rewards.team > 0) {
    await teamsRepo.addWeeklyPoints(user.team_id, getCurrentWeekKey(), def.rewards.team);
  }

  if (def.rewards.stars > 0) {
    await usersRepo.creditStars(
      user.id,
      def.rewards.stars,
      "quest_reward",
      `${def.id}:${periodKey}`,
    );
  }

  return { ok: true, rewards: def.rewards };
}

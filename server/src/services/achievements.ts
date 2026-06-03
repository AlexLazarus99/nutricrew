import * as growthRepo from "../repositories/growth.js";
import * as mealsRepo from "../repositories/meals.js";
import * as birdGameRepo from "../repositories/birdGame.js";
import { ACHIEVEMENTS } from "../lib/achievementDefinitions.js";
import { tierFromWeeklyXp } from "../lib/leagueTiers.js";
import type { DbUser } from "../types.js";

export async function checkAchievementsAfterMeal(user: DbUser, streak: number) {
  const unlocked: string[] = [];
  const tryUnlock = async (id: string) => {
    if (await growthRepo.unlockAchievement(user.id, id)) unlocked.push(id);
  };

  const totalMeals = await mealsRepo.countUserMeals(user.id);
  if (totalMeals >= 1) await tryUnlock("first_meal");
  if (totalMeals >= 50) await tryUnlock("meals_50");
  if (streak >= 7) await tryUnlock("streak_7");
  if (streak >= 30) await tryUnlock("streak_30");
  if (user.team_id) await tryUnlock("team_join");
  if (user.referred_by_user_id) await tryUnlock("referral_1");

  const best = await birdGameRepo.getBestScore(user.id);
  if (best && best.score >= 100) await tryUnlock("bird_100");

  return unlocked;
}

export async function checkAchievementsAfterChallenge(userId: number) {
  const ok = await growthRepo.unlockAchievement(userId, "challenge_done");
  return ok ? ["challenge_done"] : [];
}

export async function checkLeagueAchievement(userId: number, weeklyXp: number) {
  const tier = tierFromWeeklyXp(weeklyXp);
  if (tier === "gold" || tier === "platinum" || tier === "diamond") {
    const ok = await growthRepo.unlockAchievement(userId, "league_gold");
    return ok ? ["league_gold"] : [];
  }
  return [];
}

export async function getAchievementsBoard(userId: number) {
  const unlocked = await growthRepo.listAchievements(userId);
  const set = new Set(unlocked.map((u) => u.achievementId));
  return ACHIEVEMENTS.map((a) => ({
    id: a.id,
    titleKey: a.titleKey,
    descKey: a.descKey,
    emoji: a.emoji,
    unlocked: set.has(a.id),
    unlockedAt: unlocked.find((u) => u.achievementId === a.id)?.unlockedAt ?? null,
  }));
}

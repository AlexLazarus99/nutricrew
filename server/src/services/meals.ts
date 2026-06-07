import * as mealsRepo from "../repositories/meals.js";
import * as teamsRepo from "../repositories/teams.js";
import * as usersRepo from "../repositories/users.js";
import * as growthRepo from "../repositories/growth.js";
import { uploadMealPhoto } from "../storage/s3.js";
import { getCurrentWeekKey } from "../lib/week.js";
import { calculateMealPoints, maxMealsPerDay, teamMultiplier } from "./points.js";
import { computeNextStreak, streakMultiplier } from "./streak.js";
import { leagueXpForMeal, tierFromWeeklyXp } from "../lib/leagueTiers.js";
import { checkAchievementsAfterMeal, checkLeagueAchievement } from "./achievements.js";
import { validateMealInput } from "./mealValidation.js";
import { trackEvents } from "./analytics.js";
import type { DbUser } from "../types.js";
import type { MealAnalysis } from "../types.js";

const QUALITY_BONUS: Record<string, number> = {
  balanced: 1.08,
  light: 1.04,
  treat: 0.95,
  water: 1.02,
};

export async function logMealForUser(
  user: DbUser,
  input: {
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    analysis?: MealAnalysis;
    photoBase64?: string;
    mealSlot?: string;
    qualityTag?: string;
    favoriteId?: string;
  },
) {
  const mealsToday = await mealsRepo.countMealsToday(user.id);
  if (mealsToday >= maxMealsPerDay()) {
    throw new Error("DAILY_MEAL_LIMIT");
  }

  const validation = await validateMealInput(user.id, input);
  if (!validation.ok) {
    await trackEvents(user.id, [{ name: "meal_rejected", props: { reason: validation.error } }]);
    throw new Error(validation.error);
  }

  let basePoints = calculateMealPoints(input.calories, input.protein);
  if (validation.pointsPenalty > 0) {
    basePoints = Math.max(1, Math.round(basePoints * (1 - validation.pointsPenalty)));
  }
  const qMult = input.qualityTag ? (QUALITY_BONUS[input.qualityTag] ?? 1) : 1;
  basePoints = Math.round(basePoints * qMult);

  const streak = computeNextStreak(user);
  const personalMultiplier = streakMultiplier(streak.streak);

  const fields = await growthRepo.getUserGrowthFields(user.id);
  const weekKey = getCurrentWeekKey();
  let pointsMultiplier = 1;
  if (fields?.doublePointsWeekKey === weekKey) {
    pointsMultiplier = 2;
  }
  if (fields?.birdBoostUntil && fields.birdBoostUntil.getTime() > Date.now()) {
    pointsMultiplier *= 1.1;
  }

  let multiplier = 1;
  let teamPoints = 0;

  if (user.team_id) {
    const total = await mealsRepo.countTeamMembers(user.team_id);
    const logged = await mealsRepo.countMembersLoggedToday(user.team_id);
    multiplier = teamMultiplier(logged, total);
    teamPoints = Math.round(
      basePoints * personalMultiplier * multiplier * pointsMultiplier,
    );
  }

  const points = Math.round(basePoints * personalMultiplier * pointsMultiplier);

  let photoUrl: string | null = null;
  let photoKey: string | null = null;
  const hidePhoto = fields?.photoPrivacy === "hidden";
  if (input.photoBase64 && !hidePhoto) {
    const uploaded = await uploadMealPhoto(user.id, input.photoBase64);
    if (uploaded) {
      photoUrl = fields?.photoPrivacy === "private" ? null : uploaded.url;
      photoKey = uploaded.key;
    }
  }

  const meal = await mealsRepo.insertMeal({
    userId: user.id,
    teamId: user.team_id,
    description: input.description,
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    points,
    photoUrl,
    photoKey,
    aiSource: input.analysis?.source,
    aiConfidence: input.analysis?.confidence,
    mealSlot: input.mealSlot ?? null,
    qualityTag: input.qualityTag ?? null,
    imageHash: validation.imageHash,
    verificationStatus: validation.verificationStatus,
  });

  await trackEvents(user.id, [
    {
      name: "meal_logged",
      props: {
        calories: input.calories,
        hasPhoto: !!input.photoBase64,
        verification: validation.verificationStatus,
      },
    },
  ]);

  await usersRepo.updateStreak(
    user.id,
    streak.streak,
    streak.longest,
    streak.lastMealDate,
  );

  const birdBoostUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await growthRepo.setBirdBoostUntil(user.id, birdBoostUntil);
  await growthRepo.upsertFavorite(user.id, {
    description: input.description,
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
  });
  if (input.favoriteId) {
    await growthRepo.incrementFavoriteUse(input.favoriteId, user.id);
  }

  const leagueXp = leagueXpForMeal(points);
  const newWeeklyXp = (fields?.weeklyLeagueXp ?? 0) + leagueXp;
  const tier = tierFromWeeklyXp(newWeeklyXp);
  await growthRepo.addLeagueXp(user.id, leagueXp, tier);
  await growthRepo.addBattlePassXp(user.id, Math.max(8, Math.round(points * 0.5)));

  if (user.team_id) {
    const wk = getCurrentWeekKey();
    await teamsRepo.addWeeklyPoints(user.team_id, wk, teamPoints || points);
    await growthRepo.bumpTeamChallenge(user.team_id, 1);
    await growthRepo.addDuelPoints(user.team_id, user.id, teamPoints || points);
    const ch = await growthRepo.syncTeamChallengeProgress(user.team_id);
    if (ch.completedAt) {
      const { checkAchievementsAfterChallenge } = await import("./achievements.js");
      const members = await teamsRepo.getMembers(user.team_id);
      for (const m of members) {
        await checkAchievementsAfterChallenge(Number(m.id));
      }
    }
  }

  const { maybeRewardReferralFirstMeal } = await import("./referrals.js");
  await maybeRewardReferralFirstMeal(user);

  const newAchievements = await checkAchievementsAfterMeal(user, streak.streak);
  const leagueAchievements = await checkLeagueAchievement(user.id, newWeeklyXp);

  return {
    meal,
    points,
    teamPoints: teamPoints || points,
    streak: streak.streak,
    multiplier,
    personalMultiplier,
    photoUrl: fields?.photoPrivacy === "private" ? null : photoUrl,
    birdBoostUntil: birdBoostUntil.toISOString(),
    newAchievements: [...newAchievements, ...leagueAchievements],
  };
}

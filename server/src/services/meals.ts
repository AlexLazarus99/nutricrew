import * as mealsRepo from "../repositories/meals.js";
import * as teamsRepo from "../repositories/teams.js";
import * as usersRepo from "../repositories/users.js";
import { uploadMealPhoto } from "../storage/s3.js";
import { getCurrentWeekKey } from "../lib/week.js";
import { calculateMealPoints, teamMultiplier } from "./points.js";
import { computeNextStreak, streakMultiplier } from "./streak.js";
import type { DbUser } from "../types.js";
import type { MealAnalysis } from "../types.js";

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
  },
) {
  const basePoints = calculateMealPoints(input.calories, input.protein);
  const streak = computeNextStreak(user);
  const personalMultiplier = streakMultiplier(streak.streak);

  let multiplier = 1;
  let teamPoints = 0;

  if (user.team_id) {
    const total = await mealsRepo.countTeamMembers(user.team_id);
    const logged = await mealsRepo.countMembersLoggedToday(user.team_id);
    multiplier = teamMultiplier(logged, total);
    teamPoints = Math.round(basePoints * personalMultiplier * multiplier);
  }

  const points = Math.round(basePoints * personalMultiplier);

  let photoUrl: string | null = null;
  let photoKey: string | null = null;
  if (input.photoBase64) {
    const uploaded = await uploadMealPhoto(user.id, input.photoBase64);
    if (uploaded) {
      photoUrl = uploaded.url;
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
  });

  await usersRepo.updateStreak(
    user.id,
    streak.streak,
    streak.longest,
    streak.lastMealDate,
  );

  if (user.team_id) {
    const weekKey = getCurrentWeekKey();
    await teamsRepo.addWeeklyPoints(user.team_id, weekKey, teamPoints || points);
  }

  const { maybeRewardReferralFirstMeal } = await import("./referrals.js");
  await maybeRewardReferralFirstMeal(user);

  return {
    meal,
    points,
    teamPoints: teamPoints || points,
    streak: streak.streak,
    multiplier,
    personalMultiplier,
    photoUrl,
  };
}

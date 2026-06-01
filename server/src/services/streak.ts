import type { DbUser } from "../types.js";
import { todayUtc, yesterdayUtc } from "../lib/week.js";

export function computeNextStreak(user: DbUser): {
  streak: number;
  longest: number;
  lastMealDate: string;
} {
  const today = todayUtc();
  const yesterday = yesterdayUtc();

  if (user.last_meal_date === today) {
    return {
      streak: user.current_streak,
      longest: user.longest_streak,
      lastMealDate: today,
    };
  }

  let streak = 1;
  if (user.last_meal_date === yesterday) {
    streak = user.current_streak + 1;
  }

  const longest = Math.max(user.longest_streak, streak);

  return { streak, longest, lastMealDate: today };
}

export function streakMultiplier(streak: number): number {
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.3;
  if (streak >= 3) return 1.15;
  return 1;
}

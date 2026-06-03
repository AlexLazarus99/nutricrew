import type { Team, User, Meal } from "@prisma/client";
import type { DbTeam, DbUser } from "../types.js";

export function mapUser(u: User): DbUser {
  return {
    id: Number(u.id),
    telegram_id: Number(u.telegramId),
    first_name: u.firstName,
    last_name: u.lastName,
    username: u.username,
    locale: u.locale as DbUser["locale"],
    current_streak: u.currentStreak,
    longest_streak: u.longestStreak,
    last_meal_date: u.lastMealDate
      ? u.lastMealDate.toISOString().slice(0, 10)
      : null,
    team_id: u.teamId,
    star_balance: u.starBalance,
    weight_kg: u.weightKg,
    height_cm: u.heightCm,
    age: u.age,
    timezone_offset_minutes: u.timezoneOffsetMinutes,
    referred_by_user_id: u.referredByUserId ? Number(u.referredByUserId) : null,
    created_at: u.createdAt,
  };
}

export function mapTeam(t: Team): DbTeam {
  return {
    id: t.id,
    name: t.name,
    invite_code: t.inviteCode,
    weekly_goal_type: t.weeklyGoalType as DbTeam["weekly_goal_type"],
    weekly_goal_target: t.weeklyGoalTarget,
    is_premium: t.isPremium,
    premium_until: t.premiumUntil,
    league_tag: t.leagueTag ?? null,
    created_at: t.createdAt,
  };
}

export function mapMeal(m: Meal) {
  return {
    id: m.id,
    user_id: Number(m.userId),
    team_id: m.teamId,
    description: m.description,
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    points: m.points,
    photo_url: m.photoUrl,
    photo_key: m.photoKey,
    ai_source: m.aiSource,
    ai_confidence: m.aiConfidence,
    created_at: m.createdAt,
  };
}

export type AppLocale = "en" | "ru";

export type WeeklyGoalType = "points" | "protein" | "calories";

export type PaymentType = "pool_fund" | "premium" | "bird_unlock";

export interface DbUser {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  locale: AppLocale;
  current_streak: number;
  longest_streak: number;
  last_meal_date: string | null;
  team_id: string | null;
  star_balance: number;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  timezone_offset_minutes: number | null;
  referred_by_user_id: number | null;
  created_at: Date;
}

export type DailyBonusType = "game" | "quiz";

export interface DbTeam {
  id: string;
  name: string;
  invite_code: string;
  weekly_goal_type: WeeklyGoalType;
  weekly_goal_target: number;
  is_premium: boolean;
  premium_until: Date | null;
  league_tag: string | null;
  created_at: Date;
}

export interface MealAnalysis {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  source: "openai" | "fallback";
}

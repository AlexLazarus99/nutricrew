export type AppLocale =
  | "en"
  | "ru"
  | "fr"
  | "es"
  | "de"
  | "tr"
  | "pt"
  | "sv"
  | "it"
  | "ar"
  | "pl"
  | "zh"
  | "hi";

export type WeeklyGoalType = "points" | "protein" | "calories";

export type PaymentType = "pool_fund" | "premium" | "bird_unlock" | "user_pro";

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

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "drink"
  | "unknown";

export type VisionFallbackReason = "no_key" | "api_error" | "parse_error";

export interface MealAnalysis {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Estimated total portion weight in grams (not per 100 g). */
  servingGrams?: number;
  confidence: number;
  mealType?: MealType;
  source:
    | "claude"
    | "openai"
    | "gemini"
    | "fallback"
    | "catalog"
    | "barcode"
    | "barcode_ai"
    | "voice"
    | "photo_only";
  visionReason?: VisionFallbackReason;
  visionHint?: string;
  imageHash?: string;
  cacheHit?: boolean;
  /** Micronutrient / vitamin bullet points (localized). */
  nutritionRemarks?: string[];
  /** Short encyclopedic nutrition fact. */
  encyclopediaNote?: string;
}

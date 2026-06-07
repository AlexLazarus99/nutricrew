import * as mealsRepo from "../repositories/meals.js";
import * as analyticsRepo from "../repositories/analytics.js";
import { hashImageBase64 } from "../lib/imageHash.js";
import type { MealAnalysis } from "../types.js";
import { isUserPro } from "./userPro.js";

export type MealValidationError =
  | "NOT_FOOD"
  | "DUPLICATE_PHOTO"
  | "MACRO_OUT_OF_RANGE"
  | "ANALYZE_LIMIT"
  | "CALORIE_MISMATCH";

export type MealValidationResult =
  | { ok: true; imageHash: string | null; verificationStatus: string; pointsPenalty: number }
  | { ok: false; error: MealValidationError };

const FREE_ANALYZE_LIMIT = 20;
const PRO_ANALYZE_LIMIT = 80;

export async function validateMealInput(
  userId: number,
  input: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    photoBase64?: string;
    analysis?: MealAnalysis;
  },
): Promise<MealValidationResult> {
  if (
    input.calories < 0 ||
    input.calories > 5000 ||
    input.protein < 0 ||
    input.protein > 400 ||
    input.carbs < 0 ||
    input.carbs > 800 ||
    input.fat < 0 ||
    input.fat > 400
  ) {
    return { ok: false, error: "MACRO_OUT_OF_RANGE" };
  }

  let imageHash: string | null = null;
  if (input.photoBase64) {
    imageHash = hashImageBase64(input.photoBase64);

    const pro = await isUserPro(userId);
    const analyzeLimit = pro ? PRO_ANALYZE_LIMIT : FREE_ANALYZE_LIMIT;
    const analyzesToday = await analyticsRepo.countEventsToday(userId, "meal_analyze");
    if (analyzesToday > analyzeLimit) {
      return { ok: false, error: "ANALYZE_LIMIT" };
    }

    if (input.analysis?.source === "openai" && (input.analysis.confidence ?? 0) < 0.3) {
      return { ok: false, error: "NOT_FOOD" };
    }

    const dup = await mealsRepo.findRecentMealByImageHash(userId, imageHash, 24);
    if (dup) {
      return { ok: false, error: "DUPLICATE_PHOTO" };
    }
  }

  let verificationStatus = "ok";
  let pointsPenalty = 0;

  if (input.analysis?.source === "openai" && input.analysis.calories > 0) {
    const diff = Math.abs(input.calories - input.analysis.calories) / input.analysis.calories;
    if (diff > 0.45) {
      verificationStatus = "macro_adjusted";
      pointsPenalty = 0.15;
    }
  }

  if (!input.photoBase64 && !input.analysis) {
    verificationStatus = "manual";
  }

  return { ok: true, imageHash, verificationStatus, pointsPenalty };
}

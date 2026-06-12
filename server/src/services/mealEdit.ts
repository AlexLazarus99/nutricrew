import * as mealsRepo from "../repositories/meals.js";

export type MealPatchInput = {
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealSlot?: string | null;
  qualityTag?: string | null;
};

function clampMacro(n: number, max = 10000) {
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(max, Math.round(n));
}

export function validateMealPatch(input: MealPatchInput): { ok: true; patch: MealPatchInput } | { ok: false; error: string } {
  const patch: MealPatchInput = {};
  if (input.description !== undefined) {
    const d = String(input.description).trim();
    if (d.length < 2 || d.length > 500) return { ok: false, error: "INVALID_DESCRIPTION" };
    patch.description = d;
  }
  if (input.calories !== undefined) {
    const c = clampMacro(Number(input.calories), 15000);
    if (c == null) return { ok: false, error: "INVALID_CALORIES" };
    patch.calories = c;
  }
  if (input.protein !== undefined) {
    const p = clampMacro(Number(input.protein), 2000);
    if (p == null) return { ok: false, error: "INVALID_PROTEIN" };
    patch.protein = p;
  }
  if (input.carbs !== undefined) {
    const c = clampMacro(Number(input.carbs), 2000);
    if (c == null) return { ok: false, error: "INVALID_CARBS" };
    patch.carbs = c;
  }
  if (input.fat !== undefined) {
    const f = clampMacro(Number(input.fat), 2000);
    if (f == null) return { ok: false, error: "INVALID_FAT" };
    patch.fat = f;
  }
  if (input.mealSlot !== undefined) patch.mealSlot = input.mealSlot;
  if (input.qualityTag !== undefined) patch.qualityTag = input.qualityTag;
  if (Object.keys(patch).length === 0) return { ok: false, error: "EMPTY_PATCH" };
  return { ok: true, patch };
}

export async function patchMealForUser(userId: number, mealId: string, input: MealPatchInput) {
  const v = validateMealPatch(input);
  if (!v.ok) throw new Error(v.error);
  const updated = await mealsRepo.updateMealForUser(mealId, userId, v.patch);
  if (!updated) throw new Error("MEAL_NOT_FOUND");
  return updated;
}

export async function deleteMealForUser(userId: number, mealId: string) {
  const ok = await mealsRepo.softDeleteMealForUser(mealId, userId);
  if (!ok) throw new Error("MEAL_NOT_FOUND");
  return { ok: true };
}

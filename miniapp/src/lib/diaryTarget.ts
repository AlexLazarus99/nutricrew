import {
  DEFAULT_BMR_FORMULA,
  type CalorieGoal,
  type CalorieInput,
  calcCalories,
  loadCalcPrefs,
  validateInput,
} from "./calorieCalculator";

export type ProfileForTarget = {
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
};

export function localDayBounds(date: Date): { dayStart: Date; dayEnd: Date } {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { dayStart, dayEnd };
}

export function resolveDailyTargetKcal(profile: ProfileForTarget): number | null {
  const prefs = loadCalcPrefs();
  const weightKg = prefs.weightKg ?? profile.weightKg ?? null;
  const heightCm = prefs.heightCm ?? profile.heightCm ?? null;
  const age = prefs.age ?? profile.age ?? null;

  if (weightKg == null || heightCm == null || age == null) return null;

  const input: CalorieInput = {
    sex: prefs.sex ?? "female",
    age,
    weightKg,
    heightCm,
    activity: prefs.activity ?? "moderate",
    goal: prefs.goal ?? "maintain",
    bmrFormula: prefs.bmrFormula ?? DEFAULT_BMR_FORMULA,
  };

  if (validateInput(input)) return null;
  return calcCalories(input).target;
}

export function resolveDailyGoal(): CalorieGoal {
  return loadCalcPrefs().goal ?? "maintain";
}

export type DayBalance = {
  target: number;
  eaten: number;
  remaining: number;
  status: "deficit" | "surplus" | "onTrack";
};

export function calcDayBalance(target: number, eaten: number): DayBalance {
  const remaining = target - eaten;
  let status: DayBalance["status"] = "onTrack";
  if (remaining > 150) status = "deficit";
  else if (remaining < -150) status = "surplus";
  return { target, eaten, remaining, status };
}

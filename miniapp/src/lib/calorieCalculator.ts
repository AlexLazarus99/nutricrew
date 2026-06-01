export type Sex = "male" | "female";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive";

export type CalorieGoal =
  | "maintain"
  | "loseSlow"
  | "loseModerate"
  | "loseFast"
  | "gainSlow"
  | "gainModerate";

export type BmrFormulaId =
  | "mifflin"
  | "harrisBenedict"
  | "harrisBenedictOriginal"
  | "owen"
  | "schofield";

export const BMR_FORMULA_IDS: BmrFormulaId[] = [
  "mifflin",
  "harrisBenedict",
  "harrisBenedictOriginal",
  "owen",
  "schofield",
];

export const DEFAULT_BMR_FORMULA: BmrFormulaId = "mifflin";

export type CalorieInput = {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
  goal: CalorieGoal;
  bmrFormula: BmrFormulaId;
};

export type MacroSplit = {
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
};

export type FormulaEstimate = {
  id: BmrFormulaId;
  bmr: number;
  tdee: number;
  target: number;
};

export type CalorieResult = {
  bmr: number;
  tdee: number;
  target: number;
  adjustment: number;
  weeklyKgChange: number;
  belowSafeMinimum: boolean;
  safeMinimum: number;
  macros: MacroSplit;
  formula: BmrFormulaId;
  allFormulas: FormulaEstimate[];
  averageBmr: number;
  averageTdee: number;
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

const GOAL_ADJUSTMENTS: Record<CalorieGoal, number> = {
  maintain: 0,
  loseSlow: -250,
  loseModerate: -500,
  loseFast: -750,
  gainSlow: 250,
  gainModerate: 500,
};

const KCAL_PER_KG = 7700;

/** Mifflin–St Jeor (1990). */
export function bmrMifflinStJeor(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

/** Harris–Benedict revised — Roza & Shizgal (1984). */
export function bmrHarrisBenedict(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  if (sex === "male") {
    return Math.round(88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age);
  }
  return Math.round(447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age);
}

/** Harris–Benedict original (1919), metric coefficients. */
export function bmrHarrisBenedictOriginal(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  if (sex === "male") {
    return Math.round(66.473 + 13.7516 * weightKg + 5.0033 * heightCm - 6.755 * age);
  }
  return Math.round(655.0955 + 9.5634 * weightKg + 1.8496 * heightCm - 4.6756 * age);
}

/** Owen et al. (1986) — weight-based resting estimate. */
export function bmrOwen(sex: Sex, weightKg: number): number {
  return Math.round(sex === "male" ? 879 + 10.2 * weightKg : 795 + 7.18 * weightKg);
}

/** Schofield/WHO (1985) — age-stratified. */
export function bmrSchofield(sex: Sex, weightKg: number, age: number): number {
  if (age < 18) {
    return Math.round(sex === "male" ? 16.25 * weightKg + 137.2 : 8.365 * weightKg + 465.4);
  }
  if (age < 30) {
    return Math.round(sex === "male" ? 15.057 * weightKg + 692.2 : 14.818 * weightKg + 486.6);
  }
  if (age < 60) {
    return Math.round(sex === "male" ? 11.472 * weightKg + 873.1 : 8.126 * weightKg + 845.6);
  }
  return Math.round(sex === "male" ? 11.711 * weightKg + 587.7 : 9.082 * weightKg + 658.5);
}

const BMR_CALCULATORS: Record<
  BmrFormulaId,
  (sex: Sex, weightKg: number, heightCm: number, age: number) => number
> = {
  mifflin: bmrMifflinStJeor,
  harrisBenedict: bmrHarrisBenedict,
  harrisBenedictOriginal: bmrHarrisBenedictOriginal,
  owen: (sex, weightKg) => bmrOwen(sex, weightKg),
  schofield: (sex, weightKg, _heightCm, age) => bmrSchofield(sex, weightKg, age),
};

export function calcBmrByFormula(
  formula: BmrFormulaId,
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  return BMR_CALCULATORS[formula](sex, weightKg, heightCm, age);
}

/** @deprecated Use calcBmrByFormula("mifflin", …). */
export function calcBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return bmrMifflinStJeor(sex, weightKg, heightCm, age);
}

export function calcTdee(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

function safeMinimum(sex: Sex): number {
  return sex === "male" ? 1500 : 1200;
}

function applyGoalToTdee(
  tdee: number,
  goal: CalorieGoal,
  sex: Sex,
): { target: number; belowSafeMinimum: boolean; safeMinimum: number } {
  const adjustment = GOAL_ADJUSTMENTS[goal];
  const min = safeMinimum(sex);
  const rawTarget = tdee + adjustment;
  const belowSafeMinimum = rawTarget < min && adjustment < 0;
  const target = belowSafeMinimum ? min : Math.round(rawTarget);
  return { target, belowSafeMinimum, safeMinimum: min };
}

function macroSplit(targetKcal: number, goal: CalorieGoal, weightKg: number): MacroSplit {
  const isLoss = goal.startsWith("lose");
  const isGain = goal.startsWith("gain");

  const proteinPerKg = isLoss ? 1.8 : isGain ? 1.6 : 1.4;
  const proteinG = Math.round(proteinPerKg * weightKg);
  const proteinKcal = proteinG * 4;

  let fatPct = isLoss ? 0.28 : 0.3;
  let carbsPct = 1 - proteinKcal / targetKcal - fatPct;

  if (carbsPct < 0.25) {
    carbsPct = 0.25;
    fatPct = 1 - proteinKcal / targetKcal - carbsPct;
  }

  const fatKcal = targetKcal * fatPct;
  const carbsKcal = targetKcal * carbsPct;

  return {
    proteinG,
    carbsG: Math.round(carbsKcal / 4),
    fatG: Math.round(fatKcal / 9),
    proteinPct: Math.round((proteinKcal / targetKcal) * 100),
    carbsPct: Math.round((carbsKcal / targetKcal) * 100),
    fatPct: Math.round((fatKcal / targetKcal) * 100),
  };
}

export function calcAllFormulaEstimates(input: CalorieInput): FormulaEstimate[] {
  return BMR_FORMULA_IDS.map((id) => {
    const bmr = calcBmrByFormula(id, input.sex, input.weightKg, input.heightCm, input.age);
    const tdee = calcTdee(bmr, input.activity);
    const { target } = applyGoalToTdee(tdee, input.goal, input.sex);
    return { id, bmr, tdee, target };
  });
}

export function calcCalories(input: CalorieInput): CalorieResult {
  const allFormulas = calcAllFormulaEstimates(input);
  const primary = allFormulas.find((f) => f.id === input.bmrFormula) ?? allFormulas[0];
  const bmr = primary.bmr;
  const tdee = primary.tdee;
  const { target, belowSafeMinimum, safeMinimum: min } = applyGoalToTdee(tdee, input.goal, input.sex);
  const effectiveAdjustment = target - tdee;
  const weeklyKgChange = Number(((effectiveAdjustment * 7) / KCAL_PER_KG).toFixed(2));
  const averageBmr = Math.round(allFormulas.reduce((sum, f) => sum + f.bmr, 0) / allFormulas.length);
  const averageTdee = Math.round(allFormulas.reduce((sum, f) => sum + f.tdee, 0) / allFormulas.length);

  return {
    bmr,
    tdee,
    target,
    adjustment: effectiveAdjustment,
    weeklyKgChange,
    belowSafeMinimum,
    safeMinimum: min,
    macros: macroSplit(target, input.goal, input.weightKg),
    formula: primary.id,
    allFormulas,
    averageBmr,
    averageTdee,
  };
}

export function validateInput(input: Partial<CalorieInput>): string | null {
  if (!input.sex) return "sex";
  if (!input.age || input.age < 14 || input.age > 100) return "age";
  if (!input.weightKg || input.weightKg < 30 || input.weightKg > 300) return "weight";
  if (!input.heightCm || input.heightCm < 120 || input.heightCm > 230) return "height";
  if (!input.activity) return "activity";
  if (!input.goal) return "goal";
  if (input.bmrFormula && !BMR_FORMULA_IDS.includes(input.bmrFormula)) return "bmrFormula";
  return null;
}

export const CALC_STORAGE_KEY = "nutricrew_calorie_calc";

export type SavedCalcPrefs = Pick<
  CalorieInput,
  "sex" | "age" | "weightKg" | "heightCm" | "activity" | "goal"
> & {
  bmrFormula?: BmrFormulaId;
};

export function loadCalcPrefs(): Partial<SavedCalcPrefs> {
  try {
    const raw = localStorage.getItem(CALC_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedCalcPrefs) : {};
  } catch {
    return {};
  }
}

export function saveCalcPrefs(prefs: SavedCalcPrefs): void {
  localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(prefs));
}

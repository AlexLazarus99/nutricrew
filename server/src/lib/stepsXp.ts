/** 10 league XP per 1000 steps; full daily cap at goal (default 8000 → 80 XP). */
export const STEPS_PER_XP_UNIT = 1000;
export const XP_PER_STEP_UNIT = 10;

export function maxStepsXpForGoal(goalSteps: number): number {
  const goal = Math.max(1000, Math.round(goalSteps));
  return Math.floor(goal / STEPS_PER_XP_UNIT) * XP_PER_STEP_UNIT;
}

/** XP earned from step count, capped by daily goal proportion. */
export function eligibleStepsXp(steps: number, goalSteps: number): number {
  const safeSteps = Math.max(0, Math.round(steps));
  const cap = maxStepsXpForGoal(goalSteps);
  const raw = Math.floor(safeSteps / STEPS_PER_XP_UNIT) * XP_PER_STEP_UNIT;
  return Math.min(cap, raw);
}

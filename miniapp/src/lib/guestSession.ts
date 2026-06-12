const MEAL_LOG_COUNT_KEY = "nutricrew_meal_log_count";
export const PROFILE_REQUIRED_AFTER = 3;

export function getMealLogCount(): number {
  try {
    const raw = localStorage.getItem(MEAL_LOG_COUNT_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function incrementMealLogCount(): number {
  const next = getMealLogCount() + 1;
  try {
    localStorage.setItem(MEAL_LOG_COUNT_KEY, String(next));
  } catch {
    /* private mode */
  }
  return next;
}

export function shouldRequireProfile(profileComplete: boolean): boolean {
  if (profileComplete) return false;
  return getMealLogCount() >= PROFILE_REQUIRED_AFTER;
}

export function mealsUntilProfileRequired(): number {
  return Math.max(0, PROFILE_REQUIRED_AFTER - getMealLogCount());
}

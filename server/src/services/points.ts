const MAX_MEAL_POINTS = 85;
const MAX_MEALS_PER_DAY = 24;

export function calculateMealPoints(calories: number, protein: number): number {
  const base = Math.round(calories / 10);
  const proteinBonus = Math.round(protein / 5);
  return Math.min(MAX_MEAL_POINTS, Math.max(5, base + proteinBonus));
}

export function maxMealsPerDay(): number {
  return MAX_MEALS_PER_DAY;
}

export function teamMultiplier(loggedToday: number, totalMembers: number): number {
  if (totalMembers <= 0) return 1;
  const ratio = loggedToday / totalMembers;
  if (ratio >= 1) return 1.5;
  if (ratio >= 0.75) return 1.25;
  if (ratio >= 0.5) return 1.1;
  return 1;
}

/** Client-side mirror of server/src/services/points.ts for instant UI feedback. */

const MAX_MEAL_POINTS = 85;

export function estimateMealPoints(calories: number, protein: number): number {
  const base = Math.round(calories / 10);
  const proteinBonus = Math.round(protein / 5);
  return Math.min(MAX_MEAL_POINTS, Math.max(5, base + proteinBonus));
}

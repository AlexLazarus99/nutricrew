export const LEAGUE_TIERS = ["bronze", "silver", "gold", "platinum", "diamond"] as const;
export type LeagueTier = (typeof LEAGUE_TIERS)[number];

const XP_THRESHOLDS: Record<LeagueTier, number> = {
  bronze: 0,
  silver: 120,
  gold: 350,
  platinum: 800,
  diamond: 1500,
};

export function tierFromWeeklyXp(xp: number): LeagueTier {
  if (xp >= XP_THRESHOLDS.diamond) return "diamond";
  if (xp >= XP_THRESHOLDS.platinum) return "platinum";
  if (xp >= XP_THRESHOLDS.gold) return "gold";
  if (xp >= XP_THRESHOLDS.silver) return "silver";
  return "bronze";
}

export function xpToNextTier(tier: LeagueTier, xp: number): number {
  const order = LEAGUE_TIERS;
  const idx = order.indexOf(tier);
  if (idx >= order.length - 1) return 0;
  const next = order[idx + 1]!;
  return Math.max(0, XP_THRESHOLDS[next] - xp);
}

export function leagueXpForMeal(points: number): number {
  return Math.max(5, Math.round(points * 0.6));
}

export type SeasonId = "winter" | "spring" | "summer" | "autumn" | "holiday";

export type SeasonInfo = {
  id: SeasonId;
  nutritionMult: number;
  dailyTargetDelta: number;
  dailyRewardStars: number;
  scoreLabelKey: string;
};

const SEASONS: Record<SeasonId, Omit<SeasonInfo, "id">> = {
  winter: { nutritionMult: 1, dailyTargetDelta: 0, dailyRewardStars: 5, scoreLabelKey: "game.seasonWinter" },
  spring: { nutritionMult: 1.05, dailyTargetDelta: -2, dailyRewardStars: 5, scoreLabelKey: "game.seasonSpring" },
  summer: { nutritionMult: 1.12, dailyTargetDelta: 0, dailyRewardStars: 6, scoreLabelKey: "game.seasonSummer" },
  autumn: { nutritionMult: 1.08, dailyTargetDelta: -2, dailyRewardStars: 5, scoreLabelKey: "game.seasonAutumn" },
  holiday: { nutritionMult: 1, dailyTargetDelta: 0, dailyRewardStars: 10, scoreLabelKey: "game.seasonHoliday" },
};

function seasonForMonth(month: number): SeasonId {
  if (month === 11 || month === 0) return "holiday";
  if (month <= 1) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "autumn";
}

export function getCurrentSeason(now = new Date()): SeasonInfo {
  const id = seasonForMonth(now.getUTCMonth());
  return { id, ...SEASONS[id] };
}

export function dailyTargetForSeason(baseTarget: number, season: SeasonInfo): number {
  return Math.max(12, baseTarget + season.dailyTargetDelta);
}

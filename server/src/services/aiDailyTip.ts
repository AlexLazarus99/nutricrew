import * as analyticsRepo from "../repositories/analytics.js";
import { buildTrends, insightText } from "./trends.js";
import { getUserAiTier } from "./userAiTier.js";
import type { DbUser } from "../types.js";

export async function buildDailyAiTip(user: DbUser): Promise<string | null> {
  const tier = await getUserAiTier(user.id);
  if (tier === "free") return null;

  const alreadySent = await analyticsRepo.countEventsToday(user.id, "daily_ai_tip");
  if (alreadySent > 0) return null;

  const ru = user.locale?.startsWith("ru");
  const trends = await buildTrends(user, "7d");
  const locale = user.locale ?? "en";

  if (trends.daysLogged === 0) {
    return ru
      ? "💡 Совет дня: сфотографируй первый приём пищи — ИИ посчитает калории за секунды."
      : "💡 Daily tip: photograph your first meal — AI counts calories in seconds.";
  }

  const insight = trends.insights[0]
    ? insightText(trends.insights[0], locale)
    : null;

  if (insight) {
    return ru ? `💡 Совет дня: ${insight}` : `💡 Daily tip: ${insight}`;
  }

  if (tier === "pro") {
    return ru
      ? `💡 Pro: средняя калорийность ${trends.avgCalories} ккал/день — сравни с целью в трендах.`
      : `💡 Pro: avg ${trends.avgCalories} kcal/day — compare with your target in Trends.`;
  }

  return ru
    ? "💡 Совет дня: логируй каждый приём — команда и серия растут быстрее."
    : "💡 Daily tip: log every meal — your team and streak grow faster.";
}

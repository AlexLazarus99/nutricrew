import { api } from "../api/client";

export async function tryClaimDailyBonus(type: "game" | "quiz"): Promise<string | null> {
  try {
    const res = await api.claimDailyBonus(type);
    if (res.claimed && res.points > 0) {
      return String(res.points);
    }
  } catch {
    /* ignore */
  }
  return null;
}

import { api, type BirdGameMetaResponse } from "../../api/client";

let cached: BirdGameMetaResponse | null = null;

export async function fetchGameMeta(): Promise<BirdGameMetaResponse> {
  try {
    cached = await api.getGameMeta();
    return cached;
  } catch {
    return (
      cached ?? {
        daily: { best: 0, target: 22, done: false, claimed: false, rewardStars: 5 },
        upgrades: { ghostLevel: 0, gapLevel: 0, nearMissLevel: 0 },
        upgradeCosts: { ghost: 800, gap: 800, nearMiss: 800 },
        birdBoost: { active: false },
        season: { id: "spring", rewardStars: 5 },
      }
    );
  }
}

export async function claimDailyChallenge(): Promise<{ rewardStars: number; starBalance: number } | null> {
  try {
    return await api.claimBirdDaily();
  } catch {
    return null;
  }
}

export async function purchaseBirdUpgrade(
  kind: "ghost" | "gap" | "nearMiss",
): Promise<boolean> {
  try {
    await api.purchaseBirdUpgrade(kind);
    cached = null;
    return true;
  } catch {
    return false;
  }
}

export async function fetchDuelOpponent(score: number) {
  try {
    const data = await api.getBirdDuel(score);
    return data.opponent;
  } catch {
    return null;
  }
}

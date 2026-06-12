import { prisma } from "../db/client.js";

export function scoreAnomalyFlags(score: number, durationSec: number, fruits: number) {
  const flags: string[] = [];
  if (score > 5000) flags.push("score_extreme");
  if (durationSec > 0 && score / durationSec > 120) flags.push("score_velocity");
  if (fruits > score / 2) flags.push("fruit_ratio");
  return flags;
}

export async function validateBirdScoreSubmit(
  userId: number,
  score: number,
  flights: number,
  fruits: number,
) {
  const durationSec = Math.max(1, flights * 2);
  const flags = scoreAnomalyFlags(score, durationSec, fruits);
  if (flags.includes("score_extreme") || flags.includes("score_velocity")) {
    return { ok: false, flags, error: "SCORE_REJECTED" };
  }

  const recent = await prisma.birdGameBest.findUnique({ where: { userId: BigInt(userId) } });
  if (recent && score > recent.score * 4 && score > 800) {
    return { ok: false, flags: [...flags, "jump_vs_best"], error: "SCORE_REVIEW" };
  }

  return { ok: true, flags };
}

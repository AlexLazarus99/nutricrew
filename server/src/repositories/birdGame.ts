import { prisma } from "../db/client.js";

export type BirdLeaderboardRow = {
  user_id: number;
  score: number;
  level: number;
  fruits: number;
  display_name: string;
};

export async function upsertBestScore(
  userId: number,
  displayName: string,
  score: number,
  level: number,
  fruits: number,
): Promise<boolean> {
  const uid = BigInt(userId);
  const existing = await prisma.birdGameBest.findUnique({ where: { userId: uid } });
  if (existing && existing.score >= score) return false;

  await prisma.birdGameBest.upsert({
    where: { userId: uid },
    create: { userId: uid, displayName, score, level, fruits },
    update: { displayName, score, level, fruits },
  });
  return true;
}

export async function getBestScore(userId: number): Promise<{ score: number } | null> {
  const row = await prisma.birdGameBest.findUnique({
    where: { userId: BigInt(userId) },
    select: { score: true },
  });
  return row ? { score: row.score } : null;
}

export async function getLeaderboard(limit = 20): Promise<BirdLeaderboardRow[]> {
  const rows = await prisma.birdGameBest.findMany({
    orderBy: { score: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    user_id: Number(r.userId),
    score: r.score,
    level: r.level,
    fruits: r.fruits,
    display_name: r.displayName,
  }));
}

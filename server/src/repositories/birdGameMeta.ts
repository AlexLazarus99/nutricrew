import { prisma } from "../db/client.js";

export function todayKeyUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDaily(userId: number, dayKey: string) {
  return prisma.birdGameDaily.findUnique({
    where: { userId_dayKey: { userId: BigInt(userId), dayKey } },
  });
}

export async function upsertDailyBest(userId: number, dayKey: string, score: number) {
  const existing = await getDaily(userId, dayKey);
  if (existing && score <= existing.bestScore) return existing;
  return prisma.birdGameDaily.upsert({
    where: { userId_dayKey: { userId: BigInt(userId), dayKey } },
    create: { userId: BigInt(userId), dayKey, bestScore: score },
    update: { bestScore: Math.max(existing?.bestScore ?? 0, score) },
  });
}

export async function markDailyClaimed(userId: number, dayKey: string) {
  return prisma.birdGameDaily.update({
    where: { userId_dayKey: { userId: BigInt(userId), dayKey } },
    data: { claimed: true },
  });
}

export async function getUpgrades(userId: number) {
  return prisma.birdGameUpgrade.findUnique({
    where: { userId: BigInt(userId) },
  });
}

export async function upsertUpgrades(
  userId: number,
  data: { ghostLevel?: number; gapLevel?: number; nearMissLevel?: number },
) {
  return prisma.birdGameUpgrade.upsert({
    where: { userId: BigInt(userId) },
    create: {
      userId: BigInt(userId),
      ghostLevel: data.ghostLevel ?? 0,
      gapLevel: data.gapLevel ?? 0,
      nearMissLevel: data.nearMissLevel ?? 0,
    },
    update: data,
  });
}

export async function saveGhostRun(
  userId: number,
  displayName: string,
  birdId: string,
  score: number,
  samples: unknown,
) {
  return prisma.birdGameGhostRun.create({
    data: {
      userId: BigInt(userId),
      displayName,
      birdId,
      score,
      samples: samples as object,
    },
  });
}

export async function findDuelOpponent(userId: number, nearScore: number) {
  const min = Math.max(0, nearScore - 40);
  const max = nearScore + 80;
  const rows = await prisma.birdGameGhostRun.findMany({
    where: {
      userId: { not: BigInt(userId) },
      score: { gte: min, lte: max },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  if (rows.length === 0) {
    return prisma.birdGameGhostRun.findFirst({
      where: { userId: { not: BigInt(userId) } },
      orderBy: { score: "desc" },
    });
  }
  return rows[Math.floor(Math.random() * rows.length)] ?? null;
}

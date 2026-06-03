import { prisma } from "../db/client.js";

export async function isClaimed(
  userId: number,
  questId: string,
  periodKey: string,
): Promise<boolean> {
  const row = await prisma.userQuestClaim.findUnique({
    where: {
      userId_questId_periodKey: {
        userId: BigInt(userId),
        questId,
        periodKey,
      },
    },
  });
  return Boolean(row);
}

export async function recordClaim(input: {
  userId: number;
  questId: string;
  periodKey: string;
  rewardXp: number;
  rewardTeam: number;
  rewardStars: number;
}): Promise<void> {
  await prisma.userQuestClaim.create({
    data: {
      userId: BigInt(input.userId),
      questId: input.questId,
      periodKey: input.periodKey,
      rewardXp: input.rewardXp,
      rewardTeam: input.rewardTeam,
      rewardStars: input.rewardStars,
    },
  });
}

export async function sumClaimedXp(userId: number): Promise<number> {
  const agg = await prisma.userQuestClaim.aggregate({
    where: { userId: BigInt(userId) },
    _sum: { rewardXp: true },
  });
  return agg._sum.rewardXp ?? 0;
}

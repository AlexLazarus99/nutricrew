import { prisma } from "../db/client.js";

export async function sumSpentByUser(userId: number): Promise<number> {
  const agg = await prisma.userXpSpend.aggregate({
    where: { userId: BigInt(userId) },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

export async function hasSpend(
  userId: number,
  spendType: string,
  referenceId: string,
): Promise<boolean> {
  const row = await prisma.userXpSpend.findUnique({
    where: {
      userId_spendType_referenceId: {
        userId: BigInt(userId),
        spendType,
        referenceId,
      },
    },
  });
  return !!row;
}

export async function recordSpend(data: {
  userId: number;
  spendType: string;
  referenceId: string;
  amount: number;
}): Promise<boolean> {
  try {
    await prisma.userXpSpend.create({
      data: {
        userId: BigInt(data.userId),
        spendType: data.spendType,
        referenceId: data.referenceId,
        amount: data.amount,
      },
    });
    return true;
  } catch {
    return false;
  }
}

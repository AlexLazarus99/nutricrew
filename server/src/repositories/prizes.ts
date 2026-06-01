import { prisma } from "../db/client.js";

export async function getOrCreatePool(teamId: string, weekKey: string) {
  return prisma.prizePool.upsert({
    where: { teamId_weekKey: { teamId, weekKey } },
    create: { teamId, weekKey },
    update: {},
  });
}

export async function addToPool(teamId: string, weekKey: string, stars: number) {
  const pool = await getOrCreatePool(teamId, weekKey);
  return prisma.prizePool.update({
    where: { id: pool.id },
    data: { starsTotal: { increment: stars } },
  });
}

export async function getPool(teamId: string, weekKey: string) {
  return prisma.prizePool.findUnique({
    where: { teamId_weekKey: { teamId, weekKey } },
  });
}

export async function markPoolDistributed(poolId: string, amount: number) {
  return prisma.prizePool.update({
    where: { id: poolId },
    data: { starsDistributed: { increment: amount } },
  });
}

export async function createPayment(data: {
  userId: number;
  teamId: string | null;
  payload: string;
  paymentType: string;
  starsAmount: number;
}) {
  return prisma.payment.create({
    data: {
      userId: BigInt(data.userId),
      teamId: data.teamId,
      payload: data.payload,
      paymentType: data.paymentType,
      starsAmount: data.starsAmount,
      status: "pending",
    },
  });
}

export async function completePayment(
  payload: string,
  chargeId: string,
) {
  return prisma.payment.update({
    where: { payload },
    data: {
      status: "completed",
      telegramPaymentChargeId: chargeId,
      completedAt: new Date(),
    },
  });
}

export async function findPayment(payload: string) {
  return prisma.payment.findUnique({ where: { payload } });
}

export async function listAwardsForUser(userId: number, limit = 10) {
  return prisma.prizeAward.findMany({
    where: { userId: BigInt(userId) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function createAward(data: {
  userId: number;
  teamId: string;
  weekKey: string;
  starsAmount: number;
}) {
  return prisma.prizeAward.create({
    data: {
      userId: BigInt(data.userId),
      teamId: data.teamId,
      weekKey: data.weekKey,
      starsAmount: data.starsAmount,
      status: "credited",
    },
  });
}

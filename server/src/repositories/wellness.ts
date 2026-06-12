import { prisma } from "../db/client.js";

export async function addWeightLog(userId: number, kg: number, loggedAt?: Date) {
  const row = await prisma.weightLog.create({
    data: {
      userId: BigInt(userId),
      kg,
      loggedAt: loggedAt ?? new Date(),
    },
  });
  return {
    id: row.id,
    kg: row.kg,
    loggedAt: row.loggedAt.toISOString(),
  };
}

export async function getWeightLogs(userId: number, limit = 90) {
  const rows = await prisma.weightLog.findMany({
    where: { userId: BigInt(userId) },
    orderBy: { loggedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    kg: r.kg,
    loggedAt: r.loggedAt.toISOString(),
  }));
}

export async function addWaterMl(userId: number, ml: number, logDate: Date) {
  const day = new Date(logDate);
  day.setUTCHours(0, 0, 0, 0);
  await prisma.waterLog.create({
    data: {
      userId: BigInt(userId),
      ml,
      logDate: day,
    },
  });
}

export async function getWaterTotalForDay(userId: number, logDate: Date) {
  const day = new Date(logDate);
  day.setUTCHours(0, 0, 0, 0);
  const agg = await prisma.waterLog.aggregate({
    where: { userId: BigInt(userId), logDate: day },
    _sum: { ml: true },
  });
  return agg._sum.ml ?? 0;
}

export async function getWaterHistory(userId: number, days = 14) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);
  const rows = await prisma.waterLog.groupBy({
    by: ["logDate"],
    where: { userId: BigInt(userId), logDate: { gte: since } },
    _sum: { ml: true },
    orderBy: { logDate: "asc" },
  });
  return rows.map((r) => ({
    date: r.logDate.toISOString().slice(0, 10),
    ml: r._sum.ml ?? 0,
  }));
}

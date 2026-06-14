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

function dayStartUtc(logDate: Date) {
  const day = new Date(logDate);
  day.setUTCHours(0, 0, 0, 0);
  return day;
}

export async function getStepsGoal(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { stepsGoal: true },
  });
  return user?.stepsGoal ?? 8000;
}

export async function setStepsGoal(userId: number, goalSteps: number) {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { stepsGoal: goalSteps },
  });
}

export async function getStepsTotalForDay(userId: number, logDate: Date) {
  const day = dayStartUtc(logDate);
  const row = await prisma.dailyStepTotal.findUnique({
    where: { userId_logDate: { userId: BigInt(userId), logDate: day } },
  });
  return row?.steps ?? 0;
}

export async function addSteps(userId: number, delta: number, logDate: Date) {
  const day = dayStartUtc(logDate);
  const row = await prisma.dailyStepTotal.upsert({
    where: { userId_logDate: { userId: BigInt(userId), logDate: day } },
    create: { userId: BigInt(userId), logDate: day, steps: Math.max(0, delta) },
    update: { steps: { increment: Math.max(0, delta) } },
  });
  return row.steps;
}

export async function setStepsTotal(userId: number, total: number, logDate: Date) {
  const day = dayStartUtc(logDate);
  const safe = Math.max(0, Math.round(total));
  const row = await prisma.dailyStepTotal.upsert({
    where: { userId_logDate: { userId: BigInt(userId), logDate: day } },
    create: { userId: BigInt(userId), logDate: day, steps: safe },
    update: { steps: safe },
  });
  return row.steps;
}

export async function getStepsHistory(userId: number, days = 14) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);
  const rows = await prisma.dailyStepTotal.findMany({
    where: { userId: BigInt(userId), logDate: { gte: since } },
    orderBy: { logDate: "asc" },
  });
  return rows.map((r) => ({
    date: r.logDate.toISOString().slice(0, 10),
    steps: r.steps,
  }));
}

export async function getStepsDayRow(userId: number, logDate: Date) {
  const day = dayStartUtc(logDate);
  return prisma.dailyStepTotal.findUnique({
    where: { userId_logDate: { userId: BigInt(userId), logDate: day } },
  });
}

export async function setStepsXpGranted(userId: number, logDate: Date, xpGranted: number) {
  const day = dayStartUtc(logDate);
  await prisma.dailyStepTotal.update({
    where: { userId_logDate: { userId: BigInt(userId), logDate: day } },
    data: { stepsXpGranted: xpGranted },
  });
}

export async function mergeHealthSteps(
  userId: number,
  steps: number,
  source: string,
  logDate: Date,
) {
  const day = dayStartUtc(logDate);
  const safe = Math.max(0, Math.round(steps));
  const existing = await prisma.dailyStepTotal.findUnique({
    where: { userId_logDate: { userId: BigInt(userId), logDate: day } },
  });
  const merged = Math.max(existing?.steps ?? 0, safe);
  return prisma.dailyStepTotal.upsert({
    where: { userId_logDate: { userId: BigInt(userId), logDate: day } },
    create: {
      userId: BigInt(userId),
      logDate: day,
      steps: merged,
      healthSource: source,
      lastHealthSyncAt: new Date(),
    },
    update: {
      steps: merged,
      healthSource: source,
      lastHealthSyncAt: new Date(),
    },
  });
}

export async function getWorkoutsForDay(userId: number, logDate: Date) {
  const day = dayStartUtc(logDate);
  const rows = await prisma.workoutLog.findMany({
    where: { userId: BigInt(userId), logDate: day },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    type: row.workoutType,
    durationMinutes: row.durationMinutes,
    distanceKm: row.distanceKm,
    steps: row.steps,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addWorkoutLog(
  userId: number,
  logDate: Date,
  workoutType: string,
  durationMinutes: number,
  steps: number,
  distanceKm?: number | null,
) {
  const day = dayStartUtc(logDate);
  const [log, total] = await prisma.$transaction([
    prisma.workoutLog.create({
      data: {
        userId: BigInt(userId),
        logDate: day,
        workoutType,
        durationMinutes,
        distanceKm: distanceKm ?? null,
        steps,
      },
    }),
    prisma.dailyStepTotal.upsert({
      where: { userId_logDate: { userId: BigInt(userId), logDate: day } },
      create: { userId: BigInt(userId), logDate: day, steps },
      update: { steps: { increment: steps } },
    }),
  ]);
  return {
    workout: {
      id: log.id,
      type: log.workoutType,
      durationMinutes: log.durationMinutes,
      distanceKm: log.distanceKm,
      steps: log.steps,
      createdAt: log.createdAt.toISOString(),
    },
    totalSteps: total.steps,
  };
}

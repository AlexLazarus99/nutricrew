import { prisma } from "../db/client.js";

export async function cohortRetention(days = 7) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const signups = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { id: true, createdAt: true },
  });

  let d1 = 0;
  let d7 = 0;
  for (const u of signups) {
    const nextDay = new Date(u.createdAt);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const week = new Date(u.createdAt);
    week.setUTCDate(week.getUTCDate() + 7);

    const mealD1 = await prisma.meal.count({
      where: { userId: u.id, createdAt: { gte: nextDay, lt: week }, deletedAt: null },
    });
    const mealD7 = await prisma.meal.count({
      where: { userId: u.id, createdAt: { gte: week } },
    });
    if (mealD1 > 0) d1++;
    if (mealD7 > 0) d7++;
  }

  const total = signups.length || 1;
  return {
    windowDays: days,
    signups: signups.length,
    d1Rate: Math.round((d1 / total) * 100),
    d7Rate: Math.round((d7 / total) * 100),
  };
}

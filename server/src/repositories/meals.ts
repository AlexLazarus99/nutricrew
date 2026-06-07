import { prisma } from "../db/client.js";
import { mapMeal } from "../db/mappers.js";

export async function insertMeal(input: {
  userId: number;
  teamId: string | null;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  points: number;
  photoUrl?: string | null;
  photoKey?: string | null;
  aiSource?: string;
  aiConfidence?: number;
  mealSlot?: string | null;
  qualityTag?: string | null;
  imageHash?: string | null;
  verificationStatus?: string;
}) {
  const meal = await prisma.meal.create({
    data: {
      userId: BigInt(input.userId),
      teamId: input.teamId,
      description: input.description,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
      points: input.points,
      photoUrl: input.photoUrl ?? null,
      photoKey: input.photoKey ?? null,
      aiSource: input.aiSource ?? null,
      aiConfidence: input.aiConfidence ?? null,
      mealSlot: input.mealSlot ?? null,
      qualityTag: input.qualityTag ?? null,
      imageHash: input.imageHash ?? null,
      verificationStatus: input.verificationStatus ?? "ok",
    },
  });
  return mapMeal(meal);
}

export async function findRecentMealByImageHash(
  userId: number,
  imageHash: string,
  withinHours: number,
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);
  const row = await prisma.meal.findFirst({
    where: {
      userId: BigInt(userId),
      imageHash,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  return !!row;
}

export async function sumProteinToday(userId: number): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const agg = await prisma.meal.aggregate({
    where: {
      userId: BigInt(userId),
      createdAt: { gte: start },
    },
    _sum: { protein: true },
  });
  return agg._sum.protein ?? 0;
}

export async function sumCaloriesToday(userId: number): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const agg = await prisma.meal.aggregate({
    where: {
      userId: BigInt(userId),
      createdAt: { gte: start },
    },
    _sum: { calories: true },
  });
  return agg._sum.calories ?? 0;
}

export async function getTodayPoints(userId: number): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const agg = await prisma.meal.aggregate({
    where: {
      userId: BigInt(userId),
      createdAt: { gte: start },
    },
    _sum: { points: true },
  });
  return agg._sum.points ?? 0;
}

export async function countMembersLoggedToday(teamId: string): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const rows = await prisma.meal.findMany({
    where: {
      teamId,
      createdAt: { gte: start },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.length;
}

export async function countTeamMembers(teamId: string): Promise<number> {
  return prisma.teamMember.count({ where: { teamId } });
}

export async function countMealsToday(userId: number): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return prisma.meal.count({
    where: {
      userId: BigInt(userId),
      createdAt: { gte: start },
    },
  });
}

export async function countUserMeals(userId: number): Promise<number> {
  return prisma.meal.count({ where: { userId: BigInt(userId) } });
}

export async function countMealsSince(userId: number, since: Date): Promise<number> {
  return prisma.meal.count({
    where: {
      userId: BigInt(userId),
      createdAt: { gte: since },
    },
  });
}

export async function getLifetimeMealPoints(userId: number): Promise<number> {
  const agg = await prisma.meal.aggregate({
    where: { userId: BigInt(userId) },
    _sum: { points: true },
  });
  return agg._sum.points ?? 0;
}

export async function getTeamRecentMeals(teamId: string, limit = 12) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const rows = await prisma.meal.findMany({
    where: {
      teamId,
      createdAt: { gte: start },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { firstName: true, telegramId: true } },
    },
  });
  return rows.map((m) => ({
    id: m.id,
    description: m.description,
    points: m.points,
    createdAt: m.createdAt,
    userName: m.user.firstName,
    userTelegramId: Number(m.user.telegramId),
  }));
}

export async function findMealsInRange(
  userId: number,
  from: Date,
  to: Date,
) {
  const rows = await prisma.meal.findMany({
    where: {
      userId: BigInt(userId),
      createdAt: { gte: from, lt: to },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapMeal);
}

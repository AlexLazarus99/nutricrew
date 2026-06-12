import { prisma } from "../db/client.js";
import { mapMeal } from "../db/mappers.js";

const activeMeal = { deletedAt: null as null };

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
  fiberG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
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
      fiberG: input.fiberG ?? null,
      sugarG: input.sugarG ?? null,
      sodiumMg: input.sodiumMg ?? null,
    },
  });
  return mapMeal(meal);
}

export async function findMealByIdForUser(mealId: string, userId: number) {
  const row = await prisma.meal.findFirst({
    where: { id: mealId, userId: BigInt(userId), ...activeMeal },
  });
  return row ? mapMeal(row) : null;
}

export async function updateMealForUser(
  mealId: string,
  userId: number,
  patch: {
    description?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    mealSlot?: string | null;
    qualityTag?: string | null;
    fiberG?: number | null;
    sugarG?: number | null;
    sodiumMg?: number | null;
  },
) {
  const existing = await prisma.meal.findFirst({
    where: { id: mealId, userId: BigInt(userId), ...activeMeal },
  });
  if (!existing) return null;

  const meal = await prisma.meal.update({
    where: { id: mealId },
    data: {
      description: patch.description ?? existing.description,
      calories: patch.calories ?? existing.calories,
      protein: patch.protein ?? existing.protein,
      carbs: patch.carbs ?? existing.carbs,
      fat: patch.fat ?? existing.fat,
      mealSlot: patch.mealSlot !== undefined ? patch.mealSlot : existing.mealSlot,
      qualityTag: patch.qualityTag !== undefined ? patch.qualityTag : existing.qualityTag,
      fiberG: patch.fiberG !== undefined ? patch.fiberG : existing.fiberG,
      sugarG: patch.sugarG !== undefined ? patch.sugarG : existing.sugarG,
      sodiumMg: patch.sodiumMg !== undefined ? patch.sodiumMg : existing.sodiumMg,
    },
  });
  return mapMeal(meal);
}

export async function softDeleteMealForUser(mealId: string, userId: number) {
  const existing = await prisma.meal.findFirst({
    where: { id: mealId, userId: BigInt(userId), ...activeMeal },
  });
  if (!existing) return false;
  await prisma.meal.update({
    where: { id: mealId },
    data: { deletedAt: new Date() },
  });
  return true;
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
      ...activeMeal,
    },
    select: { id: true },
  });
  return !!row;
}

function todayStartUtc() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export async function sumProteinToday(userId: number): Promise<number> {
  const agg = await prisma.meal.aggregate({
    where: { userId: BigInt(userId), createdAt: { gte: todayStartUtc() }, ...activeMeal },
    _sum: { protein: true },
  });
  return agg._sum.protein ?? 0;
}

export async function sumCaloriesToday(userId: number): Promise<number> {
  const agg = await prisma.meal.aggregate({
    where: { userId: BigInt(userId), createdAt: { gte: todayStartUtc() }, ...activeMeal },
    _sum: { calories: true },
  });
  return agg._sum.calories ?? 0;
}

export async function getTodayPoints(userId: number): Promise<number> {
  const agg = await prisma.meal.aggregate({
    where: { userId: BigInt(userId), createdAt: { gte: todayStartUtc() }, ...activeMeal },
    _sum: { points: true },
  });
  return agg._sum.points ?? 0;
}

export async function countMembersLoggedToday(teamId: string): Promise<number> {
  const rows = await prisma.meal.findMany({
    where: { teamId, createdAt: { gte: todayStartUtc() }, ...activeMeal },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.length;
}

export async function countTeamMembers(teamId: string): Promise<number> {
  return prisma.teamMember.count({ where: { teamId } });
}

export async function countMealsToday(userId: number): Promise<number> {
  return prisma.meal.count({
    where: { userId: BigInt(userId), createdAt: { gte: todayStartUtc() }, ...activeMeal },
  });
}

export async function countUserMeals(userId: number): Promise<number> {
  return prisma.meal.count({ where: { userId: BigInt(userId), ...activeMeal } });
}

export async function countMealsSince(userId: number, since: Date): Promise<number> {
  return prisma.meal.count({
    where: { userId: BigInt(userId), createdAt: { gte: since }, ...activeMeal },
  });
}

export async function getLifetimeMealPoints(userId: number): Promise<number> {
  const agg = await prisma.meal.aggregate({
    where: { userId: BigInt(userId), ...activeMeal },
    _sum: { points: true },
  });
  return agg._sum.points ?? 0;
}

export async function getTeamRecentMeals(teamId: string, limit = 12) {
  const rows = await prisma.meal.findMany({
    where: { teamId, createdAt: { gte: todayStartUtc() }, ...activeMeal },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { firstName: true, telegramId: true } } },
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

export async function findMealsInRange(userId: number, from: Date, to: Date) {
  const rows = await prisma.meal.findMany({
    where: {
      userId: BigInt(userId),
      createdAt: { gte: from, lt: to },
      ...activeMeal,
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapMeal);
}

export async function aggregateMealsByDay(userId: number, from: Date, to: Date) {
  const meals = await findMealsInRange(userId, from, to);
  const byDay = new Map<string, { calories: number; protein: number; carbs: number; fat: number; count: number }>();
  for (const m of meals) {
    const key = m.created_at.toISOString().slice(0, 10);
    const cur = byDay.get(key) ?? { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
    cur.calories += m.calories;
    cur.protein += m.protein;
    cur.carbs += m.carbs;
    cur.fat += m.fat;
    cur.count += 1;
    byDay.set(key, cur);
  }
  return byDay;
}

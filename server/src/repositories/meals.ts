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
    },
  });
  return mapMeal(meal);
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

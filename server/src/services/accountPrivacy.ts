import { prisma } from "../db/client.js";
import type { DbUser } from "../types.js";

/** Express res.json cannot serialize Prisma BigInt fields. */
export function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v)),
  ) as T;
}

export async function exportUserData(user: DbUser) {
  const uid = BigInt(user.id);
  const [meals, favorites, payments, achievements, starTx] = await Promise.all([
    prisma.meal.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.favoriteMeal.findMany({ where: { userId: uid } }),
    prisma.payment.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.userAchievement.findMany({ where: { userId: uid } }),
    prisma.starTransaction.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return jsonSafe({
    exportedAt: new Date().toISOString(),
    profile: {
      telegramId: user.telegram_id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      locale: user.locale,
      weightKg: user.weight_kg,
      heightCm: user.height_cm,
      age: user.age,
      teamId: user.team_id,
      streak: user.current_streak,
      starBalance: user.star_balance,
      createdAt: user.created_at,
    },
    meals: meals.map((m) => ({
      id: m.id,
      description: m.description,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      points: m.points,
      mealSlot: m.mealSlot,
      createdAt: m.createdAt,
    })),
    favorites: favorites.map((f) => ({
      id: f.id,
      description: f.description,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      useCount: f.useCount,
      createdAt: f.createdAt,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      teamId: p.teamId,
      paymentType: p.paymentType,
      starsAmount: p.starsAmount,
      status: p.status,
      createdAt: p.createdAt,
      completedAt: p.completedAt,
    })),
    achievements: achievements.map((a) => ({
      achievementId: a.achievementId,
      unlockedAt: a.unlockedAt,
    })),
    starTransactions: starTx.map((s) => ({
      id: s.id,
      amount: s.amount,
      type: s.type,
      referenceId: s.referenceId,
      createdAt: s.createdAt,
    })),
  });
}

export async function deleteUserAccount(userId: number): Promise<void> {
  await prisma.user.delete({ where: { id: BigInt(userId) } });
}

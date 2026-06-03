import { prisma } from "../db/client.js";
import { getCurrentWeekKey } from "../lib/week.js";
import * as teamsRepo from "./teams.js";
import type { DailyBonusType } from "../types.js";

function todayUtcDate(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function hasDailyBonus(userId: number, type: DailyBonusType): Promise<boolean> {
  const row = await prisma.userDailyBonus.findUnique({
    where: {
      userId_bonusType_bonusDate: {
        userId: BigInt(userId),
        bonusType: type,
        bonusDate: todayUtcDate(),
      },
    },
  });
  return Boolean(row);
}

export async function claimDailyBonus(
  userId: number,
  teamId: string | null,
  type: DailyBonusType,
  bonusPoints: number,
): Promise<{ claimed: boolean; points: number }> {
  const today = todayUtcDate();
  try {
    await prisma.userDailyBonus.create({
      data: {
        userId: BigInt(userId),
        bonusType: type,
        bonusDate: today,
      },
    });
  } catch {
    return { claimed: false, points: 0 };
  }

  if (teamId && bonusPoints > 0) {
    const weekKey = getCurrentWeekKey();
    await teamsRepo.addWeeklyPoints(teamId, weekKey, bonusPoints);
  }

  return { claimed: true, points: bonusPoints };
}

export async function getDailyBonusStatus(userId: number): Promise<{
  game: boolean;
  quiz: boolean;
}> {
  const today = todayUtcDate();
  const rows = await prisma.userDailyBonus.findMany({
    where: {
      userId: BigInt(userId),
      bonusDate: today,
    },
    select: { bonusType: true },
  });
  const types = new Set(rows.map((r) => r.bonusType));
  return {
    game: types.has("game"),
    quiz: types.has("quiz"),
  };
}

export async function countDailyBonuses(userId: number): Promise<number> {
  return prisma.userDailyBonus.count({
    where: { userId: BigInt(userId) },
  });
}

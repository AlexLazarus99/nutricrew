import { prisma } from "../db/client.js";
import { mapUser } from "../db/mappers.js";
import type { AppLocale, DbUser } from "../types.js";
import type { TelegramUser } from "../lib/telegramAuth.js";

export async function upsertFromTelegram(
  tg: TelegramUser,
  locale?: AppLocale,
): Promise<DbUser> {
  const loc =
    locale ??
    (tg.language_code?.toLowerCase().startsWith("ru") ? "ru" : "en");

  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(tg.id) },
    create: {
      telegramId: BigInt(tg.id),
      firstName: tg.first_name,
      lastName: tg.last_name ?? null,
      username: tg.username ?? null,
      locale: loc,
    },
    update: {
      firstName: tg.first_name,
      lastName: tg.last_name ?? null,
      username: tg.username ?? null,
    },
  });
  return mapUser(user);
}

export async function findByTelegramId(telegramId: number): Promise<DbUser | null> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });
  return user ? mapUser(user) : null;
}

export async function findById(id: number): Promise<DbUser | null> {
  const user = await prisma.user.findUnique({ where: { id: BigInt(id) } });
  return user ? mapUser(user) : null;
}

export async function setLocale(userId: number, locale: AppLocale): Promise<void> {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { locale },
  });
}

export async function updateProfile(
  userId: number,
  weightKg: number,
  heightCm: number,
  age: number,
): Promise<DbUser> {
  const user = await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { weightKg, heightCm, age },
  });
  return mapUser(user);
}

export async function setTeam(userId: number, teamId: string | null): Promise<void> {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { teamId },
  });
}

export async function updateStreak(
  userId: number,
  streak: number,
  longest: number,
  lastMealDate: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: {
      currentStreak: streak,
      longestStreak: longest,
      lastMealDate: new Date(lastMealDate),
    },
  });
}

export async function creditStars(
  userId: number,
  amount: number,
  type: string,
  referenceId?: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: BigInt(userId) },
      data: { starBalance: { increment: amount } },
    }),
    prisma.starTransaction.create({
      data: {
        userId: BigInt(userId),
        amount,
        type,
        referenceId: referenceId ?? null,
      },
    }),
  ]);
}

export async function spendStars(
  userId: number,
  amount: number,
  type: string,
  referenceId?: string,
): Promise<boolean> {
  const cost = Math.max(0, Math.round(amount));
  if (cost <= 0) return true;

  const ok = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: BigInt(userId) },
      select: { starBalance: true },
    });
    if (!user || user.starBalance < cost) return false;

    await tx.user.update({
      where: { id: BigInt(userId) },
      data: { starBalance: { decrement: cost } },
    });
    await tx.starTransaction.create({
      data: {
        userId: BigInt(userId),
        amount: -cost,
        type,
        referenceId: referenceId ?? null,
      },
    });
    return true;
  });

  return ok;
}

export async function listTeamMemberTelegramIds(teamId: string): Promise<number[]> {
  const rows = await prisma.user.findMany({
    where: { teamMemberships: { some: { teamId } } },
    select: { telegramId: true },
  });
  return rows.map((r) => Number(r.telegramId));
}

export async function listAllWithTeams(): Promise<DbUser[]> {
  const users = await prisma.user.findMany({ where: { teamId: { not: null } } });
  return users.map(mapUser);
}

export async function setTimezoneOffset(userId: number, offsetMinutes: number): Promise<void> {
  const clamped = Math.max(-840, Math.min(840, Math.round(offsetMinutes)));
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { timezoneOffsetMinutes: clamped },
  });
}

export async function setReferredBy(userId: number, referrerUserId: number): Promise<void> {
  if (userId === referrerUserId) return;
  await prisma.user.updateMany({
    where: { id: BigInt(userId), referredByUserId: null },
    data: { referredByUserId: BigInt(referrerUserId) },
  });
}

export async function clearReferredBy(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { referredByUserId: null },
  });
}

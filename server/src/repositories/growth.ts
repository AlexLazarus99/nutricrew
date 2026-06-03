import { prisma } from "../db/client.js";
import { getCurrentWeekKey } from "../lib/week.js";
import {
  ACTIVE_TEAM_CHALLENGE,
  BATTLE_PASS_MAX_TIER,
  BATTLE_PASS_XP_PER_TIER,
  CURRENT_SEASON_KEY,
} from "../lib/challengeDefinitions.js";

export async function getUserGrowthFields(userId: number) {
  return prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: {
      streakFreezes: true,
      leagueTier: true,
      weeklyLeagueXp: true,
      dailyGoalType: true,
      dailyGoalTarget: true,
      photoPrivacy: true,
      birdBoostUntil: true,
      doublePointsWeekKey: true,
      onboardingVariant: true,
      currentStreak: true,
      teamId: true,
    },
  });
}

export async function updateUserSettings(
  userId: number,
  data: {
    dailyGoalType?: string;
    dailyGoalTarget?: number;
    photoPrivacy?: string;
    onboardingVariant?: string;
  },
) {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: {
      dailyGoalType: data.dailyGoalType,
      dailyGoalTarget: data.dailyGoalTarget,
      photoPrivacy: data.photoPrivacy,
      onboardingVariant: data.onboardingVariant,
    },
  });
}

export async function useStreakFreeze(userId: number): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
  if (!u || u.streakFreezes < 1) return false;
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { streakFreezes: { decrement: 1 } },
  });
  return true;
}

export async function grantStreakFreeze(userId: number, count = 1) {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { streakFreezes: { increment: count } },
  });
}

export async function addLeagueXp(userId: number, xp: number, tier: string) {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: {
      weeklyLeagueXp: { increment: xp },
      leagueTier: tier,
    },
  });
}

export async function setBirdBoostUntil(userId: number, until: Date) {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { birdBoostUntil: until },
  });
}

export async function markDoublePointsWeek(userId: number, weekKey: string) {
  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { doublePointsWeekKey: weekKey },
  });
}

export async function addMealKudos(mealId: string, userId: number, emoji: string) {
  const existing = await prisma.mealKudos.findUnique({
    where: { mealId_userId: { mealId, userId: BigInt(userId) } },
  });
  if (existing) return { added: false, count: 0 };

  await prisma.$transaction([
    prisma.mealKudos.create({
      data: { mealId, userId: BigInt(userId), emoji },
    }),
    prisma.meal.update({
      where: { id: mealId },
      data: { kudosCount: { increment: 1 } },
    }),
  ]);

  const meal = await prisma.meal.findUnique({ where: { id: mealId } });
  return { added: true, count: meal?.kudosCount ?? 1 };
}

export async function getTeamActivityWithKudos(teamId: string, limit = 12) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const rows = await prisma.meal.findMany({
    where: { teamId, createdAt: { gte: start } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { firstName: true, telegramId: true, photoPrivacy: true } },
      kudos: { select: { userId: true, emoji: true } },
    },
  });
  return rows;
}

export async function listFavorites(userId: number) {
  return prisma.favoriteMeal.findMany({
    where: { userId: BigInt(userId) },
    orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
    take: 20,
  });
}

export async function upsertFavorite(
  userId: number,
  input: {
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  },
) {
  const existing = await prisma.favoriteMeal.findFirst({
    where: {
      userId: BigInt(userId),
      description: input.description,
      calories: input.calories,
    },
  });
  if (existing) {
    return prisma.favoriteMeal.update({
      where: { id: existing.id },
      data: { useCount: { increment: 1 } },
    });
  }
  return prisma.favoriteMeal.create({
    data: {
      userId: BigInt(userId),
      description: input.description,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
      useCount: 1,
    },
  });
}

export async function incrementFavoriteUse(id: string, userId: number) {
  const row = await prisma.favoriteMeal.findFirst({
    where: { id, userId: BigInt(userId) },
  });
  if (!row) return null;
  return prisma.favoriteMeal.update({
    where: { id },
    data: { useCount: { increment: 1 } },
  });
}

export async function getOrCreateTeamChallenge(teamId: string) {
  const weekKey = getCurrentWeekKey();
  const existing = await prisma.teamChallengeProgress.findUnique({
    where: {
      teamId_challengeId_weekKey: {
        teamId,
        challengeId: ACTIVE_TEAM_CHALLENGE.id,
        weekKey,
      },
    },
  });
  if (existing) return existing;
  return prisma.teamChallengeProgress.create({
    data: {
      teamId,
      challengeId: ACTIVE_TEAM_CHALLENGE.id,
      weekKey,
      progress: 0,
      target: ACTIVE_TEAM_CHALLENGE.target,
    },
  });
}

export async function bumpTeamChallenge(teamId: string, delta: number) {
  const row = await getOrCreateTeamChallenge(teamId);
  if (row.completedAt) return row;
  const progress = Math.min(row.target, row.progress + delta);
  const completedAt =
    progress >= row.target && !row.completedAt ? new Date() : row.completedAt;
  return prisma.teamChallengeProgress.update({
    where: {
      teamId_challengeId_weekKey: {
        teamId,
        challengeId: ACTIVE_TEAM_CHALLENGE.id,
        weekKey: row.weekKey,
      },
    },
    data: { progress, completedAt },
  });
}

export async function countTeamMealsThisWeek(teamId: string): Promise<number> {
  const weekKey = getCurrentWeekKey();
  const [y, w] = weekKey.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - day + 1 + (w - 1) * 7);
  weekStart.setUTCHours(0, 0, 0, 0);
  return prisma.meal.count({
    where: { teamId, createdAt: { gte: weekStart } },
  });
}

export async function syncTeamChallengeProgress(teamId: string) {
  const meals = await countTeamMealsThisWeek(teamId);
  const row = await getOrCreateTeamChallenge(teamId);
  const progress = Math.min(row.target, meals);
  const completedAt =
    progress >= row.target && !row.completedAt ? new Date() : row.completedAt;
  return prisma.teamChallengeProgress.update({
    where: {
      teamId_challengeId_weekKey: {
        teamId,
        challengeId: ACTIVE_TEAM_CHALLENGE.id,
        weekKey: row.weekKey,
      },
    },
    data: { progress, completedAt },
  });
}

export async function getActiveDuel(teamId: string, userId: number) {
  const weekKey = getCurrentWeekKey();
  return prisma.teamDuel.findFirst({
    where: {
      teamId,
      weekKey,
      status: "active",
      OR: [{ challengerId: BigInt(userId) }, { opponentId: BigInt(userId) }],
    },
    include: {
      challenger: { select: { firstName: true, telegramId: true } },
      opponent: { select: { firstName: true, telegramId: true } },
    },
  });
}

export async function createDuel(
  teamId: string,
  challengerId: number,
  opponentId: number,
) {
  const weekKey = getCurrentWeekKey();
  const existing = await getActiveDuel(teamId, challengerId);
  if (existing) return existing;
  return prisma.teamDuel.create({
    data: {
      teamId,
      challengerId: BigInt(challengerId),
      opponentId: BigInt(opponentId),
      weekKey,
    },
    include: {
      challenger: { select: { firstName: true, telegramId: true } },
      opponent: { select: { firstName: true, telegramId: true } },
    },
  });
}

export async function addDuelPoints(
  teamId: string,
  userId: number,
  points: number,
) {
  const duel = await getActiveDuel(teamId, userId);
  if (!duel) return;
  const isChallenger = Number(duel.challengerId) === userId;
  await prisma.teamDuel.update({
    where: { id: duel.id },
    data: isChallenger
      ? { challengerPoints: { increment: points } }
      : { opponentPoints: { increment: points } },
  });
}

export async function listAchievements(userId: number) {
  return prisma.userAchievement.findMany({
    where: { userId: BigInt(userId) },
  });
}

export async function unlockAchievement(userId: number, achievementId: string) {
  try {
    await prisma.userAchievement.create({
      data: { userId: BigInt(userId), achievementId },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getBattlePass(userId: number) {
  let row = await prisma.battlePassProgress.findUnique({
    where: { userId: BigInt(userId) },
  });
  if (!row) {
    row = await prisma.battlePassProgress.create({
      data: {
        userId: BigInt(userId),
        seasonKey: CURRENT_SEASON_KEY,
        tier: 0,
        xp: 0,
      },
    });
  }
  return row;
}

export async function addBattlePassXp(userId: number, xp: number) {
  const row = await getBattlePass(userId);
  let totalXp = row.xp + xp;
  let tier = row.tier;
  while (tier < BATTLE_PASS_MAX_TIER && totalXp >= BATTLE_PASS_XP_PER_TIER) {
    totalXp -= BATTLE_PASS_XP_PER_TIER;
    tier += 1;
  }
  return prisma.battlePassProgress.update({
    where: { userId: BigInt(userId) },
    data: { xp: totalXp, tier },
  });
}

export async function getCorpLeaderboard(leagueTag: string, limit = 15) {
  const weekKey = getCurrentWeekKey();
  const teams = await prisma.team.findMany({
    where: { leagueTag },
    select: { id: true, name: true },
  });
  if (teams.length === 0) return [];

  const scores = await prisma.weeklyTeamScore.findMany({
    where: {
      weekKey,
      teamId: { in: teams.map((t) => t.id) },
    },
  });
  const scoreMap = new Map(scores.map((s) => [s.teamId, s.points]));
  return teams
    .map((t) => ({ name: t.name, points: scoreMap.get(t.id) ?? 0 }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((t, i) => ({ rank: i + 1, ...t }));
}

export async function setTeamLeagueTag(teamId: string, tag: string | null) {
  await prisma.team.update({
    where: { id: teamId },
    data: { leagueTag: tag },
  });
}

export async function setMemberRole(teamId: string, userId: number, role: string) {
  await prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId: BigInt(userId) } },
    data: { role },
  });
}

export async function getMemberRole(teamId: string, userId: number) {
  const m = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: BigInt(userId) } },
  });
  return m?.role ?? "member";
}

import * as growthRepo from "../repositories/growth.js";
import * as mealsRepo from "../repositories/meals.js";
import * as teamsRepo from "../repositories/teams.js";
import { getCurrentWeekKey } from "../lib/week.js";
import {
  ACTIVE_TEAM_CHALLENGE,
  BATTLE_PASS_MAX_TIER,
  BATTLE_PASS_XP_PER_TIER,
  CURRENT_SEASON_KEY,
  KUDOS_EMOJIS,
} from "../lib/challengeDefinitions.js";
import { xpToNextTier, tierFromWeeklyXp } from "../lib/leagueTiers.js";
import { getAchievementsBoard } from "./achievements.js";
import type { DbUser } from "../types.js";

export async function buildGrowthPayload(user: DbUser) {
  const fields = await growthRepo.getUserGrowthFields(user.id);
  const weekKey = getCurrentWeekKey();
  const mealsToday = await mealsRepo.countMealsToday(user.id);
  const todayPoints = await mealsRepo.getTodayPoints(user.id);
  const weekProtein = await sumProteinThisWeek(user.id);

  const dailyGoalType = fields?.dailyGoalType ?? "meals";
  const dailyGoalTarget = fields?.dailyGoalTarget ?? 3;
  let dailyProgress = mealsToday;
  if (dailyGoalType === "points") dailyProgress = todayPoints;
  if (dailyGoalType === "protein") dailyProgress = weekProtein;

  const leagueXp = fields?.weeklyLeagueXp ?? 0;
  const leagueTier = tierFromWeeklyXp(leagueXp);

  const favorites = await growthRepo.listFavorites(user.id);
  const achievements = await getAchievementsBoard(user.id);
  const battlePass = await growthRepo.getBattlePass(user.id);

  let challenge = null;
  let duel = null;
  let teamRole: string | null = null;
  let corpLeaderboard: Array<{ rank: number; name: string; points: number }> = [];

  if (user.team_id) {
    teamRole = await growthRepo.getMemberRole(user.team_id, user.id);
    const ch = await growthRepo.syncTeamChallengeProgress(user.team_id);
    challenge = {
      id: ch.challengeId,
      titleKey: ACTIVE_TEAM_CHALLENGE.titleKey,
      descKey: ACTIVE_TEAM_CHALLENGE.descKey,
      emoji: ACTIVE_TEAM_CHALLENGE.emoji,
      progress: ch.progress,
      target: ch.target,
      completed: !!ch.completedAt,
    };
    const d = await growthRepo.getActiveDuel(user.team_id, user.id);
    if (d) {
      const isChallenger = Number(d.challengerId) === user.id;
      duel = {
        id: d.id,
        youName: isChallenger ? d.challenger.firstName : d.opponent.firstName,
        foeName: isChallenger ? d.opponent.firstName : d.challenger.firstName,
        yourPoints: isChallenger ? d.challengerPoints : d.opponentPoints,
        foePoints: isChallenger ? d.opponentPoints : d.challengerPoints,
      };
    }
    const team = await teamsRepo.findById(user.team_id);
    if (team?.league_tag) {
      corpLeaderboard = await growthRepo.getCorpLeaderboard(team.league_tag);
    }
  }

  const birdBoostActive =
    !!fields?.birdBoostUntil && fields.birdBoostUntil.getTime() > Date.now();

  const doublePointsAvailable =
    fields?.doublePointsWeekKey !== weekKey;

  return {
    streakFreezes: fields?.streakFreezes ?? 0,
    league: {
      tier: leagueTier,
      weeklyXp: leagueXp,
      xpToNext: xpToNextTier(leagueTier, leagueXp),
    },
    dailyGoal: {
      type: dailyGoalType,
      target: dailyGoalTarget,
      progress: dailyProgress,
      done: dailyProgress >= dailyGoalTarget,
    },
    photoPrivacy: fields?.photoPrivacy ?? "team",
    onboardingVariant: fields?.onboardingVariant ?? "team_first",
    birdBoost: {
      active: birdBoostActive,
      until: fields?.birdBoostUntil?.toISOString() ?? null,
    },
    doublePoints: {
      available: doublePointsAvailable,
      usedWeekKey: fields?.doublePointsWeekKey ?? null,
    },
    favorites: favorites.map((f) => ({
      id: f.id,
      description: f.description,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      useCount: f.useCount,
    })),
    challenge,
    duel,
    teamRole,
    corpLeaderboard,
    achievements,
    battlePass: {
      seasonKey: battlePass.seasonKey || CURRENT_SEASON_KEY,
      tier: battlePass.tier,
      maxTier: BATTLE_PASS_MAX_TIER,
      xp: battlePass.xp,
      xpPerTier: BATTLE_PASS_XP_PER_TIER,
    },
    kudosEmojis: KUDOS_EMOJIS,
    premiumPerks: {
      streakFreezeGrant: true,
      doublePointsDay: true,
      photoPrivacyOptions: ["team", "private", "hidden"],
    },
  };
}

async function sumProteinThisWeek(userId: number): Promise<number> {
  const weekKey = getCurrentWeekKey();
  const [y, w] = weekKey.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - day + 1 + (w - 1) * 7);
  weekStart.setUTCHours(0, 0, 0, 0);
  const meals = await mealsRepo.findMealsInRange(userId, weekStart, new Date());
  return meals.reduce((s, m) => s + m.protein, 0);
}

export async function startDuelForUser(user: DbUser) {
  if (!user.team_id) return { ok: false as const, error: "NO_TEAM" };
  const members = await teamsRepo.getMembers(user.team_id);
  const others = members.filter((m) => Number(m.id) !== user.id);
  if (others.length === 0) return { ok: false as const, error: "NO_OPPONENT" };
  const pick = others[Math.floor(Math.random() * others.length)]!;
  const duel = await growthRepo.createDuel(
    user.team_id,
    user.id,
    Number(pick.id),
  );
  return {
    ok: true as const,
    duel: {
      id: duel.id,
      foeName: pick.first_name,
    },
  };
}

export async function purchaseStreakFreeze(user: DbUser, useStars: boolean) {
  if (useStars && user.star_balance < 15) {
    return { ok: false as const, error: "INSUFFICIENT_STARS" };
  }
  if (useStars) {
    const { prisma } = await import("../db/client.js");
    await prisma.$transaction([
      prisma.user.update({
        where: { id: BigInt(user.id) },
        data: { starBalance: { decrement: 15 }, streakFreezes: { increment: 1 } },
      }),
      prisma.starTransaction.create({
        data: {
          userId: BigInt(user.id),
          amount: -15,
          type: "streak_freeze",
        },
      }),
    ]);
  } else {
    await growthRepo.grantStreakFreeze(user.id, 1);
  }
  return { ok: true as const };
}

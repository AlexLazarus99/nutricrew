import * as growthRepo from "../repositories/growth.js";
import * as mealsRepo from "../repositories/meals.js";
import * as wellnessRepo from "../repositories/wellness.js";
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

export type GrowthMeContext = {
  mealsToday: number;
  todayPoints: number;
};

/** Lightweight payload for /me — avoids heavy joins and team-wide recounts. */
export async function buildGrowthSummary(user: DbUser, ctx: GrowthMeContext) {
  const fields = await growthRepo.getUserGrowthFields(user.id);
  const dailyGoalType = fields?.dailyGoalType ?? "meals";
  const dailyGoalTarget = fields?.dailyGoalTarget ?? 3;
  let dailyProgress = ctx.mealsToday;
  if (dailyGoalType === "points") dailyProgress = ctx.todayPoints;
  if (dailyGoalType === "protein") dailyProgress = await mealsRepo.sumProteinToday(user.id);
  if (dailyGoalType === "calories") dailyProgress = await mealsRepo.sumCaloriesToday(user.id);
  if (dailyGoalType === "steps") dailyProgress = await wellnessRepo.getStepsTotalForDay(user.id, new Date());

  const leagueXp = fields?.weeklyLeagueXp ?? 0;
  const leagueTier = tierFromWeeklyXp(leagueXp);
  const birdBoostActive =
    !!fields?.birdBoostUntil && fields.birdBoostUntil.getTime() > Date.now();

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
    birdBoost: {
      active: birdBoostActive,
      until: fields?.birdBoostUntil?.toISOString() ?? null,
    },
  };
}

export async function buildGrowthPayload(user: DbUser, ctx?: Partial<GrowthMeContext>) {
  const weekKey = getCurrentWeekKey();

  const [fields, mealsToday, todayPoints] = await Promise.all([
    growthRepo.getUserGrowthFields(user.id),
    ctx?.mealsToday != null
      ? Promise.resolve(ctx.mealsToday)
      : mealsRepo.countMealsToday(user.id),
    ctx?.todayPoints != null
      ? Promise.resolve(ctx.todayPoints)
      : mealsRepo.getTodayPoints(user.id),
  ]);

  const dailyGoalType = fields?.dailyGoalType ?? "meals";
  const dailyGoalTarget = fields?.dailyGoalTarget ?? 3;
  const needDailyMacro = dailyGoalType === "protein" || dailyGoalType === "calories";

  const teamId = user.team_id;
  const [dailyMacro, favorites, achievements, battlePass, teamBundle] =
    await Promise.all([
      needDailyMacro && dailyGoalType === "protein"
        ? mealsRepo.sumProteinToday(user.id)
        : needDailyMacro && dailyGoalType === "calories"
          ? mealsRepo.sumCaloriesToday(user.id)
          : Promise.resolve(0),
      growthRepo.listFavorites(user.id),
      getAchievementsBoard(user.id),
      growthRepo.getBattlePass(user.id),
      teamId
        ? Promise.all([
            growthRepo.getMemberRole(teamId, user.id),
            growthRepo.getOrCreateTeamChallenge(teamId),
            growthRepo.getActiveDuel(teamId, user.id),
            teamsRepo.findById(teamId),
          ])
        : Promise.resolve(null),
    ]);

  let dailyProgress = mealsToday;
  if (dailyGoalType === "points") dailyProgress = todayPoints;
  if (dailyGoalType === "protein" || dailyGoalType === "calories") dailyProgress = dailyMacro;
  if (dailyGoalType === "steps") dailyProgress = await wellnessRepo.getStepsTotalForDay(user.id, new Date());

  const leagueXp = fields?.weeklyLeagueXp ?? 0;
  const leagueTier = tierFromWeeklyXp(leagueXp);

  let challenge = null;
  let duel = null;
  let teamRole: string | null = null;
  let corpLeaderboard: Array<{ rank: number; name: string; points: number }> = [];

  if (teamBundle) {
    const [role, ch, d, team] = teamBundle;
    teamRole = role;
    challenge = {
      id: ch.challengeId,
      titleKey: ACTIVE_TEAM_CHALLENGE.titleKey,
      descKey: ACTIVE_TEAM_CHALLENGE.descKey,
      emoji: ACTIVE_TEAM_CHALLENGE.emoji,
      progress: ch.progress,
      target: ch.target,
      completed: !!ch.completedAt,
    };
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

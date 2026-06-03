import { prisma } from "../db/client.js";
import { mapTeam } from "../db/mappers.js";
import { generateInviteCode } from "../lib/inviteCode.js";
import type { DbTeam, WeeklyGoalType } from "../types.js";

const GOAL_ROTATION: WeeklyGoalType[] = ["points", "protein", "calories"];

export async function createTeam(
  name: string,
  leagueTag?: string | null,
): Promise<DbTeam> {
  const tag =
    leagueTag && ["friends", "gym", "office", "corp"].includes(leagueTag)
      ? leagueTag
      : null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const team = await prisma.team.create({
        data: { name, inviteCode: generateInviteCode(), leagueTag: tag },
      });
      return mapTeam(team);
    } catch {
      /* retry on invite collision */
    }
  }
  throw new Error("Could not generate unique invite code");
}

export async function findById(id: string): Promise<DbTeam | null> {
  const team = await prisma.team.findUnique({ where: { id } });
  return team ? mapTeam(team) : null;
}

export async function findByInviteCode(code: string): Promise<DbTeam | null> {
  const team = await prisma.team.findUnique({
    where: { inviteCode: code.trim().toUpperCase() },
  });
  return team ? mapTeam(team) : null;
}

export async function addMember(teamId: string, userId: number): Promise<void> {
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: { teamId, userId: BigInt(userId) },
    },
    create: { teamId, userId: BigInt(userId) },
    update: {},
  });
}

export async function getMembers(teamId: string) {
  return prisma.$queryRaw<
    Array<{
      id: bigint;
      telegram_id: bigint;
      first_name: string;
      last_meal_date: Date | null;
      week_points: number;
    }>
  >`
    SELECT u.id, u.telegram_id, u.first_name, u.last_meal_date,
           COALESCE(SUM(m.points), 0)::int AS week_points
    FROM users u
    INNER JOIN team_members tm ON tm.user_id = u.id
    LEFT JOIN meals m ON m.user_id = u.id
      AND m.created_at >= date_trunc('week', CURRENT_DATE)
    WHERE tm.team_id = ${teamId}::uuid
    GROUP BY u.id, u.telegram_id, u.first_name, u.last_meal_date
    ORDER BY week_points DESC
  `;
}

export async function addWeeklyPoints(
  teamId: string,
  weekKey: string,
  points: number,
): Promise<void> {
  await prisma.weeklyTeamScore.upsert({
    where: { teamId_weekKey: { teamId, weekKey } },
    create: { teamId, weekKey, points },
    update: { points: { increment: points } },
  });
}

export async function getWeeklyProgress(teamId: string, weekKey: string) {
  const team = await findById(teamId);
  if (!team) return { current: 0, target: 0, type: "points" as const, unit: "pts" };

  let current = 0;
  const type = team.weekly_goal_type;

  if (type === "points") {
    const row = await prisma.weeklyTeamScore.findUnique({
      where: { teamId_weekKey: { teamId, weekKey } },
    });
    current = row?.points ?? 0;
  } else if (type === "protein") {
    const agg = await prisma.meal.aggregate({
      where: {
        teamId,
        createdAt: { gte: startOfWeek() },
      },
      _sum: { protein: true },
    });
    current = agg._sum.protein ?? 0;
  } else {
    const agg = await prisma.meal.aggregate({
      where: {
        teamId,
        createdAt: { gte: startOfWeek() },
      },
      _sum: { calories: true },
    });
    current = agg._sum.calories ?? 0;
  }

  const unit = type === "protein" ? "g" : type === "calories" ? "kcal" : "pts";
  return { current, target: team.weekly_goal_target, type, unit };
}

function startOfWeek(): Date {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getLeaderboard(weekKey: string, limit = 20) {
  const rows = await prisma.weeklyTeamScore.findMany({
    where: { weekKey },
    orderBy: { points: "desc" },
    take: limit,
    include: { team: true },
  });
  return rows.map((r) => ({
    team_id: r.teamId,
    name: r.team.name,
    points: r.points,
  }));
}

export async function getTeamRank(teamId: string, weekKey: string): Promise<number> {
  const rows = await prisma.weeklyTeamScore.findMany({
    where: { weekKey },
    orderBy: { points: "desc" },
  });
  const idx = rows.findIndex((r) => r.teamId === teamId);
  return idx >= 0 ? idx + 1 : 0;
}

export async function countTeamsInWeek(weekKey: string): Promise<number> {
  return prisma.weeklyTeamScore.count({ where: { weekKey } });
}

export async function listAllTeams(): Promise<DbTeam[]> {
  const teams = await prisma.team.findMany();
  return teams.map(mapTeam);
}

export async function rotateWeeklyGoals(): Promise<void> {
  const teams = await listAllTeams();
  for (const team of teams) {
    const idx = GOAL_ROTATION.indexOf(team.weekly_goal_type);
    const next = GOAL_ROTATION[(idx + 1) % GOAL_ROTATION.length]!;
    const target = next === "protein" ? 500 : next === "calories" ? 12000 : 1000;
    await prisma.team.update({
      where: { id: team.id },
      data: { weeklyGoalType: next, weeklyGoalTarget: target },
    });
  }
}

export async function getWeekWinners(weekKey: string, top = 3) {
  return getLeaderboard(weekKey, top);
}

export async function setPremium(teamId: string, days: number): Promise<void> {
  const until = new Date();
  until.setDate(until.getDate() + days);
  await prisma.team.update({
    where: { id: teamId },
    data: { isPremium: true, premiumUntil: until },
  });
}

export async function getActiveMembersForWeek(teamId: string, weekStart: Date) {
  const rows = await prisma.meal.findMany({
    where: { teamId, createdAt: { gte: weekStart } },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.map((r) => Number(r.userId));
}

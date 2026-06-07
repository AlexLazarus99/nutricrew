import { prisma } from "../db/client.js";
import * as teamsRepo from "../repositories/teams.js";
import * as mealsRepo from "../repositories/meals.js";
import * as growthRepo from "../repositories/growth.js";
import { getCurrentWeekKey } from "../lib/week.js";
import type { DbUser } from "../types.js";

export async function buildTeamAdminDashboard(user: DbUser) {
  if (!user.team_id) return null;

  const role = await growthRepo.getMemberRole(user.team_id, user.id);
  if (role !== "captain") return null;

  const [team, members, weekKey] = await Promise.all([
    teamsRepo.findById(user.team_id),
    teamsRepo.getMembers(user.team_id),
    Promise.resolve(getCurrentWeekKey()),
  ]);

  const memberStats = await Promise.all(
    members.map(async (m) => {
      const uid = Number(m.id);
      const [mealsToday, mealsThisWeek, role] = await Promise.all([
        mealsRepo.countMealsToday(uid),
        mealsRepo.countMealsSince(uid, new Date(Date.now() - 7 * 86400000)),
        growthRepo.getMemberRole(user.team_id!, uid),
      ]);
      return {
        telegramId: Number(m.telegram_id),
        firstName: m.first_name,
        role: role ?? "member",
        mealsToday,
        mealsThisWeek,
        weekPoints: Number(m.week_points),
        lastMealDate: m.last_meal_date?.toISOString().slice(0, 10) ?? null,
      };
    }),
  );

  const loggedToday = memberStats.filter((m) => m.mealsToday > 0).length;
  const weekRow = await prisma.weeklyTeamScore.findUnique({
    where: { teamId_weekKey: { teamId: user.team_id, weekKey } },
  });
  const weekScore = weekRow?.points ?? 0;

  return {
    team: {
      id: team!.id,
      name: team!.name,
      inviteCode: team!.invite_code,
      leagueTag: team!.league_tag,
      isPremium: team!.is_premium,
      weeklyGoalType: team!.weekly_goal_type,
      weeklyGoalTarget: team!.weekly_goal_target,
    },
    weekKey,
    weekPoints: weekScore,
    membersTotal: members.length,
    membersLoggedToday: loggedToday,
    participationRate: members.length ? Math.round((loggedToday / members.length) * 100) : 0,
    members: memberStats,
  };
}

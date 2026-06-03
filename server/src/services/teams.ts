import * as teamsRepo from "../repositories/teams.js";
import * as usersRepo from "../repositories/users.js";
import type { DbUser } from "../types.js";

export async function joinTeam(
  user: DbUser,
  inviteCode: string,
  referrerTelegramId?: number,
) {
  const team = await teamsRepo.findByInviteCode(inviteCode);
  if (!team) throw new Error("TEAM_NOT_FOUND");

  await teamsRepo.addMember(team.id, user.id);
  await usersRepo.setTeam(user.id, team.id);

  const { attachReferrerOnJoin } = await import("./referrals.js");
  await attachReferrerOnJoin(user, referrerTelegramId);

  const weekKey = (await import("../lib/week.js")).getCurrentWeekKey();
  await teamsRepo.addWeeklyPoints(team.id, weekKey, 0);

  return team;
}

export async function createTeamForUser(
  user: DbUser,
  name: string,
  leagueTag?: string | null,
) {
  const team = await teamsRepo.createTeam(name, leagueTag);
  await teamsRepo.addMember(team.id, user.id);
  await usersRepo.setTeam(user.id, team.id);
  const { setMemberRole } = await import("../repositories/growth.js");
  await setMemberRole(team.id, user.id, "captain");

  const weekKey = (await import("../lib/week.js")).getCurrentWeekKey();
  await teamsRepo.addWeeklyPoints(team.id, weekKey, 0);

  return team;
}

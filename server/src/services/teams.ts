import * as teamsRepo from "../repositories/teams.js";
import * as usersRepo from "../repositories/users.js";
import type { DbUser } from "../types.js";

export async function joinTeam(user: DbUser, inviteCode: string) {
  const team = await teamsRepo.findByInviteCode(inviteCode);
  if (!team) throw new Error("TEAM_NOT_FOUND");

  await teamsRepo.addMember(team.id, user.id);
  await usersRepo.setTeam(user.id, team.id);

  const weekKey = (await import("../lib/week.js")).getCurrentWeekKey();
  await teamsRepo.addWeeklyPoints(team.id, weekKey, 0);

  return team;
}

export async function createTeamForUser(user: DbUser, name: string) {
  const team = await teamsRepo.createTeam(name);
  await teamsRepo.addMember(team.id, user.id);
  await usersRepo.setTeam(user.id, team.id);

  const weekKey = (await import("../lib/week.js")).getCurrentWeekKey();
  await teamsRepo.addWeeklyPoints(team.id, weekKey, 0);

  return team;
}

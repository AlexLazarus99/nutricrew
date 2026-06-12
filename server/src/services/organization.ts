import { prisma } from "../db/client.js";
import * as mealsRepo from "../repositories/meals.js";
import { getCurrentWeekKey } from "../lib/week.js";

export async function createOrganization(userId: number, name: string, billingEmail?: string) {
  const org = await prisma.organization.create({
    data: {
      name: name.trim().slice(0, 128),
      billingEmail: billingEmail?.trim().slice(0, 256) ?? null,
    },
  });
  await prisma.orgMember.create({
    data: {
      organizationId: org.id,
      userId: BigInt(userId),
      role: "admin",
    },
  });
  return org;
}

export async function linkTeamToOrg(teamId: string, organizationId: string, userId: number) {
  const member = await prisma.orgMember.findFirst({
    where: { organizationId, userId: BigInt(userId), role: "admin" },
  });
  if (!member) throw new Error("ORG_FORBIDDEN");
  await prisma.team.update({
    where: { id: teamId },
    data: { organizationId },
  });
  return { ok: true };
}

export async function getOrgDashboard(organizationId: string, userId: number) {
  const member = await prisma.orgMember.findFirst({
    where: { organizationId, userId: BigInt(userId) },
  });
  if (!member) throw new Error("ORG_FORBIDDEN");

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("ORG_NOT_FOUND");

  const teams = await prisma.team.findMany({
    where: { organizationId },
    include: { members: true },
  });

  const weekKey = getCurrentWeekKey();
  const teamStats = await Promise.all(
    teams.map(async (t) => {
      const memberIds = t.members.map((m) => m.userId);
      let loggedToday = 0;
      for (const uid of memberIds) {
        const n = await mealsRepo.countMealsToday(Number(uid));
        if (n > 0) loggedToday++;
      }
      const score = await prisma.weeklyTeamScore.findUnique({
        where: { teamId_weekKey: { teamId: t.id, weekKey } },
      });
      return {
        id: t.id,
        name: t.name,
        members: t.members.length,
        loggedToday,
        participationRate: t.members.length ? Math.round((loggedToday / t.members.length) * 100) : 0,
        weekPoints: score?.points ?? 0,
      };
    }),
  );

  return {
    organization: { id: org.id, name: org.name, seatLimit: org.seatLimit },
    weekKey,
    teams: teamStats,
    totals: {
      teams: teams.length,
      members: teamStats.reduce((s, t) => s + t.members, 0),
      avgParticipation:
        teamStats.length > 0
          ? Math.round(teamStats.reduce((s, t) => s + t.participationRate, 0) / teamStats.length)
          : 0,
    },
  };
}

export function orgMembersCsv(rows: Array<{ name: string; mealsToday: number; weekPoints: number }>) {
  const header = "name,meals_today,week_points\n";
  const body = rows.map((r) => `${JSON.stringify(r.name)},${r.mealsToday},${r.weekPoints}`).join("\n");
  return header + body;
}

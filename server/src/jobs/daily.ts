import { prisma } from "../db/client.js";
import { mapUser } from "../db/mappers.js";
import * as teamsRepo from "../repositories/teams.js";
import {
  sendMorningReminders,
  sendEveningNudges,
  notifyStreakBroken,
} from "../services/notifications.js";

export async function runMorningReminders(): Promise<void> {
  console.log("Morning reminders…");
  await sendMorningReminders();
}

export async function runEveningNudges(): Promise<void> {
  console.log("Evening nudges…");
  await sendEveningNudges();
}

export async function runStreakReset(): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      currentStreak: { gt: 0 },
      lastMealDate: { lt: yesterdayDate() },
    },
  });

  if (users.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: users.map((u) => u.id) } },
      data: { currentStreak: 0 },
    });
  }

  for (const raw of users) {
    const user = mapUser(raw);
    if (!user.team_id) continue;
    const team = await teamsRepo.findById(user.team_id);
    if (team) {
      await notifyStreakBroken(user, team.name);
    }
  }

  if (users.length > 0) {
    console.log(`Streak reset for ${users.length} users`);
  }
}

function yesterdayDate(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

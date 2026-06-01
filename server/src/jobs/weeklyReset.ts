import * as teamsRepo from "../repositories/teams.js";
import { getPreviousWeekKey } from "../lib/week.js";
import { notifyWeeklyResults } from "../services/notifications.js";
import { distributeWeeklyPrizes } from "../services/stars.js";

export async function runWeeklyReset(): Promise<void> {
  const weekKey = getPreviousWeekKey();
  console.log(`Weekly reset for ${weekKey}`);

  await distributeWeeklyPrizes(weekKey);
  await notifyWeeklyResults(weekKey);
  await teamsRepo.rotateWeeklyGoals();

  console.log("Weekly goals rotated, prizes distributed, notifications sent");
}

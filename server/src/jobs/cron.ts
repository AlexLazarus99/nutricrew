import cron from "node-cron";
import { config } from "../config.js";
import { runWeeklyReset } from "./weeklyReset.js";
import { runMorningReminders, runEveningNudges, runStreakReset } from "./daily.js";
import { runReengagementNudges } from "./reengagement.js";
import { sendProSmartReminders, sendDailyAiTips } from "../services/notifications.js";

export function startCronJobs(): void {
  if (!config.cronEnabled) {
    console.log("Cron jobs disabled (CRON_ENABLED=false)");
    return;
  }

  // Monday 00:05 UTC — weekly battle reset + results
  cron.schedule("5 0 * * 1", () => {
    void runWeeklyReset().catch(console.error);
  });

  // Daily streak reset check 00:10 UTC
  cron.schedule("10 0 * * *", () => {
    void runStreakReset().catch(console.error);
  });

  // Morning reminders
  cron.schedule(`0 ${config.reminderHourUtc} * * *`, () => {
    void runMorningReminders().catch(console.error);
  });

  // Evening nudge 18:00 UTC
  cron.schedule("0 18 * * *", () => {
    void runEveningNudges().catch(console.error);
  });

  // Re-engagement for dormant users — Tue/Fri 11:00 UTC
  cron.schedule("0 11 * * 2,5", () => {
    void runReengagementNudges().catch(console.error);
  });

  // Pro smart reminders — daily 13:00 UTC
  cron.schedule("0 13 * * *", () => {
    void sendProSmartReminders().catch(console.error);
  });

  // Lite/Pro AI daily tip — 09:00 UTC
  cron.schedule("0 9 * * *", () => {
    void sendDailyAiTips().catch(console.error);
  });

  console.log(
    `Cron started (weekly Mon 00:05 UTC, reminders ${config.reminderHourUtc}:00 UTC, evening 18:00 UTC, reengagement Tue/Fri 11:00 UTC, pro 13:00 UTC, ai tip 09:00 UTC)`,
  );
}

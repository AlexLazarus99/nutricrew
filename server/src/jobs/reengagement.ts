import { prisma } from "../db/client.js";
import { getAppBot } from "../services/botInstance.js";
import { yesterdayUtc } from "../lib/week.js";

export async function runReengagementNudges(): Promise<void> {
  const bot = getAppBot();
  if (!bot) return;

  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

  const candidates = await prisma.user.findMany({
    where: {
      lastMealDate: { lte: new Date(yesterdayUtc()) },
      teamId: { not: null },
    },
    select: {
      telegramId: true,
      locale: true,
      firstName: true,
      lastMealDate: true,
      currentStreak: true,
    },
    take: 200,
  });

  for (const u of candidates) {
    if (!u.lastMealDate) continue;
    const last = u.lastMealDate.getTime();
    const ru = u.locale === "ru";
    let message: string | null = null;

    if (last <= sevenDaysAgo.getTime()) {
      message = ru
        ? `${u.firstName}, команда скучает! Залогируй один приём — и серия снова в игре 🍽️`
        : `${u.firstName}, your crew misses you! Log one meal to get back on track 🍽️`;
    } else if (last <= threeDaysAgo.getTime() && u.currentStreak > 0) {
      message = ru
        ? `🔥 Серия ${u.currentStreak} дн. под угрозой — сфотографируй обед для команды!`
        : `🔥 Your ${u.currentStreak}-day streak is at risk — snap lunch for the team!`;
    }

    if (message) {
      try {
        await bot.telegram.sendMessage(Number(u.telegramId), message);
      } catch {
        /* user blocked bot */
      }
    }
  }
}

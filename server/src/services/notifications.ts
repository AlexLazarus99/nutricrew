import type { Telegraf } from "telegraf";
import type { Context } from "telegraf";
import { t, type BotLocale } from "../bot/i18n.js";
import * as usersRepo from "../repositories/users.js";
import * as teamsRepo from "../repositories/teams.js";
import type { DbUser } from "../types.js";

let bot: Telegraf<Context> | null = null;

export function setNotificationBot(instance: Telegraf<Context>): void {
  bot = instance;
}

async function send(telegramId: number, text: string): Promise<void> {
  if (!bot) return;
  try {
    await bot.telegram.sendMessage(telegramId, text, { parse_mode: "Markdown" });
  } catch (err) {
    console.error(`Notify ${telegramId} failed`, err);
  }
}

function localeOf(user: DbUser): BotLocale {
  return user.locale === "ru" ? "ru" : "en";
}

export async function notifyMealLogged(
  user: DbUser,
  teamName: string,
  points: number,
): Promise<void> {
  const teammates = user.team_id
    ? await usersRepo.listTeamMemberTelegramIds(user.team_id)
    : [];

  const msg = t(localeOf(user));
  for (const tgId of teammates) {
    if (tgId === user.telegram_id) continue;
    const locale = localeOf(user);
    await send(
      tgId,
      locale === "ru"
        ? `🍽 ${user.first_name} залогировал(а) приём пищи (+${points} очк.) — *${teamName}*`
        : `🍽 ${user.first_name} logged a meal (+${points} pts) — *${teamName}*`,
    );
  }
}

function isLocalHour(user: DbUser, targetHour: number): boolean {
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const offset = user.timezone_offset_minutes ?? 0;
  const localHour = Math.floor(((((utcMinutes + offset) % 1440) + 1440) % 1440) / 60);
  return localHour === targetHour;
}

export async function sendMorningReminders(): Promise<void> {
  const users = await usersRepo.listAllWithTeams();
  const today = new Date().toISOString().slice(0, 10);

  for (const user of users) {
    if (user.last_meal_date === today) continue;
    if (user.timezone_offset_minutes != null && !isLocalHour(user, 8)) continue;
    if (user.timezone_offset_minutes == null) {
      const { config } = await import("../config.js");
      if (new Date().getUTCHours() !== config.reminderHourUtc) continue;
    }
    const msg = t(localeOf(user));
    await send(user.telegram_id, msg.reminderBreakfast);
  }
}

export async function sendEveningNudges(): Promise<void> {
  const users = await usersRepo.listAllWithTeams();
  const today = new Date().toISOString().slice(0, 10);

  for (const user of users) {
    if (user.last_meal_date === today) continue;
    if (!user.team_id) continue;
    if (user.timezone_offset_minutes != null && !isLocalHour(user, 18)) continue;
    if (user.timezone_offset_minutes == null && new Date().getUTCHours() !== 18) continue;

    const behind = await getPointsBehind(user);
    const msg = t(localeOf(user));
    await send(
      user.telegram_id,
      msg.reminderBehind(behind.teamName, behind.diff),
    );
  }
}

async function getPointsBehind(user: DbUser): Promise<{ teamName: string; diff: number }> {
  const weekKey = (await import("../lib/week.js")).getCurrentWeekKey();
  const board = await teamsRepo.getLeaderboard(weekKey, 1);
  const top = board[0];
  const myTeam = user.team_id ? await teamsRepo.findById(user.team_id) : null;
  const myScore = user.team_id
    ? (await teamsRepo.getWeeklyProgress(user.team_id, weekKey)).current
    : 0;
  const topScore = top?.points ?? 0;
  return {
    teamName: top?.name ?? "Leader",
    diff: Math.max(0, topScore - myScore),
  };
}

export async function notifyWeeklyPersonalDigest(weekKey: string): Promise<void> {
  const users = await usersRepo.listAllWithTeams();

  for (const user of users) {
    if (!user.team_id) continue;
    const locale = localeOf(user);
    const progress = await teamsRepo.getWeeklyProgress(user.team_id, weekKey);
    const rank = await teamsRepo.getTeamRank(user.team_id, weekKey);
    const text =
      locale === "ru"
        ? `📊 *Итоги недели ${weekKey}*\nКоманда: ${progress.current} ${progress.unit}\nМесто: #${rank}\n\nОткрой NutriCrew — новая битва уже идёт!`
        : `📊 *Week ${weekKey} recap*\nTeam: ${progress.current} ${progress.unit}\nRank: #${rank}\n\nOpen NutriCrew — a new battle is live!`;
    await send(user.telegram_id, text);
  }
}

export async function notifyWeeklyResults(weekKey: string): Promise<void> {
  const winners = await teamsRepo.getWeekWinners(weekKey, 3);
  if (winners.length === 0) return;

  const users = await usersRepo.listAllWithTeams();
  const winnerLine = winners
    .map((w, i) => `${i + 1}. ${w.name} — ${w.points} pts`)
    .join("\n");

  for (const user of users) {
    const locale = localeOf(user);
    const text =
      locale === "ru"
        ? `🏆 *Итоги недели ${weekKey}*\n${winnerLine}\n\nНовая битва началась!`
        : `🏆 *Week ${weekKey} results*\n${winnerLine}\n\nA new battle has started!`;
    await send(user.telegram_id, text);
  }
}

export async function notifyStarPrize(
  user: DbUser,
  stars: number,
  teamName: string,
): Promise<void> {
  const locale = localeOf(user);
  await send(
    user.telegram_id,
    locale === "ru"
      ? `🏆 *+${stars} Stars* за победу команды *${teamName}*! Баланс обновлён.`
      : `🏆 *+${stars} Stars* for winning with *${teamName}*! Balance updated.`,
  );
}

export async function notifyStreakBroken(user: DbUser, teamName: string): Promise<void> {
  const teammates = user.team_id
    ? await usersRepo.listTeamMemberTelegramIds(user.team_id)
    : [];
  for (const tgId of teammates) {
    if (tgId === user.telegram_id) continue;
    const locale = localeOf(user);
    await send(
      tgId,
      locale === "ru"
        ? `⚠️ У ${user.first_name} сбилась серия — множитель команды снижен. *${teamName}*`
        : `⚠️ ${user.first_name}'s streak broke — team multiplier dropped. *${teamName}*`,
    );
  }
}

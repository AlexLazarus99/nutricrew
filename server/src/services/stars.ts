import * as prizesRepo from "../repositories/prizes.js";
import * as teamsRepo from "../repositories/teams.js";
import * as usersRepo from "../repositories/users.js";
import { config } from "../config.js";
import { getCurrentWeekKey } from "../lib/week.js";
import type { Telegraf } from "telegraf";
import type { Context } from "telegraf";
import { createStarsInvoice } from "./payments.js";
import type { AppLocale } from "../types.js";

function weekStartForKey(weekKey: string): Date {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) return new Date();
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return monday;
}

export async function distributeWeeklyPrizes(weekKey: string): Promise<void> {
  const winners = await teamsRepo.getWeekWinners(weekKey, 1);
  const winner = winners[0];
  if (!winner) return;

  const pool = await prizesRepo.getPool(winner.team_id, weekKey);
  if (!pool) return;

  const available = pool.starsTotal - pool.starsDistributed;
  if (available <= 0) return;

  const toDistribute = Math.floor(
    (available * config.stars.winnerSharePercent) / 100,
  );
  if (toDistribute <= 0) return;

  const memberIds = await teamsRepo.getActiveMembersForWeek(
    winner.team_id,
    weekStartForKey(weekKey),
  );
  if (memberIds.length === 0) return;

  const share = Math.max(1, Math.floor(toDistribute / memberIds.length));
  let distributed = 0;

  const { notifyStarPrize } = await import("./notifications.js");

  for (const userId of memberIds) {
    await usersRepo.creditStars(userId, share, "prize_win", `${weekKey}:${winner.team_id}`);
    await prizesRepo.createAward({
      userId,
      teamId: winner.team_id,
      weekKey,
      starsAmount: share,
    });
    const u = await usersRepo.findById(userId);
    if (u) await notifyStarPrize(u, share, winner.name);
    distributed += share;
  }

  await prizesRepo.markPoolDistributed(pool.id, distributed);
  console.log(
    `Distributed ${distributed} Stars to ${memberIds.length} members of ${winner.name}`,
  );
}

export async function getPrizesSummary(userId: number, teamId: string | null) {
  const user = await usersRepo.findById(userId);
  const weekKey = getCurrentWeekKey();

  let pool = null;
  let teamPremium = false;
  if (teamId) {
    pool = await prizesRepo.getOrCreatePool(teamId, weekKey);
    const team = await teamsRepo.findById(teamId);
    teamPremium =
      !!team?.is_premium &&
      (!team.premium_until || team.premium_until > new Date());
  }

  const awards = await prizesRepo.listAwardsForUser(userId);

  return {
    starBalance: user?.star_balance ?? 0,
    pool: pool
      ? {
          weekKey,
          starsTotal: pool.starsTotal,
          starsDistributed: pool.starsDistributed,
          starsAvailable: pool.starsTotal - pool.starsDistributed,
        }
      : null,
    teamPremium,
    premiumPrice: config.stars.premiumPrice,
    awards: awards.map((a) => ({
      weekKey: a.weekKey,
      stars: a.starsAmount,
      at: a.createdAt.toISOString(),
    })),
  };
}

export async function createPoolFundInvoice(
  bot: Telegraf<Context>,
  userId: number,
  teamId: string,
  stars: number,
  locale: AppLocale,
): Promise<string> {
  return createStarsInvoice(bot, {
    userId,
    teamId,
    paymentType: "pool_fund",
    stars,
    title: locale === "ru" ? "Призовой фонд" : "Team prize pool",
    description:
      locale === "ru"
        ? `${stars} Stars — приз победителям недели`
        : `${stars} Stars for weekly winners`,
  });
}

export async function createPremiumInvoice(
  bot: Telegraf<Context>,
  userId: number,
  teamId: string,
  locale: AppLocale,
): Promise<string> {
  return createStarsInvoice(bot, {
    userId,
    teamId,
    paymentType: "premium",
    stars: config.stars.premiumPrice,
    title: locale === "ru" ? "Premium команда" : "Team Premium",
    description:
      locale === "ru"
        ? `Бейдж Premium · ${config.stars.premiumDays} дней`
        : `Premium badge · ${config.stars.premiumDays} days`,
  });
}

export async function createProInvoice(
  bot: Telegraf<Context>,
  userId: number,
  locale: AppLocale,
): Promise<string> {
  return createStarsInvoice(bot, {
    userId,
    teamId: null,
    paymentType: "user_pro",
    stars: config.stars.proPrice,
    title: locale === "ru" ? "NutriCrew Pro" : "NutriCrew Pro",
    description:
      locale === "ru"
        ? `Безлимит ИИ · отчёты · ${config.stars.proDays} дней`
        : `Unlimited AI · reports · ${config.stars.proDays} days`,
  });
}

export async function createProYearlyInvoice(
  bot: Telegraf<Context>,
  userId: number,
  locale: AppLocale,
): Promise<string> {
  return createStarsInvoice(bot, {
    userId,
    teamId: null,
    paymentType: "user_pro_yearly",
    stars: config.stars.proYearlyPrice,
    title: locale === "ru" ? "NutriCrew Pro · год" : "NutriCrew Pro · year",
    description:
      locale === "ru"
        ? `Год Pro · коуч · отчёты · ${config.stars.proYearlyDays} дней`
        : `Annual Pro · coach · reports · ${config.stars.proYearlyDays} days`,
  });
}

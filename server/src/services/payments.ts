import crypto from "node:crypto";
import type { Telegraf } from "telegraf";
import type { Context } from "telegraf";
import { config } from "../config.js";
import * as prizesRepo from "../repositories/prizes.js";
import * as teamsRepo from "../repositories/teams.js";
import { getCurrentWeekKey } from "../lib/week.js";

export async function createStarsInvoice(
  bot: Telegraf<Context>,
  input: {
    userId: number;
    teamId: string;
    paymentType: "pool_fund" | "premium";
    stars: number;
    title: string;
    description: string;
  },
): Promise<string> {
  const stars = clampStars(
    input.paymentType === "premium" ? config.stars.premiumPrice : input.stars,
  );
  const payload = `nc_${crypto.randomUUID().replace(/-/g, "")}`;

  await prizesRepo.createPayment({
    userId: input.userId,
    teamId: input.teamId,
    payload,
    paymentType: input.paymentType,
    starsAmount: stars,
  });

  return bot.telegram.createInvoiceLink({
    title: input.title,
    description: input.description,
    payload,
    provider_token: "",
    currency: "XTR",
    prices: [{ label: "Stars", amount: stars }],
  });
}

function clampStars(amount: number): number {
  return Math.min(
    config.stars.maxPoolFund,
    Math.max(config.stars.minPoolFund, Math.round(amount)),
  );
}

export async function handleSuccessfulPayment(
  payload: string,
  totalAmount: number,
  chargeId: string,
): Promise<{ type: string; stars: number } | null> {
  const payment = await prizesRepo.findPayment(payload);
  if (!payment || payment.status === "completed") return null;

  await prizesRepo.completePayment(payload, chargeId);

  if (payment.paymentType === "pool_fund" && payment.teamId) {
    const weekKey = getCurrentWeekKey();
    await prizesRepo.addToPool(payment.teamId, weekKey, totalAmount);
    return { type: "pool_fund", stars: totalAmount };
  }

  if (payment.paymentType === "premium" && payment.teamId) {
    await teamsRepo.setPremium(payment.teamId, config.stars.premiumDays);
    return { type: "premium", stars: totalAmount };
  }

  return null;
}

export function registerPaymentHandlers(bot: Telegraf<Context>): void {
  bot.on("pre_checkout_query", async (ctx) => {
    await ctx.answerPreCheckoutQuery(true);
  });

  bot.on("message", async (ctx, next) => {
    if (!ctx.message || !("successful_payment" in ctx.message)) {
      return next();
    }

    const sp = ctx.message.successful_payment;
    const result = await handleSuccessfulPayment(
      sp.invoice_payload,
      sp.total_amount,
      sp.telegram_payment_charge_id,
    );

    const locale = ctx.from?.language_code?.startsWith("ru") ? "ru" : "en";

    if (result?.type === "pool_fund") {
      await ctx.reply(
        locale === "ru"
          ? `✅ В призовой фонд добавлено ${result.stars} Stars!`
          : `✅ Added ${result.stars} Stars to the prize pool!`,
      );
    } else if (result?.type === "premium") {
      await ctx.reply(
        locale === "ru"
          ? `⭐ Premium команда на ${config.stars.premiumDays} дней!`
          : `⭐ Team Premium for ${config.stars.premiumDays} days!`,
      );
    }
  });
}

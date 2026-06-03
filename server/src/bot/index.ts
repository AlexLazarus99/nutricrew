import { Markup, Telegraf } from "telegraf";
import type { Context } from "telegraf";
import { config } from "../config.js";
import { resolveBotLocale, t, type BotLocale } from "./i18n.js";
import * as usersRepo from "../repositories/users.js";
import * as teamsRepo from "../repositories/teams.js";
import { createTeamForUser, joinTeam } from "../services/teams.js";
import { getCurrentWeekKey } from "../lib/week.js";
import { setNotificationBot } from "../services/notifications.js";
import { registerPaymentHandlers } from "../services/payments.js";
import { setAppBot } from "../services/botInstance.js";
import { getPrizesSummary } from "../services/stars.js";

function getLocale(ctx: Context, user?: { locale: string } | null): BotLocale {
  if (user?.locale === "ru" || user?.locale === "en") return user.locale;
  return resolveBotLocale(ctx.from?.language_code);
}

function webAppUrl(): string {
  return config.webappUrl.replace(/\/$/, "");
}

/** Inline Web App button — always uses current WEBAPP_URL (reply keyboards cache old URLs). */
function inlineWebAppKeyboard(locale: BotLocale) {
  const msg = t(locale);
  return Markup.inlineKeyboard([[Markup.button.webApp(msg.openApp, webAppUrl())]]);
}

function startAppDeepLink(username: string): string {
  return `https://t.me/${username}?startapp`;
}

/** Sets the bottom-left menu button (next to the message field) for all chats. */
export async function configureBotMenuButton(bot: Telegraf<Context>): Promise<void> {
  const url = webAppUrl();
  if (!url.startsWith("https://")) {
    console.warn("WEBAPP_URL must be HTTPS for Telegram menu button");
    return;
  }

  try {
    await bot.telegram.setChatMenuButton({
      menuButton: {
        type: "web_app",
        text: "NutriCrew",
        web_app: { url },
      },
    });
    console.log(`Menu button → ${url}`);
  } catch (err) {
    console.error("Failed to set menu button (configure in @BotFather):", err);
  }
}

export function createBot(): Telegraf<Context> {
  const bot = new Telegraf<Context>(config.botToken);
  setNotificationBot(bot);
  setAppBot(bot);
  registerPaymentHandlers(bot);

  bot.start(async (ctx) => {
    if (!ctx.from) return;
    const dbUser = await usersRepo.upsertFromTelegram({
      id: ctx.from.id,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name,
      username: ctx.from.username,
      language_code: ctx.from.language_code,
    });

    const locale = getLocale(ctx, dbUser);
    const msg = t(locale);
    const name = ctx.from.first_name ?? "friend";

    const startPayload = ctx.startPayload;
    if (startPayload?.startsWith("join_") && !dbUser.team_id) {
      const { parseInviteStartParam } = await import("../services/referrals.js");
      const parsed = parseInviteStartParam(startPayload);
      if (!parsed.code) {
        /* fall through */
      } else try {
        const team = await joinTeam(dbUser, parsed.code, parsed.referrerTelegramId);
        await ctx.reply(msg.teamJoined(team.name), {
          parse_mode: "Markdown",
          ...inlineWebAppKeyboard(locale),
        });
        return;
      } catch {
        /* fall through to welcome */
      }
    }

    await ctx.reply(msg.welcome(name), {
      parse_mode: "Markdown",
      ...Markup.removeKeyboard(),
    });

    const me = await ctx.telegram.getMe();
    const deepLink = me.username ? startAppDeepLink(me.username) : "";
    const openHint =
      locale === "ru"
        ? deepLink
          ? `Нажмите кнопку ниже или откройте из профиля бота.\nПрямая ссылка: ${deepLink}`
          : "Нажмите кнопку ниже, чтобы открыть приложение."
        : deepLink
          ? `Tap the button below or use Open App on the bot profile.\nDirect link: ${deepLink}`
          : "Tap the button below to open the app.";

    await ctx.reply(openHint, inlineWebAppKeyboard(locale));
  });

  bot.command("app", async (ctx) => {
    if (!ctx.from) return;
    const user = await usersRepo.findByTelegramId(ctx.from.id);
    const locale = getLocale(ctx, user);
    const msg = t(locale);
    await ctx.reply(msg.openAppPrompt, inlineWebAppKeyboard(locale));
  });

  bot.command("help", async (ctx) => {
    if (!ctx.from) return;
    const user = await usersRepo.findByTelegramId(ctx.from.id);
    await ctx.reply(t(getLocale(ctx, user)).help);
  });

  bot.command("team", async (ctx) => {
    if (!ctx.from) return;
    const user = await usersRepo.findByTelegramId(ctx.from.id);
    const locale = getLocale(ctx, user);
    const msg = t(locale);

    if (!user?.team_id) {
      await ctx.reply(msg.noTeam);
      return;
    }

    const team = await teamsRepo.findById(user.team_id);
    if (!team) {
      await ctx.reply(msg.noTeam);
      return;
    }

    const weekKey = getCurrentWeekKey();
    const progress = await teamsRepo.getWeeklyProgress(team.id, weekKey);
    const rank = await teamsRepo.getTeamRank(team.id, weekKey);

    await ctx.reply(
      msg.teamInfo(team.name, rank || 1, progress.current, team.invite_code),
      { parse_mode: "Markdown" },
    );
  });

  bot.command("create", async (ctx) => {
    if (!ctx.from) return;
    const user = await usersRepo.upsertFromTelegram({
      id: ctx.from.id,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name,
      username: ctx.from.username,
      language_code: ctx.from.language_code,
    });
    const locale = getLocale(ctx, user);
    const msg = t(locale);

    if (user.team_id) {
      await ctx.reply(msg.alreadyInTeam);
      return;
    }

    const name = ctx.message.text.replace(/^\/create\s*/i, "").trim();
    if (!name) {
      await ctx.reply(msg.createUsage);
      return;
    }

    const team = await createTeamForUser(user, name);
    await ctx.reply(msg.teamCreated(team.name, team.invite_code), {
      parse_mode: "Markdown",
      ...inlineWebAppKeyboard(locale),
    });
  });

  bot.command("join", async (ctx) => {
    if (!ctx.from) return;
    let user = await usersRepo.upsertFromTelegram({
      id: ctx.from.id,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name,
      username: ctx.from.username,
      language_code: ctx.from.language_code,
    });
    const locale = getLocale(ctx, user);
    const msg = t(locale);

    if (user.team_id) {
      await ctx.reply(msg.alreadyInTeam);
      return;
    }

    const code = ctx.message.text.replace(/^\/join\s*/i, "").trim();
    if (!code) {
      await ctx.reply(msg.joinUsage);
      return;
    }

    try {
      const team = await joinTeam(user, code);
      user = (await usersRepo.findByTelegramId(ctx.from.id))!;
      await ctx.reply(msg.teamJoined(team.name), {
        parse_mode: "Markdown",
        ...inlineWebAppKeyboard(locale),
      });
    } catch {
      await ctx.reply(msg.teamNotFound);
    }
  });

  bot.command("stars", async (ctx) => {
    if (!ctx.from) return;
    const user = await usersRepo.findByTelegramId(ctx.from.id);
    const locale = getLocale(ctx, user);
    if (!user?.team_id) {
      await ctx.reply(locale === "ru" ? "Сначала вступи в команду." : "Join a team first.");
      return;
    }
    const summary = await getPrizesSummary(user.id, user.team_id);
  const msg =
      locale === "ru"
        ? `⭐ Баланс: *${summary.starBalance} Stars*\n` +
          (summary.pool
            ? `Фонд недели: ${summary.pool.starsTotal} ⭐ (доступно ${summary.pool.starsAvailable})\n`
            : "") +
          (summary.teamPremium ? "Premium активен ✅\n" : "") +
          `\nПополни фонд или Premium в Mini App → Prizes`
        : `⭐ Balance: *${summary.starBalance} Stars*\n` +
          (summary.pool
            ? `Weekly pool: ${summary.pool.starsTotal} ⭐ (${summary.pool.starsAvailable} available)\n`
            : "") +
          (summary.teamPremium ? "Premium active ✅\n" : "") +
          `\nFund pool or Premium in Mini App → Prizes`;
    await ctx.reply(msg, { parse_mode: "Markdown", ...inlineWebAppKeyboard(locale) });
  });

  bot.command("lang", async (ctx) => {
    if (!ctx.from) return;
    const user = await usersRepo.findByTelegramId(ctx.from.id);
    const locale = getLocale(ctx, user);
    const msg = t(locale);
    const arg = ctx.message.text.split(/\s+/)[1]?.toLowerCase();

    if (arg !== "en" && arg !== "ru") {
      await ctx.reply(msg.langUsage);
      return;
    }

    if (user) {
      await usersRepo.setLocale(user.id, arg);
    }
    await ctx.reply(msg.langSet(arg), inlineWebAppKeyboard(arg));
  });

  return bot;
}

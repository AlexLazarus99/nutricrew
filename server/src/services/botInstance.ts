import type { Telegraf } from "telegraf";
import type { Context } from "telegraf";

let appBot: Telegraf<Context> | null = null;

export function setAppBot(bot: Telegraf<Context>): void {
  appBot = bot;
}

export function getAppBot(): Telegraf<Context> {
  if (!appBot) {
    throw new Error("Bot not initialized");
  }
  return appBot;
}

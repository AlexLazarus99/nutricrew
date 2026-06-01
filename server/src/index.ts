import { createApiApp } from "./api/index.js";
import { assertConfig, config } from "./config.js";
import { createBot } from "./bot/index.js";
import { runMigrations, disconnectDb } from "./db/migrate.js";
import { startCronJobs } from "./jobs/cron.js";
import { seedIfEmpty } from "./db/seed.js";
import type { Telegraf } from "telegraf";
import type { Context } from "telegraf";

async function main(): Promise<void> {
  assertConfig();

  await runMigrations();
  await seedIfEmpty();

  const app = createApiApp();
  let bot: Telegraf<Context> | null = null;

  if (!config.devSkipBot && config.botToken) {
    bot = createBot();

    if (config.botMode === "webhook") {
      const webhookUrl = `${config.webappUrl.replace(/\/$/, "")}${config.webhookPath}`;
      app.use(bot.webhookCallback(config.webhookPath));
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`Webhook: ${webhookUrl}`);
    } else {
      await bot.launch();
      console.log("Bot: polling mode");
    }
  }

  startCronJobs();

  app.listen(config.port, () => {
    console.log(`API: http://localhost:${config.port}`);
    console.log(`Mini App URL: ${config.webappUrl}`);
    if (config.devBypassAuth) {
      console.log("Dev auth bypass ON — browser works without Telegram");
    }
    if (!config.openaiApiKey) {
      console.log("Vision: fallback mode (set OPENAI_API_KEY for AI photos)");
    }
    if (config.s3.enabled) {
      console.log(`S3: ${config.s3.endpoint} / ${config.s3.bucket}`);
    }
  });

  const shutdown = async (signal: string) => {
    bot?.stop(signal);
    await disconnectDb();
    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { createApiApp } from "./api/index.js";
import { setApiReady } from "./api/ready.js";
import { assertConfig, config } from "./config.js";
import { createBot, configureBotMenuButton } from "./bot/index.js";
import { runMigrations, disconnectDb } from "./db/migrate.js";
import { startCronJobs } from "./jobs/cron.js";
import { seedIfEmpty } from "./db/seed.js";
import type { Telegraf } from "telegraf";
import type { Context } from "telegraf";

async function startBot(app: ReturnType<typeof createApiApp>): Promise<Telegraf<Context> | null> {
  if (config.devSkipBot || !config.botToken) {
    return null;
  }

  try {
    const bot = createBot();
    await configureBotMenuButton(bot);

    if (config.botMode === "webhook") {
      const webhookUrl = `${config.webappUrl.replace(/\/$/, "")}${config.webhookPath}`;
      app.use(bot.webhookCallback(config.webhookPath));
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`Webhook: ${webhookUrl}`);
    } else {
      await bot.launch();
      console.log("Bot: polling mode");
    }

    return bot;
  } catch (err) {
    console.error("Bot startup failed (API keeps running):", err);
    return null;
  }
}

async function main(): Promise<void> {
  assertConfig();

  const app = createApiApp();
  let bot: Telegraf<Context> | null = null;

  // Bind port first — Render requires an open port during startup checks.
  await new Promise<void>((resolve) => {
    app.listen(config.port, config.host, () => {
      console.log(`API: http://${config.host}:${config.port}`);
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
      resolve();
    });
  });

  try {
    await runMigrations();
    await seedIfEmpty();
    setApiReady(true);
    console.log("API ready (database connected)");
  } catch (err) {
    console.error("Database startup failed (API keeps running, /api/health will report db:false):", err);
  }

  bot = await startBot(app);
  startCronJobs();

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

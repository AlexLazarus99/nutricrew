import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = path.resolve(serverRoot, "..");

dotenv.config({ path: path.join(monorepoRoot, ".env") });
dotenv.config({ path: path.join(serverRoot, ".env") });

export const config = {
  port: Number(process.env.PORT ?? 3000),
  botToken: process.env.BOT_TOKEN ?? "",
  webappUrl: process.env.WEBAPP_URL ?? "http://localhost:5173",
  botMode: (process.env.BOT_MODE ?? "polling") as "polling" | "webhook",
  webhookPath: process.env.WEBHOOK_PATH ?? "/telegram/webhook",
  isDev: process.env.NODE_ENV !== "production",
  devBypassAuth: process.env.DEV_BYPASS_AUTH === "true",
  devSkipBot: process.env.DEV_SKIP_BOT === "true",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://nutricrew:nutricrew@localhost:5432/nutricrew",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  visionModel: process.env.VISION_MODEL ?? "gpt-4o-mini",
  cronEnabled: process.env.CRON_ENABLED !== "false",
  reminderHourUtc: Number(process.env.REMINDER_HOUR_UTC ?? 8),

  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
    bucket: process.env.S3_BUCKET ?? "nutricrew",
    accessKey: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.S3_SECRET_KEY ?? "minioadmin",
    region: process.env.S3_REGION ?? "us-east-1",
    publicUrl: process.env.S3_PUBLIC_URL ?? "http://localhost:9000/nutricrew",
    enabled: process.env.S3_ENABLED !== "false",
  },

  stars: {
    premiumPrice: Number(process.env.PREMIUM_STARS_PRICE ?? 99),
    premiumDays: Number(process.env.PREMIUM_DAYS ?? 30),
    minPoolFund: Number(process.env.MIN_POOL_FUND_STARS ?? 10),
    maxPoolFund: Number(process.env.MAX_POOL_FUND_STARS ?? 1000),
    winnerSharePercent: Number(process.env.WINNER_POOL_SHARE_PERCENT ?? 80),
  },
};

export function assertConfig(): void {
  if (config.devSkipBot) {
    console.warn("DEV_SKIP_BOT=true — Telegram bot will not start");
    return;
  }
  if (!config.botToken) {
    throw new Error("BOT_TOKEN is required. Copy .env.example to .env and set your token.");
  }
}

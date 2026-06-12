import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = path.resolve(serverRoot, "..");

dotenv.config({ path: path.join(monorepoRoot, ".env") });
dotenv.config({ path: path.join(serverRoot, ".env") });

export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
  botToken: process.env.BOT_TOKEN ?? "",
  botUsername: (process.env.BOT_USERNAME ?? "").replace(/^@/, ""),
  webappUrl:
    (process.env.WEBAPP_URL ?? "").replace(/\/$/, "") ||
    (process.env.NODE_ENV === "production"
      ? "https://nutricrew-miniapp.vercel.app"
      : "http://localhost:5173"),
  botMode: (process.env.BOT_MODE ?? "polling") as "polling" | "webhook",
  webhookPath: process.env.WEBHOOK_PATH ?? "/telegram/webhook",
  isDev: process.env.NODE_ENV !== "production",
  devBypassAuth: process.env.DEV_BYPASS_AUTH === "true",
  devSkipBot: process.env.DEV_SKIP_BOT === "true",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://nutricrew:nutricrew@localhost:5432/nutricrew",
  anthropicApiKey: (process.env.ANTHROPIC_API_KEY ?? "").trim(),
  claudeVisionModel: process.env.CLAUDE_VISION_MODEL ?? "claude-sonnet-4-6",
  claudeTextModel: process.env.CLAUDE_TEXT_MODEL ?? "claude-sonnet-4-6",
  openaiApiKey: (process.env.OPENAI_API_KEY ?? "").trim(),
  visionModel: process.env.VISION_MODEL ?? "gpt-4o-mini",
  geminiApiKey: (process.env.GEMINI_API_KEY ?? "").trim(),
  geminiVisionModel: process.env.GEMINI_VISION_MODEL ?? "gemini-2.5-flash",
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

  growth: {
    dailyBonusPoints: Number(process.env.DAILY_BONUS_POINTS ?? 8),
    referralTeamPoints: Number(process.env.REFERRAL_TEAM_POINTS ?? 25),
    minTeamForPrizes: Number(process.env.MIN_TEAM_FOR_PRIZES ?? 3),
  },

  social: {
    telegramChannel: process.env.SOCIAL_TELEGRAM_CHANNEL ?? "",
    telegramGroup: process.env.SOCIAL_TELEGRAM_GROUP ?? "",
    instagram: process.env.SOCIAL_INSTAGRAM ?? "",
    x: process.env.SOCIAL_X ?? "",
    youtube: process.env.SOCIAL_YOUTUBE ?? "",
    tiktok: process.env.SOCIAL_TIKTOK ?? "",
  },

  stars: {
    premiumPrice: Number(process.env.PREMIUM_STARS_PRICE ?? 99),
    premiumDays: Number(process.env.PREMIUM_DAYS ?? 30),
    proPrice: Number(process.env.PRO_STARS_PRICE ?? 149),
    proDays: Number(process.env.PRO_DAYS ?? 30),
    minPoolFund: Number(process.env.MIN_POOL_FUND_STARS ?? 10),
    maxPoolFund: Number(process.env.MAX_POOL_FUND_STARS ?? 1000),
    winnerSharePercent: Number(process.env.WINNER_POOL_SHARE_PERCENT ?? 80),
  },
};

export function getPublicSocialLinks(): Record<string, string> {
  const links: Record<string, string> = {};
  const s = config.social;
  if (s.telegramChannel) links.telegramChannel = s.telegramChannel;
  if (s.telegramGroup) links.telegramGroup = s.telegramGroup;
  if (s.instagram) links.instagram = s.instagram;
  if (s.x) links.x = s.x;
  if (s.youtube) links.youtube = s.youtube;
  if (s.tiktok) links.tiktok = s.tiktok;
  return links;
}

export function assertConfig(): void {
  if (config.devSkipBot) {
    console.warn("DEV_SKIP_BOT=true — Telegram bot will not start");
    return;
  }
  if (!config.botToken) {
    console.warn(
      "BOT_TOKEN is not set — API starts without Telegram bot. " +
        "Set BOT_TOKEN in Render Environment (Dashboard → your service → Environment).",
    );
  }
  if (!config.anthropicApiKey && !config.openaiApiKey && !config.geminiApiKey) {
    console.warn(
      "No AI API key — meal analysis will use fallback estimates (450 kcal). " +
        "Set ANTHROPIC_API_KEY, OPENAI_API_KEY and/or GEMINI_API_KEY.",
    );
  } else if (!config.anthropicApiKey && !config.openaiApiKey && config.geminiApiKey) {
    console.warn("Only GEMINI_API_KEY set — AI will use Gemini where available.");
  }
}

import { prisma } from "../db/client.js";
import { config } from "../config.js";
import { setUserProUntil } from "./userPro.js";
import { setLiteCrewUntil } from "./userLiteCrew.js";
import { grantMonthlyProFreeze } from "./proExtras.js";
import { grantStreakFreeze } from "../repositories/growth.js";

type TributeWebhookEvent = {
  name?: string;
  created_at?: string;
  sent_at?: string;
  payload?: Record<string, unknown>;
};

function eventName(event: TributeWebhookEvent): string {
  return String(event.name ?? "").toLowerCase().replace(/-/g, "_");
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function telegramUserId(payload: Record<string, unknown>): number | null {
  const direct =
    num(payload.telegram_user_id) ??
    num(payload.telegramUserId) ??
    num(payload.user_id);

  if (direct != null) return direct;

  const user = payload.user;
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    return num(u.telegram_user_id) ?? num(u.telegramUserId) ?? num(u.id);
  }

  return null;
}

function subscriptionId(payload: Record<string, unknown>): number | null {
  return (
    num(payload.subscription_id) ??
    num(payload.subscriptionId) ??
    num(payload.channel_subscription_id)
  );
}

function parseExpiresAt(payload: Record<string, unknown>): Date | null {
  const raw =
    payload.expires_at ??
    payload.expired_at ??
    payload.member_expires_at ??
    payload.period_end ??
    payload.expiresAt;

  if (typeof raw !== "string" || !raw.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isProSubscription(subscriptionIdValue: number | null): boolean {
  const allowed = config.tribute.proSubscriptionIds;
  if (!allowed.length) return false;
  if (subscriptionIdValue == null) return false;
  return allowed.includes(subscriptionIdValue);
}

function isLiteCrewSubscription(subscriptionIdValue: number | null): boolean {
  const allowed = config.tribute.liteCrewSubscriptionIds;
  if (allowed.length) {
    if (subscriptionIdValue == null) return false;
    return allowed.includes(subscriptionIdValue);
  }
  const proIds = config.tribute.proSubscriptionIds;
  if (
    proIds.length &&
    subscriptionIdValue != null &&
    !proIds.includes(subscriptionIdValue) &&
    config.tribute.proUrls.length >= 2
  ) {
    return true;
  }
  return false;
}

function isLegacyProSubscription(subscriptionIdValue: number | null): boolean {
  const proIds = config.tribute.proSubscriptionIds;
  const liteIds = config.tribute.liteCrewSubscriptionIds;
  if (proIds.length || liteIds.length) return false;
  return true;
}

async function ensureUserByTelegramId(telegramId: number): Promise<number> {
  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(telegramId) },
    create: {
      telegramId: BigInt(telegramId),
      firstName: "NutriCrew",
      locale: "ru",
    },
    update: {},
    select: { id: true },
  });
  return Number(user.id);
}

function liteCrewUntilFromPayload(payload: Record<string, unknown>): Date {
  const explicit = parseExpiresAt(payload);
  if (explicit && explicit.getTime() > Date.now()) return explicit;
  return new Date(Date.now() + config.tribute.liteCrewDays * 24 * 60 * 60 * 1000);
}

function proUntilFromPayload(payload: Record<string, unknown>): Date {
  const explicit = parseExpiresAt(payload);
  if (explicit && explicit.getTime() > Date.now()) return explicit;
  return new Date(Date.now() + config.tribute.proDays * 24 * 60 * 60 * 1000);
}

export async function handleTributeWebhook(event: TributeWebhookEvent): Promise<{
  handled: boolean;
  action?: string;
}> {
  const name = eventName(event);
  const payload = event.payload ?? {};
  const tgId = telegramUserId(payload);
  if (tgId == null) {
    console.warn("[tribute] webhook without telegram user id", name);
    return { handled: false };
  }

  const subId = subscriptionId(payload);

  if (name === "new_subscription" || name === "renewed_subscription") {
    const userId = await ensureUserByTelegramId(tgId);

    if (isLiteCrewSubscription(subId) && !isProSubscription(subId)) {
      const until = liteCrewUntilFromPayload(payload);
      await setLiteCrewUntil(userId, until);
      console.log(`[tribute] LiteCrew until ${until.toISOString()} for tg=${tgId} (${name})`);
      return { handled: true, action: `lite_crew_${name}` };
    }

    if (isProSubscription(subId) || isLegacyProSubscription(subId)) {
      const until = proUntilFromPayload(payload);
      await setUserProUntil(userId, until);

      if (name === "new_subscription") {
        await grantStreakFreeze(userId, 2);
      }
      await grantMonthlyProFreeze(userId);

      console.log(`[tribute] Pro until ${until.toISOString()} for tg=${tgId} (${name})`);
      return { handled: true, action: name };
    }

    if (isLiteCrewSubscription(subId)) {
      const until = liteCrewUntilFromPayload(payload);
      await setLiteCrewUntil(userId, until);
      console.log(`[tribute] LiteCrew until ${until.toISOString()} for tg=${tgId} (${name})`);
      return { handled: true, action: `lite_crew_${name}` };
    }

    return { handled: true, action: "ignored_subscription" };
  }

  if (name === "cancelled_subscription") {
    if (isLiteCrewSubscription(subId) && !isProSubscription(subId)) {
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(tgId) },
        select: { id: true },
      });
      if (!user) return { handled: true, action: "cancelled_no_user" };

      const until = parseExpiresAt(payload);
      if (until && until.getTime() > Date.now()) {
        await setLiteCrewUntil(Number(user.id), until);
        return { handled: true, action: "lite_crew_cancelled_until_period_end" };
      }

      await setLiteCrewUntil(Number(user.id), new Date());
      return { handled: true, action: "lite_crew_cancelled_revoked" };
    }

    if (!isProSubscription(subId) && !isLegacyProSubscription(subId)) {
      return { handled: true, action: "ignored_subscription" };
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(tgId) },
      select: { id: true },
    });
    if (!user) return { handled: true, action: "cancelled_no_user" };

    const until = parseExpiresAt(payload);
    if (until && until.getTime() > Date.now()) {
      await setUserProUntil(Number(user.id), until);
      return { handled: true, action: "cancelled_until_period_end" };
    }

    await setUserProUntil(Number(user.id), new Date());
    return { handled: true, action: "cancelled_revoked" };
  }

  return { handled: false };
}

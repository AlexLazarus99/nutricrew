import { config } from "../config.js";
import { getCurrentWeekKey } from "../lib/week.js";
import * as mealsRepo from "../repositories/meals.js";
import * as teamsRepo from "../repositories/teams.js";
import * as usersRepo from "../repositories/users.js";
import type { DbUser } from "../types.js";

export function parseInviteStartParam(startParam?: string): {
  code?: string;
  referrerTelegramId?: number;
} {
  if (!startParam) return {};
  const raw = startParam.trim();
  const normalized = raw.startsWith("join_") ? raw.slice(5) : raw.startsWith("join") ? raw.slice(4) : raw;
  const refMatch = normalized.match(/^([A-Za-z0-9]+)(?:_ref_?(\d+))?$/i);
  if (!refMatch) return {};
  const code = refMatch[1]?.toUpperCase();
  const referrerTelegramId = refMatch[2] ? Number(refMatch[2]) : undefined;
  return {
    code,
    referrerTelegramId: Number.isFinite(referrerTelegramId) ? referrerTelegramId : undefined,
  };
}

export function parseReferralStartParam(startParam?: string): {
  referrerTelegramId?: number;
} {
  if (!startParam) return {};
  const raw = startParam.trim();
  const match = raw.match(/^ref[_-]?(\d+)$/i);
  if (!match) return {};
  const referrerTelegramId = Number(match[1]);
  return Number.isFinite(referrerTelegramId) ? { referrerTelegramId } : {};
}

export function referrerTelegramIdFromStartParam(startParam?: string): number | undefined {
  const fromRef = parseReferralStartParam(startParam).referrerTelegramId;
  if (fromRef != null) return fromRef;
  return parseInviteStartParam(startParam).referrerTelegramId;
}

export async function attachReferrerOnJoin(
  joiner: DbUser,
  referrerTelegramId?: number,
): Promise<void> {
  if (!referrerTelegramId || joiner.referred_by_user_id) return;
  const referrer = await usersRepo.findByTelegramId(referrerTelegramId);
  if (!referrer || referrer.id === joiner.id) return;
  await usersRepo.setReferredBy(joiner.id, referrer.id);
}

export async function maybeRewardReferralFirstMeal(user: DbUser): Promise<number> {
  if (!user.referred_by_user_id || !user.team_id) return 0;

  const mealCount = await mealsRepo.countUserMeals(user.id);
  if (mealCount !== 1) return 0;

  const referrer = await usersRepo.findById(user.referred_by_user_id);
  if (!referrer?.team_id) return 0;

  const points = config.growth.referralTeamPoints;
  const weekKey = getCurrentWeekKey();
  await teamsRepo.addWeeklyPoints(referrer.team_id, weekKey, points);
  await usersRepo.clearReferredBy(user.id);
  return points;
}

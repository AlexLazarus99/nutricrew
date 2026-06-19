import { prisma } from "../db/client.js";
import { config } from "../config.js";
import { extendUserPro } from "./userPro.js";
import * as usersRepo from "../repositories/users.js";

export type ReferralPaymentKind = "lite_crew" | "pro" | "pro_yearly";

export function buildReferralShareUrl(
  botUsername: string | null | undefined,
  referrerTelegramId: number,
): string | null {
  const user = botUsername?.replace(/^@/, "");
  if (!user || !Number.isFinite(referrerTelegramId)) return null;
  return `https://t.me/${user}?startapp=${encodeURIComponent(`ref_${referrerTelegramId}`)}`;
}

export async function maybeRewardReferrerForPayment(
  payerUserId: number,
  kind: ReferralPaymentKind,
): Promise<{ rewarded: boolean; referrerUserId?: number; proDays?: number }> {
  const payer = await usersRepo.findById(payerUserId);
  if (!payer?.referred_by_user_id) return { rewarded: false };

  const referrerUserId = payer.referred_by_user_id;
  if (referrerUserId === payerUserId) return { rewarded: false };

  const existing = await prisma.referralPaidReward.findUnique({
    where: { referredUserId: BigInt(payerUserId) },
  });
  if (existing) return { rewarded: false };

  const proDays =
    kind === "lite_crew"
      ? config.growth.referralProDaysLiteCrew
      : kind === "pro_yearly"
        ? config.growth.referralProDaysPro * 2
        : config.growth.referralProDaysPro;

  if (proDays <= 0) return { rewarded: false };

  try {
    await prisma.referralPaidReward.create({
      data: {
        referredUserId: BigInt(payerUserId),
        referrerUserId: BigInt(referrerUserId),
        rewardKind: kind,
        proDaysGranted: proDays,
      },
    });
  } catch {
    return { rewarded: false };
  }

  await extendUserPro(referrerUserId, proDays);
  return { rewarded: true, referrerUserId, proDays };
}

export async function getReferrerRewardStats(referrerUserId: number) {
  const rows = await prisma.referralPaidReward.findMany({
    where: { referrerUserId: BigInt(referrerUserId) },
    select: { proDaysGranted: true },
  });
  return {
    paidReferrals: rows.length,
    proDaysEarned: rows.reduce((sum, row) => sum + row.proDaysGranted, 0),
  };
}

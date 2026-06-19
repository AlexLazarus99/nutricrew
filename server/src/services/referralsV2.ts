import { config } from "../config.js";
import { prisma } from "../db/client.js";
import * as mealsRepo from "../repositories/meals.js";
import * as usersRepo from "../repositories/users.js";
import {
  buildReferralShareUrl,
  getReferrerRewardStats,
} from "./referralRewards.js";

const REFERRAL_TIERS = [
  { count: 3, stars: 15 },
  { count: 5, stars: 35 },
  { count: 10, stars: 80 },
];

export async function getReferralProgress(userId: number) {
  const user = await usersRepo.findById(userId);
  const referrals = await prisma.user.findMany({
    where: { referredByUserId: BigInt(userId) },
    select: { id: true },
  });
  let active = 0;
  for (const r of referrals) {
    const meals = await mealsRepo.countUserMeals(Number(r.id));
    if (meals >= 3) active++;
  }
  const next = REFERRAL_TIERS.find((t) => active < t.count);
  const rewardStats = await getReferrerRewardStats(userId);
  const shareUrl =
    user != null
      ? buildReferralShareUrl(config.botUsername, user.telegram_id)
      : null;

  return {
    totalReferrals: referrals.length,
    activeReferrals: active,
    paidReferrals: rewardStats.paidReferrals,
    proDaysEarned: rewardStats.proDaysEarned,
    tiers: REFERRAL_TIERS,
    nextTier: next ?? null,
    shareUrl,
    rewards: {
      proDaysLiteCrew: config.growth.referralProDaysLiteCrew,
      proDaysPro: config.growth.referralProDaysPro,
    },
  };
}

export async function claimReferralTierReward(userId: number, tierCount: number) {
  const progress = await getReferralProgress(userId);
  const tier = REFERRAL_TIERS.find((t) => t.count === tierCount);
  if (!tier || progress.activeReferrals < tier.count) {
    throw new Error("TIER_NOT_REACHED");
  }
  const refId = `referral_tier_${tierCount}`;
  const existing = await prisma.starTransaction.findFirst({
    where: { userId: BigInt(userId), type: "referral_tier", referenceId: refId },
  });
  if (existing) throw new Error("ALREADY_CLAIMED");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: BigInt(userId) },
      data: { starBalance: { increment: tier.stars } },
    }),
    prisma.starTransaction.create({
      data: {
        userId: BigInt(userId),
        amount: tier.stars,
        type: "referral_tier",
        referenceId: refId,
      },
    }),
  ]);
  return { stars: tier.stars };
}

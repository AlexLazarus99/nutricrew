import * as xpSpendRepo from "../repositories/xpSpend.js";
import { computeUserProgress } from "./progress.js";
import type { DbUser } from "../types.js";

export type XpWallet = {
  totalXp: number;
  spentXp: number;
  availableXp: number;
};

export async function getXpWallet(user: DbUser): Promise<XpWallet> {
  const progress = await computeUserProgress(user);
  const spentXp = await xpSpendRepo.sumSpentByUser(user.id);
  return {
    totalXp: progress.xp,
    spentXp,
    availableXp: Math.max(0, progress.xp - spentXp),
  };
}

export async function spendXp(
  userId: number,
  amount: number,
  spendType: string,
  referenceId: string,
  user: DbUser,
): Promise<{ ok: boolean; error?: string; wallet?: XpWallet }> {
  const cost = Math.max(0, Math.round(amount));
  if (cost <= 0) return { ok: false, error: "INVALID_AMOUNT" };

  if (await xpSpendRepo.hasSpend(userId, spendType, referenceId)) {
    return { ok: false, error: "ALREADY_SPENT" };
  }

  const wallet = await getXpWallet(user);
  if (wallet.availableXp < cost) {
    return { ok: false, error: "INSUFFICIENT_XP", wallet };
  }

  const recorded = await xpSpendRepo.recordSpend({
    userId,
    spendType,
    referenceId,
    amount: cost,
  });
  if (!recorded) return { ok: false, error: "SPEND_FAILED" };

  return { ok: true, wallet: await getXpWallet(user) };
}

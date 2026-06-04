import type { Telegraf } from "telegraf";
import type { Context } from "telegraf";
import {
  BIRD_CATALOG,
  BIRD_TRIALS,
  getBirdDef,
  getTrialDef,
  isBirdId,
  trialsForBird,
  type BirdId,
} from "../lib/birdCatalog.js";
import * as birdRosterRepo from "../repositories/birdRoster.js";
import * as usersRepo from "../repositories/users.js";
import { createBirdUnlockInvoice } from "./payments.js";

export type BirdRosterPayload = {
  selectedBirdId: string;
  starBalance: number;
  birds: Array<{
    id: string;
    starPrice: number;
    invoiceStars: number;
    free: boolean;
    owned: boolean;
    trials: Array<{
      id: string;
      requiredLevel: number;
      rewardStars: number;
      completed: boolean;
    }>;
  }>;
  trialsCompleted: string[];
};

export async function getBirdRoster(userId: number): Promise<BirdRosterPayload> {
  await birdRosterRepo.ensureClassicUnlocked(userId);
  const [owned, completed, selected, user] = await Promise.all([
    birdRosterRepo.listOwnedBirdIds(userId),
    birdRosterRepo.listCompletedTrialIds(userId),
    birdRosterRepo.getSelectedBirdId(userId),
    usersRepo.findById(userId),
  ]);
  const ownedSet = new Set(owned);
  const completedSet = new Set(completed);

  const birds = [...BIRD_CATALOG]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => ({
      id: b.id,
      starPrice: b.starPrice,
      invoiceStars: b.invoiceStars,
      free: b.free,
      owned: b.free || ownedSet.has(b.id),
      trials: trialsForBird(b.id).map((t) => ({
        id: t.id,
        requiredLevel: t.requiredLevel,
        rewardStars: t.rewardStars,
        completed: completedSet.has(t.id),
      })),
    }));

  let selectedBirdId = selected;
  if (!ownedSet.has(selectedBirdId) && !getBirdDef(selectedBirdId)?.free) {
    selectedBirdId = "classic";
    await birdRosterRepo.setSelectedBird(userId, "classic");
  }

  return {
    selectedBirdId,
    starBalance: user?.star_balance ?? 0,
    birds,
    trialsCompleted: completed,
  };
}

export async function selectBird(userId: number, birdId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isBirdId(birdId)) return { ok: false, error: "INVALID_BIRD" };
  const def = getBirdDef(birdId)!;
  if (!def.free) {
    const owned = await birdRosterRepo.hasBird(userId, birdId);
    if (!owned) return { ok: false, error: "NOT_OWNED" };
  }
  await birdRosterRepo.setSelectedBird(userId, birdId);
  return { ok: true };
}

export async function unlockWithStars(
  userId: number,
  birdId: string,
): Promise<{ ok: boolean; error?: string; starBalance?: number }> {
  if (!isBirdId(birdId)) return { ok: false, error: "INVALID_BIRD" };
  const def = getBirdDef(birdId)!;
  if (def.free) return { ok: false, error: "ALREADY_FREE" };
  if (await birdRosterRepo.hasBird(userId, birdId)) return { ok: false, error: "ALREADY_OWNED" };

  const user = await usersRepo.findById(userId);
  if (!user || user.star_balance < def.starPrice) {
    return { ok: false, error: "INSUFFICIENT_STARS" };
  }

  const spent = await usersRepo.spendStars(userId, def.starPrice, "bird_unlock", birdId);
  if (!spent) return { ok: false, error: "INSUFFICIENT_STARS" };

  await birdRosterRepo.unlockBird(userId, birdId);
  await birdRosterRepo.setSelectedBird(userId, birdId);

  const updated = await usersRepo.findById(userId);
  return { ok: true, starBalance: updated?.star_balance ?? 0 };
}

export async function createBirdInvoice(
  bot: Telegraf<Context>,
  userId: number,
  birdId: string,
  locale: string,
): Promise<{ invoiceLink: string } | { error: string }> {
  if (!isBirdId(birdId)) return { error: "INVALID_BIRD" };
  const def = getBirdDef(birdId)!;
  if (def.free || def.invoiceStars <= 0) return { error: "NOT_FOR_SALE" };
  if (await birdRosterRepo.hasBird(userId, birdId)) return { error: "ALREADY_OWNED" };

  const ru = locale.startsWith("ru");
  const names: Record<BirdId, [string, string]> = {
    classic: ["NutriBird Classic", "NutriBird Классик"],
    ember: ["Ember Phoenix", "Птица Ember"],
    frost: ["Frost Glider", "Ледяной глайдер"],
    neon: ["Neon Comet", "Неоновая комета"],
    royal: ["Royal Aurora", "Королевская аврора"],
    storm: ["Storm Titan", "Штормовой титан"],
  };
  const [titleEn, titleRu] = names[birdId];
  const title = ru ? titleRu : titleEn;
  const description = ru
    ? `Разблокируйте птицу в NutriBird с уникальными навыками.`
    : `Unlock this NutriBird with unique skills and trials.`;

  const link = await createBirdUnlockInvoice(bot, {
    userId,
    birdId,
    stars: def.invoiceStars,
    title,
    description,
  });
  return { invoiceLink: link };
}

export async function grantBirdFromPayment(userId: number, birdId: string): Promise<void> {
  if (!isBirdId(birdId)) return;
  await birdRosterRepo.unlockBird(userId, birdId);
  await birdRosterRepo.setSelectedBird(userId, birdId);
}

export type TrialCompleteResult = {
  newlyCompleted: Array<{ trialId: string; rewardStars: number }>;
  starBalance: number;
};

export async function processTrialsOnScore(
  userId: number,
  birdId: string,
  level: number,
): Promise<TrialCompleteResult> {
  const newlyCompleted: TrialCompleteResult["newlyCompleted"] = [];
  if (!isBirdId(birdId)) {
    const user = await usersRepo.findById(userId);
    return { newlyCompleted, starBalance: user?.star_balance ?? 0 };
  }

  const owned = await birdRosterRepo.hasBird(userId, birdId);
  if (!owned && birdId !== "classic") {
    const user = await usersRepo.findById(userId);
    return { newlyCompleted, starBalance: user?.star_balance ?? 0 };
  }

  for (const trial of BIRD_TRIALS) {
    if (trial.birdId !== birdId) continue;
    if (level < trial.requiredLevel) continue;

    const created = await birdRosterRepo.completeTrial(userId, trial.id, level);
    if (!created) continue;

    await usersRepo.creditStars(userId, trial.rewardStars, "bird_trial", trial.id);
    newlyCompleted.push({ trialId: trial.id, rewardStars: trial.rewardStars });
  }

  const user = await usersRepo.findById(userId);
  return { newlyCompleted, starBalance: user?.star_balance ?? 0 };
}

export function validateTrialId(id: string): boolean {
  return !!getTrialDef(id);
}

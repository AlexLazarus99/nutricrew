import * as growthRepo from "../repositories/growth.js";
import * as metaRepo from "../repositories/birdGameMeta.js";
import * as usersRepo from "../repositories/users.js";
import { spendXp } from "./xpWallet.js";

const BASE_DAILY_TARGET = 22;
const UPGRADE_MAX = 3;
const UPGRADE_COSTS = [800, 1500, 3000] as const;

export type UpgradeKind = "ghost" | "gap" | "nearMiss";

function seasonDailyDelta(): number {
  const m = new Date().getUTCMonth();
  if (m === 11 || m === 0) return 0;
  if (m >= 2 && m <= 4) return -2;
  if (m >= 8 && m <= 9) return -2;
  return 0;
}

export function dailyTarget(): number {
  return Math.max(12, BASE_DAILY_TARGET + seasonDailyDelta());
}

export function seasonRewardStars(): number {
  const m = new Date().getUTCMonth();
  if (m === 11 || m === 0) return 10;
  if (m >= 5 && m <= 7) return 6;
  return 5;
}

export function validateScore(score: number, level: number, fruits: number): string | null {
  if (!Number.isFinite(score) || score < 0 || score > 50_000) return "Invalid score";
  if (!Number.isFinite(level) || level < 1 || level > 5000) return "Invalid level";
  const expectedLevel = Math.floor(score / 3) + 1;
  if (level > expectedLevel + 2 || level < expectedLevel - 1) return "Level mismatch";
  const maxPerSecond = 12;
  const maxPlausible = Math.min(50_000, level * 15 + fruits * 3 + 80);
  if (score > maxPlausible) return "Score too high";
  if (score > level * maxPerSecond) return "Score rate implausible";
  return null;
}

export async function getGameMeta(userId: number) {
  const dayKey = metaRepo.todayKeyUtc();
  const target = dailyTarget();
  const [daily, upgrades, boostFields] = await Promise.all([
    metaRepo.getDaily(userId, dayKey),
    metaRepo.getUpgrades(userId),
    growthRepo.getUserGrowthFields(userId),
  ]);
  const birdBoostActive =
    !!boostFields?.birdBoostUntil && boostFields.birdBoostUntil.getTime() > Date.now();

  const ghostLevel = upgrades?.ghostLevel ?? 0;
  const gapLevel = upgrades?.gapLevel ?? 0;
  const nearMissLevel = upgrades?.nearMissLevel ?? 0;

  return {
    daily: {
      best: daily?.bestScore ?? 0,
      target,
      done: (daily?.bestScore ?? 0) >= target,
      claimed: daily?.claimed ?? false,
      rewardStars: seasonRewardStars(),
    },
    upgrades: { ghostLevel, gapLevel, nearMissLevel },
    upgradeCosts: {
      ghost: ghostLevel < UPGRADE_MAX ? UPGRADE_COSTS[ghostLevel] : null,
      gap: gapLevel < UPGRADE_MAX ? UPGRADE_COSTS[gapLevel] : null,
      nearMiss: nearMissLevel < UPGRADE_MAX ? UPGRADE_COSTS[nearMissLevel] : null,
    },
    birdBoost: { active: birdBoostActive },
    season: {
      id: seasonId(),
      rewardStars: seasonRewardStars(),
    },
  };
}

function seasonId(): string {
  const m = new Date().getUTCMonth();
  if (m === 11 || m === 0) return "holiday";
  if (m <= 1) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "autumn";
}

export async function recordScoreMeta(
  userId: number,
  displayName: string,
  score: number,
  birdId: string,
  samples?: Array<{ t: number; y: number }>,
) {
  const dayKey = metaRepo.todayKeyUtc();
  await metaRepo.upsertDailyBest(userId, dayKey, score);
  if (samples && samples.length >= 4) {
    await metaRepo.saveGhostRun(userId, displayName, birdId, score, samples.slice(0, 80));
  }
}

export async function claimDailyReward(userId: number) {
  const dayKey = metaRepo.todayKeyUtc();
  const target = dailyTarget();
  const daily = await metaRepo.getDaily(userId, dayKey);
  if (!daily || daily.bestScore < target) {
    return { ok: false as const, error: "NOT_COMPLETE" };
  }
  if (daily.claimed) {
    return { ok: false as const, error: "ALREADY_CLAIMED" };
  }
  const stars = seasonRewardStars();
  await usersRepo.creditStars(userId, stars, "bird_daily", dayKey);
  await metaRepo.markDailyClaimed(userId, dayKey);
  const user = await usersRepo.findById(userId);
  return { ok: true as const, rewardStars: stars, starBalance: user?.star_balance ?? 0 };
}

export async function purchaseUpgrade(userId: number, kind: UpgradeKind) {
  const row = await metaRepo.getUpgrades(userId);
  const ghostLevel = row?.ghostLevel ?? 0;
  const gapLevel = row?.gapLevel ?? 0;
  const nearMissLevel = row?.nearMissLevel ?? 0;

  const level =
    kind === "ghost" ? ghostLevel : kind === "gap" ? gapLevel : nearMissLevel;
  if (level >= UPGRADE_MAX) return { ok: false as const, error: "MAX_LEVEL" };

  const cost = UPGRADE_COSTS[level];
  const user = await usersRepo.findById(userId);
  if (!user) return { ok: false as const, error: "USER_NOT_FOUND" };

  const spend = await spendXp(userId, cost, "bird_upgrade", `${kind}_${level + 1}`, user);
  if (!spend.ok) return { ok: false as const, error: spend.error ?? "NOT_ENOUGH_XP" };

  const next = {
    ghostLevel: kind === "ghost" ? ghostLevel + 1 : ghostLevel,
    gapLevel: kind === "gap" ? gapLevel + 1 : gapLevel,
    nearMissLevel: kind === "nearMiss" ? nearMissLevel + 1 : nearMissLevel,
  };
  await metaRepo.upsertUpgrades(userId, next);
  return {
    ok: true as const,
    upgrades: next,
    availableXp: spend.wallet?.availableXp ?? 0,
  };
}

export async function getDuelOpponent(userId: number, myBest: number) {
  const row = await metaRepo.findDuelOpponent(userId, myBest);
  if (!row) return null;
  return {
    name: row.displayName,
    score: row.score,
    birdId: row.birdId,
    samples: row.samples as Array<{ t: number; y: number }>,
  };
}

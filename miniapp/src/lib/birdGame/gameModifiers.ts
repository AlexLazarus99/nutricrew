import type { FruitType, GameBootOptions, GameState, TutorialTipId } from "./types";

export const BIRD_BOOST_HITS = 1;
export const BIRD_BOOST_GHOST_MS = 1800;

export const NUTRITION_DECAY_INTERVAL_MS = 9000;
export const NUTRITION_DECAY_AMOUNT = 2;

export const GHOST_SAMPLE_INTERVAL_MS = 220;
export const MAX_GHOST_SAMPLES = 90;

export const UPGRADE_MAX_LEVEL = 3;
export const UPGRADE_COSTS = [800, 1500, 3000] as const;

export type UpgradeKind = "ghost" | "gap" | "nearMiss";

export type MetaUpgrades = {
  ghostLevel: number;
  gapLevel: number;
  nearMissLevel: number;
};

export const EMPTY_META: MetaUpgrades = { ghostLevel: 0, gapLevel: 0, nearMissLevel: 0 };

export function metaGhostBonusMs(meta: MetaUpgrades): number {
  return meta.ghostLevel * 400;
}

export function metaGapBonus(meta: MetaUpgrades): number {
  return meta.gapLevel * 6;
}

export function metaNearMissMult(meta: MetaUpgrades): number {
  return 1 + meta.nearMissLevel * 0.06;
}

export function upgradeCost(_kind: UpgradeKind, currentLevel: number): number | null {
  if (currentLevel >= UPGRADE_MAX_LEVEL) return null;
  return UPGRADE_COSTS[currentLevel];
}

export function fruitGhostMs(fruit: FruitType, baseMs: number, meta: MetaUpgrades): number {
  const bonus = metaGhostBonusMs(meta);
  switch (fruit) {
    case "peach":
      return baseMs * 1.45 + bonus;
    case "grape":
      return baseMs * 0.85 + bonus;
    default:
      return baseMs + bonus;
  }
}

export function defaultSessionFields(
  boot: GameBootOptions = {},
): Pick<
  GameState,
  | "birdBoostHits"
  | "reduceMotion"
  | "metaGhostBonusMs"
  | "metaGapBonus"
  | "metaNearMissMult"
  | "seasonalNutritionMult"
  | "ghostDuel"
  | "ghostSamples"
  | "junkSpawnsEnabled"
  | "deathPendingUntil"
  | "paused"
  | "nutritionDecayMs"
  | "tutorialShown"
  | "activeTutorialTip"
  | "tutorialTipUntil"
> {
  return {
    birdBoostHits: boot.birdBoostActive ? BIRD_BOOST_HITS : 0,
    reduceMotion: boot.reduceMotion ?? false,
    metaGhostBonusMs: boot.metaGhostBonusMs ?? 0,
    metaGapBonus: boot.metaGapBonus ?? 0,
    metaNearMissMult: boot.metaNearMissMult ?? 1,
    seasonalNutritionMult: boot.seasonalNutritionMult ?? 1,
    ghostDuel: boot.ghostDuel ?? null,
    ghostSamples: [],
    junkSpawnsEnabled: false,
    deathPendingUntil: 0,
    paused: false,
    nutritionDecayMs: 0,
    tutorialShown: [] as TutorialTipId[],
    activeTutorialTip: null,
    tutorialTipUntil: 0,
  };
}

export function fruitNutritionGain(
  fruit: FruitType,
  baseGain: number,
  seasonalNutritionMult: number,
): number {
  const mult = seasonalNutritionMult;
  switch (fruit) {
    case "apple":
      return baseGain * 1.1 * mult;
    case "peach":
      return baseGain * 0.95 * mult;
    case "grape":
      return baseGain * 0.75 * mult;
    default:
      return baseGain * mult;
  }
}

import type { BirdId } from "./birdCatalog";
import { DEFAULT_BIRD_ID, isBirdId } from "./birdCatalog";

export type BirdModifiers = {
  speedMult: number;
  fruitNutritionMult: number;
  slowMoFactorMult: number;
  maxNitroStacks: number;
  ghostExtraMs: number;
  gapBonus: number;
  junkBurn: boolean;
  bossBoostExtraMs: number;
};

const MODIFIERS: Record<BirdId, BirdModifiers> = {
  classic: {
    speedMult: 1,
    fruitNutritionMult: 1,
    slowMoFactorMult: 1,
    maxNitroStacks: 5,
    ghostExtraMs: 0,
    gapBonus: 0,
    junkBurn: false,
    bossBoostExtraMs: 0,
  },
  ember: {
    speedMult: 1.03,
    fruitNutritionMult: 1.18,
    slowMoFactorMult: 1,
    maxNitroStacks: 5,
    ghostExtraMs: 0,
    gapBonus: 0,
    junkBurn: true,
    bossBoostExtraMs: 0,
  },
  frost: {
    speedMult: 0.98,
    fruitNutritionMult: 1.05,
    slowMoFactorMult: 1.4,
    maxNitroStacks: 5,
    ghostExtraMs: 400,
    gapBonus: 6,
    junkBurn: false,
    bossBoostExtraMs: 0,
  },
  neon: {
    speedMult: 1.1,
    fruitNutritionMult: 1,
    slowMoFactorMult: 1,
    maxNitroStacks: 6,
    ghostExtraMs: 200,
    gapBonus: 0,
    junkBurn: false,
    bossBoostExtraMs: 0,
  },
  royal: {
    speedMult: 1,
    fruitNutritionMult: 1.08,
    slowMoFactorMult: 1.1,
    maxNitroStacks: 5,
    ghostExtraMs: 900,
    gapBonus: 14,
    junkBurn: false,
    bossBoostExtraMs: 0,
  },
  storm: {
    speedMult: 1.06,
    fruitNutritionMult: 1,
    slowMoFactorMult: 1,
    maxNitroStacks: 5,
    ghostExtraMs: 0,
    gapBonus: 0,
    junkBurn: false,
    bossBoostExtraMs: 2500,
  },
};

export function resolveBirdId(id: string | undefined): BirdId {
  if (id && isBirdId(id)) return id;
  return DEFAULT_BIRD_ID;
}

export function getBirdModifiers(id: string | undefined): BirdModifiers {
  return MODIFIERS[resolveBirdId(id)];
}

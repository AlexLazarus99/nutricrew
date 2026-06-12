import {
  GHOST_SAMPLE_INTERVAL_MS,
  MAX_GHOST_SAMPLES,
  NUTRITION_DECAY_AMOUNT,
  NUTRITION_DECAY_INTERVAL_MS,
  fruitGhostMs,
  fruitNutritionGain,
  type MetaUpgrades,
} from "./gameModifiers";
import { extendGhostUntil } from "./gameSessionGhost";
import type { FruitType, GameState, GhostSample } from "./types";

export function applyNutritionDecay(state: GameState, dtMs: number): GameState {
  if (state.phase !== "playing" || state.bird.nutrition <= 0) return state;
  const nextAcc = state.nutritionDecayMs + dtMs;
  if (nextAcc < NUTRITION_DECAY_INTERVAL_MS) {
    return { ...state, nutritionDecayMs: nextAcc };
  }
  const ticks = Math.floor(nextAcc / NUTRITION_DECAY_INTERVAL_MS);
  const nutrition = Math.max(0, state.bird.nutrition - NUTRITION_DECAY_AMOUNT * ticks);
  return {
    ...state,
    nutritionDecayMs: nextAcc - ticks * NUTRITION_DECAY_INTERVAL_MS,
    bird: { ...state.bird, nutrition },
  };
}

export function recordGhostSamples(state: GameState): GameState {
  if (state.phase !== "playing") return state;
  const last = state.ghostSamples[state.ghostSamples.length - 1];
  if (last && state.elapsed - last.t < GHOST_SAMPLE_INTERVAL_MS) return state;
  const samples = [...state.ghostSamples, { t: state.elapsed, y: state.bird.y }];
  if (samples.length > MAX_GHOST_SAMPLES) samples.shift();
  return { ...state, ghostSamples: samples };
}

export function fruitPickupEffects(
  state: GameState,
  fruit: FruitType,
  baseGain: number,
  baseGhostMs: number,
  meta: MetaUpgrades,
): {
  gain: number;
  ghostMs: number;
  comboBump: number;
} {
  return {
    gain: fruitNutritionGain(fruit, baseGain, state.seasonalNutritionMult),
    ghostMs: fruitGhostMs(fruit, baseGhostMs, meta),
    comboBump: fruit === "grape" ? 2 : 0,
  };
}

export function wouldCollide(state: GameState, check: (s: GameState) => boolean): boolean {
  return check(state);
}

export function applyBirdBoostSave(state: GameState): GameState {
  return {
    ...state,
    birdBoostHits: Math.max(0, state.birdBoostHits - 1),
    ghostUntil: extendGhostUntil(state, 1500),
    screenFlashUntil: state.elapsed + 200,
    screenFlashAlpha: state.reduceMotion ? 0.15 : 0.28,
    screenFlashColor: "#29B6F6",
    screenShakeUntil: state.reduceMotion ? 0 : state.elapsed + 160,
    screenShakeMag: state.reduceMotion ? 0 : 4,
  };
}

export function beginDeathSlowMo(state: GameState): GameState {
  return {
    ...state,
    deathPendingUntil: state.elapsed + 520,
    slowMoUntil: state.elapsed + 520,
    screenFlashUntil: state.elapsed + 280,
    screenFlashAlpha: state.reduceMotion ? 0.2 : 0.35,
    screenFlashColor: "#FF5252",
    screenShakeUntil: state.reduceMotion ? 0 : state.elapsed + 300,
    screenShakeMag: state.reduceMotion ? 0 : 6,
  };
}

export function samplesForSubmit(samples: GhostSample[]): GhostSample[] {
  if (samples.length <= 60) return samples;
  const step = Math.ceil(samples.length / 60);
  return samples.filter((_, i) => i % step === 0);
}

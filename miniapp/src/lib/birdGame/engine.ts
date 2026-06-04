import {
  GAME_STORAGE_KEY,
  NUTRITION_GAIN,
  TREE_WIDTH,
  type DebrisParticle,
  type FruitType,
  type GamePhase,
  type GameState,
  type Hazard,
  type JunkObstacle,
  type JunkType,
  type MountainHazard,
  type Pickup,
  type PickupType,
  type SharkHazard,
  type OctopusTentacle,
  type AnimalBoss,
  type BossKind,
  type BoarExplosion,
  type BoarExplosionPart,
  type TreeObstacle,
  type TreeType,
  type Meteor,
  type Pterodactyl,
  type Crater,
} from "./types";
import {
  BOSS_INTERVAL,
  bossKindForMilestone,
  bossMilestoneForLevel,
  bossSpec,
  biomeForLevel,
  biomePalette,
  cityPalette,
  isCityLevel,
  cityForLevel,
  biomeDisplayName,
  cityDisplayName,
} from "./progression";
import { effectiveSeaBlend, drawBiomeBackdrop, drawBiomeForeground, drawDiveSuitBird } from "./biomes";
import { drawCityscape, drawCityGround, drawCitySky, drawCityObstacleBuilding, drawCityLandmarkForeground } from "./cities";
import { computeZoneVisual, type ZoneVisual } from "./zoneTransition";
import { parseColorRgb, rgbString, lerpRgb, sanitizeBiomePalette } from "./colorUtils.js";
import type { BiomePalette } from "./progression";
import {
  BOAR_DEFEAT_VIEW_MS,
  computeBossBiteIntent,
  bossHeadAnchor,
  drawAnimalBoss,
  drawBossFloatingTitle,
} from "./bosses";
import { getBirdModifiers } from "./birdModifiers";
import { drawBirdTrail, drawSpeciesBird } from "./birdSprites";
import {
  clampTickDt,
  scrollHazards,
  scrollJunks,
  scrollPickups,
  scrollTentacles,
  scrollTrees,
  updateDebrisInPlace,
} from "./gameRuntime";
import {
  drawComboHud,
  drawJuicePopups,
  emptyJuiceFields,
  onLevelUp,
  onTreePassed,
  pruneJuice,
} from "./gameJuice";
import {
  drawBirdWake,
  drawBoostVignette,
  drawScreenFlash,
  drawSpeedStreaks,
  spawnGoldSparkBurst,
  type FxDrawCtx,
} from "./effects";

const GRAVITY = 0.19;
const FLAP_VELOCITY = -6.5;
const MAX_FALL_SPEED = 5.2;
const BASE_SPEED = 2.35;
const SPEED_BOOST_MULT = 2.85;
const SPEED_BOOST_MS = 4000;
const GHOST_MS = 2600;
const MAX_GHOST_MS = 10000;
const FRUIT_EAT_FX_MS = 520;
const NITRO_RAMP_MS = 2600;
const BOSS_BOOST_RAMP_MS = 5200;
const SEA_HEIGHT = 96;
const SEA_LEVEL = 5;
const SHARK_JUMP_HEIGHT = 108;
const TENTACLE_MAX_REACH = 98;
const TENTACLE_COUNT = 4;
const MIN_SIZE_NUTRITION = 98;
const JUNK_RECOVERY_NUTRITION_DROP = 32;
/** Во сколько раз медленнее растёт «питание» и худеет птичка (фрукты, размер, зазоры). */
const NUTRITION_THIN_SLOWDOWN = 3;
const NUTRITION_SCALE_PER_POINT = 0.0054 / NUTRITION_THIN_SLOWDOWN;
const GAP_NUTRITION_BONUS = 0.14 / NUTRITION_THIN_SLOWDOWN;
const SLOW_MO_FACTOR = 0.2;
const BOAR_EXPLOSION_MS = 9000;
const BOSS_ENERGY_ABSORB_MS = 3200;
const BOSS_ENERGY_BOOST_MS = 5000;
const BOSS_ENERGY_SPEED_MULT = 7;
/** Default cap; species may raise via getBirdModifiers().maxNitroStacks */
const MAX_NITRO_TOTAL_MS = 10000;
const SPEED_PICKUP_CHANCE = 0.13;
const FLOATING_SPEED_PICKUP_CHANCE = 0.11;
const JUNK_SMALL_SIZE = 44;
const BOSS_APPROACH_SLOW_MO_MS = 7000;
const BOSS_APPROACH_SLOW_MO_FACTOR = 0.022;
const BOSS_EXPLOSION_SLOW_MO_FACTOR = 0.035;
const LAND_HEIGHT = 56;
const SHORE_GRASS = 20;
const DAY_CYCLE_MS = 60000;
/** Без столкновений в первые секунды — время на реакцию после старта */
const START_INVULN_MS = 2800;
const METEOR_RADIUS = 9;
const PTERODACTYL_LEVEL = 7;

type TimeOfDay = {
  t: number;
  night: number;
  sunset: number;
  sunrise: number;
};

function timeOfDay(elapsed: number): TimeOfDay {
  const t = (elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS;
  if (t < 0.08) {
    const sunrise = 1 - t / 0.08;
    return { t, night: sunrise * 0.9, sunset: 0, sunrise };
  }
  if (t < 0.36) {
    return { t, night: 0, sunset: 0, sunrise: 0 };
  }
  if (t < 0.52) {
    const sunset = (t - 0.36) / 0.16;
    return { t, night: sunset * 0.88, sunset, sunrise: 0 };
  }
  return { t, night: 1, sunset: 0, sunrise: 0 };
}

/** 0 = полный день, 1 = полная ночь */
function nightFactor(elapsed: number): number {
  return timeOfDay(elapsed).night;
}

function horizonY(state: GameState): number {
  return treeGroundY(state) - 48;
}

function sunVisual(state: GameState): {
  visible: boolean;
  x: number;
  y: number;
  r: number;
  alpha: number;
  glow: number;
} {
  const tod = timeOfDay(state.elapsed);
  const hz = horizonY(state);
  const hidden = { visible: false, x: 0, y: 0, r: 0, alpha: 0, glow: 0 };

  if (tod.sunset > 0) {
    const p = tod.sunset;
    const x = state.width * (0.52 + p * 0.28);
    const y = hz - 18 + (1 - p) * (hz * 0.38);
    const alpha = p < 0.9 ? 1 : 1 - (p - 0.9) / 0.1;
    return { x, y, r: 24 - p * 4, alpha, glow: 1.1 - p * 0.35, visible: alpha > 0.03 };
  }

  if (tod.sunrise > 0) {
    const p = 1 - tod.sunrise;
    const x = state.width * (0.22 + p * 0.18);
    const y = hz + 8 - p * (hz * 0.42);
    return { x, y, r: 22, alpha: tod.sunrise * 0.95, glow: 0.55 + p * 0.45, visible: tod.sunrise > 0.06 };
  }

  if (tod.t >= 0.08 && tod.t < 0.36) {
    const p = (tod.t - 0.08) / 0.28;
    const x = state.width * (0.62 + Math.sin(p * Math.PI) * 0.06);
    const y = hz - 55 - Math.sin(p * Math.PI) * 35;
    return { x, y, r: 23, alpha: 0.68, glow: 0.52, visible: true };
  }

  return hidden;
}

function waterLineY(canvasH: number): number {
  return canvasH - SEA_HEIGHT;
}

function seaBlend(state: GameState): number {
  if (state.score < 9) return 0;
  if (state.score >= 15) return 1;
  const t = (state.score - 9) / 6;
  return t * t * (3 - 2 * t);
}

function worldSeaBlend(state: GameState): number {
  return effectiveSeaBlend(biomeForLevel(state.level), seaBlend(state), state.level);
}

function seaActive(state: GameState): boolean {
  return worldSeaBlend(state) >= 0.55;
}

function isGhostActive(state: GameState): boolean {
  return state.elapsed < state.ghostUntil;
}

function canPassObstacles(state: GameState): boolean {
  return isNitroActive(state) || isGhostActive(state) || isBossEnergyBoostActive(state);
}

function isSlowMoActive(state: GameState): boolean {
  return state.elapsed < state.slowMoUntil;
}

function isNitroActive(state: GameState): boolean {
  return state.elapsed < state.speedBoostUntil;
}

function nitroSpeedMult(state: GameState): number {
  if (!isNitroActive(state)) return 1;
  const stacks = Math.max(1, state.nitroStacks);
  return SPEED_BOOST_MULT * (1 + (stacks - 1) * 0.14);
}

function isBossEnergyAbsorbing(state: GameState): boolean {
  return state.elapsed < state.bossEnergyAbsorbUntil;
}

function isBossEnergyBoostActive(state: GameState): boolean {
  return state.elapsed >= state.bossEnergyAbsorbUntil && state.elapsed < state.bossEnergyBoostUntil;
}

function smoothRamp01(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function speedRampProgress(state: GameState, rampMs: number): number {
  const start =
    state.speedMultRampStart > 0
      ? state.speedMultRampStart
      : isBossEnergyBoostActive(state)
        ? state.bossEnergyAbsorbUntil
        : state.speedBoostUntil - SPEED_BOOST_MS;
  return smoothRamp01((state.elapsed - start) / rampMs);
}

function extendGhostUntil(state: GameState, extraMs: number): number {
  const cap = state.elapsed + MAX_GHOST_MS;
  const bonus = getBirdModifiers(state.birdSpeciesId).ghostExtraMs;
  return Math.min(Math.max(state.ghostUntil, state.elapsed + extraMs + bonus), cap);
}

function maxNitroStacks(state: GameState): number {
  return getBirdModifiers(state.birdSpeciesId).maxNitroStacks;
}

function worldSpeedMult(state: GameState): number {
  const speciesMult = getBirdModifiers(state.birdSpeciesId).speedMult;
  if (isBossEnergyBoostActive(state)) {
    const t = speedRampProgress(state, BOSS_BOOST_RAMP_MS);
    return (1 + (BOSS_ENERGY_SPEED_MULT - 1) * t) * speciesMult;
  }
  if (isNitroActive(state)) {
    const target = nitroSpeedMult(state);
    const t = speedRampProgress(state, NITRO_RAMP_MS);
    return (1 + (target - 1) * t) * speciesMult;
  }
  return speciesMult;
}

function applySpeedPickup(state: GameState): {
  speedBoostUntil: number;
  nitroStacks: number;
  speedMultRampStart: number;
} {
  const active = isNitroActive(state);
  const stacks = active ? Math.min(maxNitroStacks(state), state.nitroStacks + 1) : 1;
  let until = active ? state.speedBoostUntil + SPEED_BOOST_MS : state.elapsed + SPEED_BOOST_MS;
  const remaining = until - state.elapsed;
  until = state.elapsed + Math.min(remaining, MAX_NITRO_TOTAL_MS);
  return { speedBoostUntil: until, nitroStacks: stacks, speedMultRampStart: state.elapsed };
}

function slowMoFactor(state: GameState): number {
  if (!isSlowMoActive(state)) return 1;
  const birdSlow = getBirdModifiers(state.birdSpeciesId).slowMoFactorMult;
  if (state.bossExplosion) return BOSS_EXPLOSION_SLOW_MO_FACTOR * birdSlow;
  if (state.animalBoss?.defeatPendingAt) return BOSS_EXPLOSION_SLOW_MO_FACTOR * birdSlow;
  if (state.animalBoss && state.bossApproachSlowMoUsed) {
    return BOSS_APPROACH_SLOW_MO_FACTOR * birdSlow;
  }
  return SLOW_MO_FACTOR * birdSlow;
}

function maybeBossApproachSlowMo(state: GameState): GameState {
  const boss = state.animalBoss;
  if (!boss || state.bossApproachSlowMoUsed) return state;
  if (isCityLevel(levelFromScore(state.score))) return state;
  const bx = birdX(state);
  const dist = boss.x - bx;
  if (dist > state.width * 1.2) return state;

  if (isBossEnergyBoostActive(state) || isBossEnergyAbsorbing(state)) {
    return { ...state, bossApproachSlowMoUsed: true };
  }

  return {
    ...state,
    bossApproachSlowMoUsed: true,
    slowMoUntil: Math.max(state.slowMoUntil, state.elapsed + BOSS_APPROACH_SLOW_MO_MS),
  };
}

function meteorSpawnChance(elapsed: number): number {
  const nf = nightFactor(elapsed);
  return 0.000055 + nf * 0.00004;
}

/** Линия, на которой стоят деревья (суша / берег) */
function treeGroundY(state: GameState): number {
  const b = worldSeaBlend(state);
  const landGround = state.height - LAND_HEIGHT;
  const seaShore = waterLineY(state.height) - SHORE_GRASS;
  return landGround + (seaShore - landGround) * b;
}

/** Нижняя граница полёта — суша или вода (плавный переход) */
function floorY(state: GameState): number {
  const b = worldSeaBlend(state);
  const landFloor = state.height - LAND_HEIGHT;
  const seaFloor = waterLineY(state.height);
  return landFloor + (seaFloor - landFloor) * b;
}

const FRUITS: FruitType[] = ["apple", "peach", "grape"];

export function loadBestScore(): number {
  try {
    const v = localStorage.getItem(GAME_STORAGE_KEY);
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(GAME_STORAGE_KEY, String(score));
  } catch {
    /* ignore */
  }
}

export function birdScale(nutrition: number): number {
  return Math.max(0.82, 1.38 - nutrition * NUTRITION_SCALE_PER_POINT);
}

export function birdRadius(nutrition: number): number {
  return 23 * birdScale(nutrition);
}

function isAtMinBirdSize(nutrition: number): boolean {
  return nutrition >= MIN_SIZE_NUTRITION;
}

function isJunkRecoveryFood(type: JunkType): boolean {
  return type === "burger" || type === "pizza";
}

function canOfferJunkRecovery(state: GameState): boolean {
  return (
    state.phase === "playing" &&
    !state.junkSalvationUsed &&
    isAtMinBirdSize(state.bird.nutrition)
  );
}

export function levelFromScore(score: number): number {
  return Math.floor(score / 3) + 1;
}

function treeSpacing(level: number): number {
  return Math.max(132, 228 - level * 5);
}

function gapHeightFor(score: number, nutrition: number, level: number, speciesId: string): number {
  const base = 238 - score * 0.28 - (level - 1) * 3;
  const nutritionBonus = nutrition * GAP_NUTRITION_BONUS;
  const gapBonus = getBirdModifiers(speciesId).gapBonus;
  return Math.max(108, base + nutritionBonus + gapBonus);
}

function pickTreeType(score: number): TreeType {
  const level = levelFromScore(score);
  const roll = Math.random();
  if (level < SEA_LEVEL) return roll < 0.72 ? "spruce" : "pine";
  if (score < 8) return roll < 0.55 ? "spruce" : "pine";
  if (score < 20) return roll < 0.35 ? "oak" : roll < 0.7 ? "pine" : "spruce";
  if (roll < 0.35) return "oak";
  if (roll < 0.65) return "pine";
  return "spruce";
}

function pickJunkType(score: number): JunkType {
  const roll = Math.random();
  if (score < 10) {
    if (roll < 0.18) return "candy";
    if (roll < 0.36) return "bacon";
    if (roll < 0.52) return "burger";
    if (roll < 0.72) return "pizza";
    return "soda";
  }
  if (roll < 0.16) return "candy";
  if (roll < 0.32) return "bacon";
  if (roll < 0.46) return "burger";
  if (roll < 0.62) return "pizza";
  return "soda";
}

function junkSize(type: JunkType): number {
  if (type === "pizza") return 64;
  return JUNK_SMALL_SIZE;
}

function spawnSegment(state: GameState, x: number): { tree: TreeObstacle; junk: JunkObstacle } {
  const ground = treeGroundY(state);
  const minGap = gapHeightFor(
    state.score,
    state.bird.nutrition,
    levelFromScore(state.score),
    state.birdSpeciesId,
  );
  const skyTop = 32;
  const minTreeH = 38;
  const maxTreeH = Math.max(minTreeH, Math.max(48, ground - minGap - skyTop - 36));
  const treeHeight =
    maxTreeH <= minTreeH ? minTreeH : minTreeH + Math.random() * (maxTreeH - minTreeH);
  const treeTop = ground - treeHeight;

  const maxJunkBottom = treeTop - minGap;
  const minJunkBottom = skyTop + minGap * 0.35;
  const mid = (minJunkBottom + maxJunkBottom) / 2;
  const centerHalf = (maxJunkBottom - minJunkBottom) * 0.14;

  let junkBottom: number;
  if (Math.random() < 0.75 && maxJunkBottom - minJunkBottom > 30) {
    const low = minJunkBottom + Math.random() * Math.max(16, mid - centerHalf - minJunkBottom);
    const high = mid + centerHalf + Math.random() * Math.max(16, maxJunkBottom - mid - centerHalf);
    junkBottom = Math.random() < 0.5 ? low : high;
  } else {
    junkBottom = minJunkBottom + Math.random() * Math.max(20, maxJunkBottom - minJunkBottom);
  }
  junkBottom = Math.max(minJunkBottom, Math.min(maxJunkBottom, junkBottom));

  const treeType = pickTreeType(state.score);
  const tw = TREE_WIDTH[treeType];
  const junkType = pickJunkType(state.score);
  const size = junkSize(junkType);

  return {
    tree: { x, type: treeType, height: treeHeight, passed: false },
    junk: {
      x: x + tw / 2 - size / 2,
      type: junkType,
      bottomY: junkBottom,
      size,
      passed: false,
    },
  };
}

function spawnMountain(state: GameState, x: number): MountainHazard {
  const level = levelFromScore(state.score);
  const maxH = 68 + level * 1.5;
  return {
    kind: "mountain",
    x,
    width: 62 + Math.random() * 40 + level * 2,
    height: 28 + Math.random() * (maxH - 28),
  };
}

function spawnShark(x: number): SharkHazard {
  return {
    kind: "shark",
    x,
    phaseSeed: Math.random() * 100,
  };
}

function spawnOctopusTentacle(x: number): OctopusTentacle {
  return {
    x,
    phaseSeed: Math.random() * 100,
  };
}

function maybeSpawnPickup(
  state: GameState,
  tree: TreeObstacle,
  junk: JunkObstacle,
  level: number,
): Pickup | null {
  const chance = Math.min(0.82, 0.55 + level * 0.04);
  if (Math.random() > chance) return null;
  const ground = treeGroundY(state);
  const treeTop = ground - tree.height;
  const gapMid = (junk.bottomY + treeTop) / 2;
  const gapHalf = (treeTop - junk.bottomY) * 0.35;
  const y = gapMid + (Math.random() - 0.5) * gapHalf;
  const type: PickupType = Math.random() < SPEED_PICKUP_CHANCE ? "speed" : FRUITS[Math.floor(Math.random() * FRUITS.length)];
  return {
    x: tree.x + TREE_WIDTH[tree.type] * 0.5,
    y,
    type,
    collected: false,
  };
}

function spawnFloatingPickup(state: GameState, x: number, tree: TreeObstacle, junk: JunkObstacle): Pickup {
  const ground = treeGroundY(state);
  const treeTop = ground - tree.height;
  const gapMid = (junk.bottomY + treeTop) / 2;
  const y = gapMid + (Math.random() - 0.5) * (treeTop - junk.bottomY) * 0.3;
  const type: PickupType =
    Math.random() < FLOATING_SPEED_PICKUP_CHANCE ? "speed" : FRUITS[Math.floor(Math.random() * FRUITS.length)];
  return { x, y, type, collected: false };
}

function hazardChance(level: number, base: number): number {
  return Math.min(0.26, base + (level - 1) * 0.014);
}

/** Доп. препятствия между сегментами */
function spawnSegmentExtras(
  state: GameState,
  treeX: number,
  segmentIndex: number,
): {
  hazards: Hazard[];
  octopusTentacles: OctopusTentacle[];
  extraTrees: TreeObstacle[];
  extraJunks: JunkObstacle[];
  pickups: Pickup[];
} {
  const level = levelFromScore(state.score);
  const cityMode = isCityLevel(level);
  const hazards: Hazard[] = [];
  const octopusTentacles: OctopusTentacle[] = [];
  const extraTrees: TreeObstacle[] = [];
  const extraJunks: JunkObstacle[] = [];
  const pickups: Pickup[] = [];

  const offset = (n: number) => treeX + n + Math.random() * 40;

  if (!cityMode) {
    if (level >= 3 && segmentIndex % 4 === 0 && Math.random() < hazardChance(level, 0.09)) {
      hazards.push(spawnMountain(state, offset(15)));
    }
    if (level >= SEA_LEVEL && segmentIndex % 5 !== 0 && Math.random() < hazardChance(level, 0.028)) {
      hazards.push(spawnShark(offset(25)));
    }
    if (level >= SEA_LEVEL && segmentIndex % 4 === 2 && Math.random() < hazardChance(level, 0.048)) {
      octopusTentacles.push(spawnOctopusTentacle(offset(55)));
    }
  }

  if (level >= 4 && Math.random() < 0.06) {
    extraTrees.push(spawnSegment(state, offset(55)).tree);
  }
  if (!cityMode && level >= SEA_LEVEL && Math.random() < 0.08) {
    extraJunks.push(spawnSegment(state, offset(30)).junk);
  }

  if (level >= 2 && segmentIndex % 4 === 1 && Math.random() < 0.5) {
    const seg = spawnSegment(state, treeX);
    pickups.push(spawnFloatingPickup(state, offset(60), seg.tree, seg.junk));
  }

  return { hazards, octopusTentacles, extraTrees, extraJunks, pickups };
}

function seedInitialSegments(width: number, height: number): {
  trees: TreeObstacle[];
  junks: JunkObstacle[];
  nextX: number;
  segmentIndex: number;
} {
  const stub: GameState = {
    width,
    height,
    phase: "idle",
    birdSpeciesId: "classic",
    bird: { y: height * 0.45, vy: 0, nutrition: 0 },
    trees: [],
    junks: [],
    hazards: [],
    octopusTentacles: [],
    pickups: [],
    debris: [],
    meteor: null,
    pterodactyl: null,
    craters: [],
    score: 0,
    level: 1,
    fruitsCollected: 0,
    speed: BASE_SPEED,
    speedBoostUntil: 0,
    nitroStacks: 0,
    ghostUntil: 0,
    elapsed: 0,
    nextTreeX: 0,
    segmentIndex: 0,
    flapAnim: 0,
    junkSalvationUsed: false,
    animalBoss: null,
    lastBossMilestone: 0,
    bossExplosion: null,
    slowMoUntil: 0,
    bossApproachSlowMoUsed: false,
    bossEnergyAbsorbUntil: 0,
    bossEnergyBoostUntil: 0,
    cityLandmarkX: null,
    cityLandmarkDone: false,
    worldScroll: 0,
    speedMultRampStart: 0,
    fruitEatFx: null,
    screenShakeUntil: 0,
    screenShakeMag: 0,
    screenFlashUntil: 0,
    screenFlashAlpha: 0,
    screenFlashColor: "#FFFFFF",
    ...emptyJuiceFields(),
  };
  const trees: TreeObstacle[] = [];
  const junks: JunkObstacle[] = [];
  let x = width + 120;
  const spacing = treeSpacing(1);
  let seg = 0;
  while (x < width + spacing * 2.4) {
    const segment = spawnSegment(stub, x);
    trees.push(segment.tree);
    junks.push(segment.junk);
    x += spacing * (0.92 + Math.random() * 0.16);
    seg++;
  }
  return { trees, junks, nextX: x, segmentIndex: seg };
}

export function createGame(
  width: number,
  height: number,
  birdSpeciesId = "classic",
): GameState {
  const { trees, junks, nextX, segmentIndex } = seedInitialSegments(width, height);
  return {
    width,
    height,
    phase: "idle",
    birdSpeciesId,
    bird: { y: height * 0.45, vy: 0, nutrition: 0 },
    trees,
    junks,
    hazards: [],
    octopusTentacles: [],
    pickups: [],
    debris: [],
    meteor: null,
    pterodactyl: null,
    craters: [],
    score: 0,
    level: 1,
    fruitsCollected: 0,
    speed: BASE_SPEED,
    speedBoostUntil: 0,
    nitroStacks: 0,
    ghostUntil: 0,
    elapsed: 0,
    nextTreeX: nextX,
    segmentIndex,
    flapAnim: 0,
    junkSalvationUsed: false,
    animalBoss: null,
    lastBossMilestone: 0,
    bossExplosion: null,
    slowMoUntil: 0,
    bossApproachSlowMoUsed: false,
    bossEnergyAbsorbUntil: 0,
    bossEnergyBoostUntil: 0,
    cityLandmarkX: null,
    cityLandmarkDone: false,
    worldScroll: 0,
    speedMultRampStart: 0,
    fruitEatFx: null,
    screenShakeUntil: 0,
    screenShakeMag: 0,
    screenFlashUntil: 0,
    screenFlashAlpha: 0,
    screenFlashColor: "#FFFFFF",
    ...emptyJuiceFields(),
  };
}

export function startGame(state: GameState): GameState {
  const fresh = createGame(state.width, state.height, state.birdSpeciesId);
  return {
    ...fresh,
    phase: "playing",
    bird: { ...fresh.bird, vy: FLAP_VELOCITY },
    flapAnim: 1,
    ...emptyJuiceFields(),
  };
}

export function flap(state: GameState): GameState {
  if (state.phase === "idle") return startGame(state);
  if (state.phase === "gameover") return startGame(state);
  return {
    ...state,
    bird: { ...state.bird, vy: FLAP_VELOCITY },
    flapAnim: 1,
  };
}

function birdX(state: GameState): number {
  return state.width * 0.26;
}

function circleRectHit(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number): boolean {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

function circleCircleHit(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy < (r1 + r2) ** 2;
}

function pointInTriangle(px: number, py: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): boolean {
  const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
  const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function collideTree(state: GameState, tree: TreeObstacle): boolean {
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition) * 0.88;
  const tw = TREE_WIDTH[tree.type];
  const ground = treeGroundY(state);
  const y = ground - tree.height;
  return circleRectHit(bx, by, r, tree.x, y, tw, tree.height);
}

function collideJunk(state: GameState, junk: JunkObstacle): boolean {
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition) * 0.85;
  return circleRectHit(bx, by, r, junk.x, 0, junk.size, junk.bottomY);
}

function collideMountain(state: GameState, m: MountainHazard): boolean {
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition) * 0.82;
  const baseY = floorY(state);
  const x1 = m.x;
  const y1 = baseY;
  const x2 = m.x + m.width;
  const y2 = baseY;
  const x3 = m.x + m.width / 2;
  const y3 = baseY - m.height;

  for (let i = 0; i <= 4; i++) {
    for (let j = 0; j <= 4; j++) {
      const px = bx - r + (2 * r * i) / 4;
      const py = by - r + (2 * r * j) / 4;
      if (pointInTriangle(px, py, x1, y1, x2, y2, x3, y3)) return true;
    }
  }
  return false;
}

function sharkPose(shark: SharkHazard, state: GameState) {
  const baseY = waterLineY(state.height);
  const t = ((state.elapsed * 0.001 + shark.phaseSeed) % 2.8) / 1.2;
  const jump = t <= 1 ? Math.sin(t * Math.PI) : 0;
  const bodyCx = shark.x + 38;
  const bodyCy = baseY - jump * SHARK_JUMP_HEIGHT - 8;
  return {
    x: shark.x,
    baseY,
    jump,
    bodyCx,
    bodyCy,
    bodyRx: 30,
    bodyRy: 10 + jump * 10,
    mouthOpen: jump > 0.32,
    mouthX: shark.x + 52,
    mouthY: bodyCy + 5,
    headX: shark.x + 48,
    headY: bodyCy,
  };
}

function collideShark(state: GameState, shark: SharkHazard): boolean {
  if (!seaActive(state)) return false;
  const p = sharkPose(shark, state);
  if (p.jump < 0.12) return false;
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition) * 0.8;
  if (p.mouthOpen && circleCircleHit(bx, by, r, p.mouthX, p.mouthY, 16)) return true;
  return circleRectHit(bx, by, r, p.bodyCx - p.bodyRx, p.bodyCy - p.bodyRy, p.bodyRx * 2, p.bodyRy * 2);
}

function tentaclePose(tentacle: OctopusTentacle, state: GameState) {
  const baseY = waterLineY(state.height);
  const cycle = 4.4;
  const raw = ((state.elapsed * 0.001 + tentacle.phaseSeed) % cycle) / cycle;
  let rise = 0;
  if (raw >= 0.08 && raw <= 0.84) {
    const u = (raw - 0.08) / 0.76;
    rise = Math.sin(u * Math.PI);
  }
  const baseX = tentacle.x + 24;
  const tips: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < TENTACLE_COUNT; i++) {
    const spread = (i - (TENTACLE_COUNT - 1) / 2) * 15;
    const wiggle = Math.sin(state.elapsed * 0.005 + tentacle.phaseSeed + i * 1.3) * 10;
    const reach = rise * (TENTACLE_MAX_REACH + i * 8);
    tips.push({
      x: baseX + spread + wiggle,
      y: baseY - reach,
      r: 6 + rise * 5,
    });
  }
  return { baseY, rise, baseX, tips };
}

function collideOctopusTentacle(state: GameState, tentacle: OctopusTentacle): boolean {
  if (!seaActive(state)) return false;
  const p = tentaclePose(tentacle, state);
  if (p.rise < 0.16) return false;
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition) * 0.78;
  for (const tip of p.tips) {
    if (circleCircleHit(bx, by, r, tip.x, tip.y, tip.r)) return true;
  }
  if (p.rise > 0.35 && circleCircleHit(bx, by, r, p.baseX, p.baseY - 6, 14 + p.rise * 8)) return true;
  return false;
}

const MAX_DEBRIS = 90;
const MAX_TREES = 56;
const MAX_HAZARDS = 22;
const MAX_PICKUPS = 28;

function pushDebris(debris: DebrisParticle[], particle: DebrisParticle): void {
  debris.push(particle);
  if (debris.length > MAX_DEBRIS) debris.splice(0, debris.length - MAX_DEBRIS);
}

function spawnImpactSparks(debris: DebrisParticle[], x: number, y: number): void {
  spawnGoldSparkBurst(debris, x, y, 2, pushDebris);
  for (let i = 0; i < 3; i++) {
    const angle = Math.PI + (Math.random() - 0.5) * 1.4;
    const speed = 3 + Math.random() * 5;
    pushDebris(debris, {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.35 + Math.random() * 0.25,
      size: 3 + Math.random() * 5,
      color: i % 2 === 0 ? "#FF9800" : "#FFEB3B",
      kind: "spark",
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.4,
    });
  }
}

function spawnTreeDebris(state: GameState, tree: TreeObstacle, debris: DebrisParticle[]): void {
  const ground = treeGroundY(state);
  const tw = TREE_WIDTH[tree.type];
  const cx = tree.x + tw / 2;
  const cy = ground - tree.height * 0.55;
  const bx = birdX(state);
  const by = state.bird.y;
  spawnImpactSparks(debris, bx, by);
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.random() - 0.5) * Math.PI;
    const speed = 2 + Math.random() * 5;
    pushDebris(debris, {
      x: cx + (Math.random() - 0.5) * tw,
      y: cy + (Math.random() - 0.5) * tree.height * 0.4,
      vx: Math.cos(angle) * speed - 3,
      vy: Math.sin(angle) * speed - 1,
      life: 1,
      maxLife: 0.5 + Math.random() * 0.45,
      size: 4 + Math.random() * 7,
      color: i % 3 === 0 ? "#6B4423" : i % 3 === 1 ? "#43A047" : "#2E7D32",
      kind: i % 2 === 0 ? "wood" : "leaf",
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.25,
    });
  }
  for (let i = 0; i < 2; i += 1) {
    pushDebris(debris, {
      x: cx,
      y: cy,
      vx: (Math.random() - 0.5) * 2,
      vy: -1.5 - Math.random() * 2,
      life: 1,
      maxLife: 0.7 + Math.random() * 0.5,
      size: 3 + Math.random() * 4,
      color: "#66BB6A",
      kind: "leaf",
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
    });
  }
}

function spawnJunkRecoveryDebris(junk: JunkObstacle, state: GameState, debris: DebrisParticle[]): void {
  const bx = birdX(state);
  const by = state.bird.y;
  spawnImpactSparks(debris, bx, by);
  const cx = junk.x + junk.size / 2;
  const cy = junk.bottomY - junk.size * 0.45;
  const colors = ["#FFB74D", "#FF7043", "#66BB6A", "#FFF176"];
  for (let i = 0; i < 5; i++) {
    const angle = (Math.random() - 0.5) * Math.PI * 1.4;
    const speed = 2 + Math.random() * 5;
    pushDebris(debris, {
      x: cx + (Math.random() - 0.5) * junk.size,
      y: cy + (Math.random() - 0.5) * junk.size * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      maxLife: 0.5 + Math.random() * 0.45,
      size: 4 + Math.random() * 6,
      color: colors[i % colors.length],
      kind: "crumb",
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
    });
  }
}

function processJunkRecovery(state: GameState): GameState {
  if (!canOfferJunkRecovery(state)) return state;
  if (state.elapsed < START_INVULN_MS || canPassObstacles(state)) return state;

  for (const junk of state.junks) {
    if (!isJunkRecoveryFood(junk.type) || !collideJunk(state, junk)) continue;

    const debris = [...state.debris];
    spawnJunkRecoveryDebris(junk, state, debris);
    const nutrition = Math.max(0, state.bird.nutrition - JUNK_RECOVERY_NUTRITION_DROP);

    return {
      ...state,
      junks: state.junks.filter((j) => j !== junk),
      debris,
      junkSalvationUsed: true,
      bird: { ...state.bird, nutrition },
      flapAnim: Math.min(1, state.flapAnim + 0.65),
    };
  }

  return state;
}

function spawnJunkDebris(junk: JunkObstacle, debris: DebrisParticle[], bx: number, by: number): void {
  spawnImpactSparks(debris, bx, by);
  const cx = junk.x + junk.size / 2;
  const cy = junk.bottomY - junk.size * 0.45;
  const colors =
    junk.type === "candy"
      ? ["#E91E63", "#FFD54F", "#F48FB1"]
      : junk.type === "bacon"
        ? ["#FFAB91", "#FF7043", "#FFCCBC", "#D84315"]
        : junk.type === "burger"
          ? ["#F4A460", "#D84315", "#66BB6A", "#FFEB3B"]
          : junk.type === "soda"
            ? ["#E53935", "#FFFFFF", "#81D4FA", "#795548"]
            : ["#FF9800", "#E53935", "#FFE0B2"];
  for (let i = 0; i < 5; i++) {
    const angle = (Math.random() - 0.5) * Math.PI * 1.2;
    const speed = 2 + Math.random() * 6;
    pushDebris(debris, {
      x: cx + (Math.random() - 0.5) * junk.size,
      y: cy + (Math.random() - 0.5) * junk.size * 0.5,
      vx: Math.cos(angle) * speed - 2,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.45 + Math.random() * 0.4,
      size: 3 + Math.random() * 6,
      color: colors[i % colors.length],
      kind: "crumb",
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.35,
    });
  }
}

function spawnMountainDebris(m: MountainHazard, state: GameState, debris: DebrisParticle[], bx: number, by: number): void {
  spawnImpactSparks(debris, bx, by);
  const baseY = floorY(state);
  const cx = m.x + m.width / 2;
  const cy = baseY - m.height * 0.45;
  for (let i = 0; i < 4; i++) {
    pushDebris(debris, {
      x: cx + (Math.random() - 0.5) * m.width,
      y: cy + (Math.random() - 0.5) * m.height * 0.5,
      vx: -2 - Math.random() * 4,
      vy: -1 - Math.random() * 4,
      life: 1,
      maxLife: 0.55 + Math.random() * 0.5,
      size: 4 + Math.random() * 8,
      color: i % 2 === 0 ? "#78909C" : "#B0BEC5",
      kind: "rock",
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
    });
  }
}

function spawnSharkDebris(shark: SharkHazard, state: GameState, debris: DebrisParticle[], bx: number, by: number): void {
  const p = sharkPose(shark, state);
  spawnImpactSparks(debris, bx, by);
  for (let i = 0; i < 3; i++) {
    pushDebris(debris, {
      x: p.bodyCx + (Math.random() - 0.5) * 24,
      y: p.baseY + 2,
      vx: -1 - Math.random() * 2,
      vy: -1 - Math.random() * 3,
      life: 1,
      maxLife: 0.35 + Math.random() * 0.3,
      size: 3 + Math.random() * 5,
      color: i % 2 === 0 ? "#4FC3F7" : "#ECEFF1",
      kind: "splash",
      rotation: 0,
      spin: 0,
    });
  }
}

function spawnTentacleDebris(tentacle: OctopusTentacle, state: GameState, debris: DebrisParticle[], bx: number, by: number): void {
  const p = tentaclePose(tentacle, state);
  spawnImpactSparks(debris, bx, by);
  for (let i = 0; i < 4; i++) {
    pushDebris(debris, {
      x: p.baseX + (Math.random() - 0.5) * 28,
      y: p.baseY + 2,
      vx: -1 - Math.random() * 2,
      vy: -1 - Math.random() * 3,
      life: 1,
      maxLife: 0.35 + Math.random() * 0.3,
      size: 3 + Math.random() * 5,
      color: i % 2 === 0 ? "#7B1FA2" : "#4FC3F7",
      kind: "splash",
      rotation: 0,
      spin: 0,
    });
  }
}

function collideMeteor(state: GameState, meteor: Meteor): boolean {
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition) * 0.85;
  return circleCircleHit(bx, by, r, meteor.x, meteor.y, METEOR_RADIUS + 2);
}

function collideCrater(state: GameState, crater: Crater): boolean {
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition) * 0.82;
  const moundH = crater.radius * 0.45;
  return circleRectHit(bx, by, r, crater.x - crater.radius, crater.y - moundH, crater.radius * 2, moundH);
}

function maybeSpawnMeteor(state: GameState): Meteor | null {
  if (state.meteor) return null;
  if (Math.random() > meteorSpawnChance(state.elapsed)) return null;
  return {
    x: state.width + 30 + Math.random() * 40,
    y: 18 + Math.random() * 70,
    vx: -5.5 - Math.random() * 2,
    vy: 3.5 + Math.random() * 1.5,
  };
}

function updateMeteor(state: GameState, dt: number, move: number): GameState {
  let { meteor, craters, debris } = state;
  if (!meteor) {
    const spawned = maybeSpawnMeteor(state);
    if (spawned) meteor = spawned;
  }
  if (!meteor) return state;

  meteor = {
    ...meteor,
    x: meteor.x - move + meteor.vx * dt,
    y: meteor.y + meteor.vy * dt,
    vy: meteor.vy + 0.08 * dt,
  };

  const ground = floorY(state);
  if (meteor.y >= ground - 4 || meteor.x < -20) {
    if (meteor.y >= ground - 8 && meteor.x > 0 && meteor.x < state.width) {
      const crater: Crater = { x: meteor.x, y: ground, radius: 16 + Math.random() * 7 };
      craters = [...craters, crater];
      spawnImpactSparks(debris, meteor.x, ground - 2);
      for (let i = 0; i < 3; i++) {
        pushDebris(debris, {
          x: meteor.x + (Math.random() - 0.5) * 20,
          y: ground - 4,
          vx: (Math.random() - 0.5) * 4,
          vy: -2 - Math.random() * 3,
          life: 1,
          maxLife: 0.4 + Math.random() * 0.35,
          size: 3 + Math.random() * 5,
          color: i % 2 === 0 ? "#8D6E63" : "#FF7043",
          kind: "rock",
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.2,
        });
      }
    }
    meteor = null;
  }

  craters = craters
    .map((c) => ({ ...c, x: c.x - move }))
    .filter((c) => c.x + c.radius > -20);

  return { ...state, meteor, craters, debris };
}

function maybeSpawnPterodactyl(state: GameState): Pterodactyl | null {
  if (state.level < PTERODACTYL_LEVEL) return null;
  if (state.pterodactyl) return null;
  const chance = 0.00005 + (state.level - PTERODACTYL_LEVEL) * 0.000014;
  if (Math.random() > chance) return null;
  return {
    x: state.width + 80 + Math.random() * 50,
    y: 32 + Math.random() * 42,
    wingPhase: Math.random() * Math.PI * 2,
  };
}

function updatePterodactyl(state: GameState, dt: number, move: number): GameState {
  if (state.level < PTERODACTYL_LEVEL) {
    return state.pterodactyl ? { ...state, pterodactyl: null } : state;
  }

  let pterodactyl = state.pterodactyl;
  if (!pterodactyl) {
    const spawned = maybeSpawnPterodactyl(state);
    return spawned ? { ...state, pterodactyl: spawned } : state;
  }

  pterodactyl = {
    ...pterodactyl,
    x: pterodactyl.x - move * 1.5,
    y: pterodactyl.y + Math.sin(state.elapsed * 0.0026 + pterodactyl.wingPhase) * 0.05 * dt,
    wingPhase: pterodactyl.wingPhase + dt * 0.13,
  };

  if (pterodactyl.x < -100) pterodactyl = null;
  return { ...state, pterodactyl };
}

function spawnFruitEatParticles(
  state: GameState,
  fruit: FruitType,
  debris: DebrisParticle[],
): void {
  const bx = birdX(state);
  const by = state.bird.y;
  const colors: Record<FruitType, string[]> = {
    apple: ["#E53935", "#FF7043", "#FFEB3B", "#C62828"],
    peach: ["#FFAB91", "#FFCC80", "#FFE0B2", "#FF8A65"],
    grape: ["#7E57C2", "#9575CD", "#B39DDB", "#5E35B1"],
  };
  const palette = colors[fruit];
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 1.8 + Math.random() * 3.2;
    pushDebris(debris, {
      x: bx + (Math.random() - 0.5) * 10,
      y: by + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed + 0.6,
      vy: Math.sin(angle) * speed - 1.2,
      life: 1,
      maxLife: 0.55 + Math.random() * 0.45,
      size: 4 + Math.random() * 5,
      color: palette[i % palette.length],
      kind: i % 3 === 0 ? "spark" : "crumb",
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.4,
    });
  }
}

function collectPickup(state: GameState, pickup: Pickup): GameState {
  if (pickup.collected) return state;
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition);
  const dx = bx - pickup.x;
  const dy = by - pickup.y;
  if (dx * dx + dy * dy > (r + 14) ** 2) return state;

  const pickups = state.pickups.map((p) => (p === pickup ? { ...p, collected: true } : p));
  if (pickup.type === "speed") {
    const nitro = applySpeedPickup(state);
    return {
      ...state,
      pickups,
      ...nitro,
    };
  }
  const gain =
    (NUTRITION_GAIN[pickup.type] / NUTRITION_THIN_SLOWDOWN) *
    getBirdModifiers(state.birdSpeciesId).fruitNutritionMult;
  const debris = [...state.debris];
  spawnFruitEatParticles(state, pickup.type, debris);
  spawnGoldSparkBurst(debris, bx, by, 3, pushDebris);
  return {
    ...state,
    pickups,
    debris,
    fruitsCollected: state.fruitsCollected + 1,
    ghostUntil: extendGhostUntil(state, GHOST_MS),
    fruitEatFx: { fruit: pickup.type, until: state.elapsed + FRUIT_EAT_FX_MS },
    flapAnim: 1,
    bird: { ...state.bird, nutrition: Math.min(100, state.bird.nutrition + gain), vy: state.bird.vy - 0.35 },
  };
}

function smashObstacles(state: GameState): GameState {
  if (!isNitroActive(state)) return state;

  let score = state.score;
  const debris = [...state.debris];
  const bx = birdX(state);
  const by = state.bird.y;

  const trees = state.trees.filter((tree) => {
    if (!collideTree(state, tree)) return true;
    if (!tree.passed) score += 1;
    spawnTreeDebris(state, tree, debris);
    return false;
  });

  const junks = state.junks.filter((junk) => {
    if (!collideJunk(state, junk)) return true;
    spawnJunkDebris(junk, debris, bx, by);
    return false;
  });

  const hazards = state.hazards.filter((h) => {
    if (h.kind === "mountain" && collideMountain(state, h)) {
      spawnMountainDebris(h, state, debris, bx, by);
      return false;
    }
    if (h.kind === "shark" && collideShark(state, h)) {
      spawnSharkDebris(h, state, debris, bx, by);
      return false;
    }
    return true;
  });

  const octopusTentacles = state.octopusTentacles.filter((t) => {
    if (!collideOctopusTentacle(state, t)) return true;
    spawnTentacleDebris(t, state, debris, bx, by);
    return false;
  });

  let meteor = state.meteor;
  if (meteor && collideMeteor(state, meteor)) {
    spawnImpactSparks(debris, meteor.x, meteor.y);
    meteor = null;
  }

  return {
    ...state,
    trees,
    junks,
    hazards,
    octopusTentacles,
    debris,
    meteor,
    score,
    level: levelFromScore(score),
  };
}

function spawnAnimalBoss(state: GameState, kind: BossKind): AnimalBoss {
  const bx = birdX(state);
  const ground = floorY(state);
  const height = Math.floor(ground * 0.78);
  const width = Math.floor(height * 0.92);
  return {
    kind,
    x: bx + state.width * 0.72,
    width,
    height,
    bitePhase: 0,
    biteCooldown: 0,
    defeatPendingAt: null,
  };
}

function updateAnimalBossBite(state: GameState, boss: AnimalBoss, dtMs: number): AnimalBoss {
  if (boss.defeatPendingAt) return boss;
  const { inRange } = computeBossBiteIntent(birdX(state), state.bird.y, boss, floorY(state));
  let { bitePhase, biteCooldown } = boss;
  biteCooldown = Math.max(0, biteCooldown - dtMs);

  if (bitePhase > 0) {
    bitePhase += dtMs / 820;
    if (bitePhase >= 1) {
      bitePhase = 0;
      biteCooldown = 850 + Math.random() * 450;
    }
  } else if (inRange && biteCooldown <= 0) {
    bitePhase = dtMs / 820;
  }

  return { ...boss, bitePhase, biteCooldown };
}

function collideBossMouth(state: GameState, boss: AnimalBoss): boolean {
  if (boss.bitePhase < 0.38 || boss.bitePhase > 0.88) return false;
  const ground = floorY(state);
  const head = bossHeadAnchor(boss, ground);
  const spec = bossSpec(boss.kind);
  const { angle, lunge } = computeBossBiteIntent(birdX(state), state.bird.y, boss, ground);
  const bx = birdX(state);
  const by = state.bird.y;
  const br = birdRadius(state.bird.nutrition) * 0.85;
  const mouthX = head.x + Math.cos(angle) * (lunge + boss.width * spec.mouthForward);
  const mouthY = head.y + Math.sin(angle) * (lunge * 0.65 + boss.height * 0.06);
  const mouthR = boss.width * 0.15;
  const dx = bx - mouthX;
  const dy = by - mouthY;
  return dx * dx + dy * dy < (mouthR + br) ** 2;
}

function spawnBossLeadNitroPickups(state: GameState, boss: AnimalBoss): Pickup[] {
  const yTop = 56;
  const yBot = state.height * 0.52;
  return [
    {
      x: boss.x - boss.width * 0.22,
      y: yTop + (yBot - yTop) * 0.38,
      type: "speed",
      collected: false,
    },
    {
      x: boss.x - boss.width * 0.58,
      y: yTop + (yBot - yTop) * 0.68,
      type: "speed",
      collected: false,
    },
  ];
}

function animalBossRect(state: GameState, boss: AnimalBoss): { x: number; y: number; w: number; h: number } {
  const ground = floorY(state);
  return {
    x: boss.x + boss.width * 0.05,
    y: ground - boss.height + 4,
    w: boss.width * 0.9,
    h: boss.height * 0.96,
  };
}

function collideAnimalBoss(state: GameState, boss: AnimalBoss): boolean {
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition) * 0.85;
  const rect = animalBossRect(state, boss);
  return circleRectHit(bx, by, r, rect.x, rect.y, rect.w, rect.h);
}

function canDefeatAnimalBoss(state: GameState): boolean {
  return (
    isAtMinBirdSize(state.bird.nutrition) &&
    (isNitroActive(state) || isBossEnergyBoostActive(state))
  );
}

function buildBoarExplosionParts(): BoarExplosionPart[] {
  return [
    { localX: -0.1, localY: 0.08, rw: 0.34, rh: 0.26, flyAngle: Math.PI * 1.05, spin: 0.35, color: "#6D4C41", shape: "ellipse" },
    { localX: 0.06, localY: -0.04, rw: 0.28, rh: 0.22, flyAngle: Math.PI * 0.85, spin: -0.28, color: "#5D4037", shape: "ellipse" },
    { localX: 0.24, localY: -0.14, rw: 0.19, rh: 0.13, flyAngle: Math.PI * 0.2, spin: -0.55, color: "#795548", shape: "ellipse" },
    { localX: 0.3, localY: -0.1, rw: 0.11, rh: 0.075, flyAngle: Math.PI * 0.08, spin: 0.2, color: "#6D4C41", shape: "ellipse" },
    { localX: 0.32, localY: -0.06, rw: 0.07, rh: 0.16, flyAngle: -0.4, spin: 0.65, color: "#FFEB3B", shape: "corn" },
    { localX: 0.28, localY: -0.02, rw: 0.05, rh: 0.08, flyAngle: 0.15, spin: 0.4, color: "#558B2F", shape: "rect" },
    { localX: -0.22, localY: 0.14, rw: 0.1, rh: 0.06, flyAngle: Math.PI * 1.25, spin: 0.5, color: "#5D4037", shape: "ellipse" },
    { localX: -0.08, localY: 0.16, rw: 0.09, rh: 0.055, flyAngle: Math.PI * 1.15, spin: -0.35, color: "#5D4037", shape: "ellipse" },
    { localX: 0.08, localY: 0.15, rw: 0.08, rh: 0.05, flyAngle: Math.PI * 0.95, spin: 0.42, color: "#4E342E", shape: "ellipse" },
    { localX: -0.18, localY: -0.1, rw: 0.04, rh: 0.08, flyAngle: Math.PI * 1.35, spin: 0.8, color: "#BCAAA4", shape: "triangle" },
    { localX: -0.12, localY: -0.14, rw: 0.035, rh: 0.07, flyAngle: Math.PI * 1.28, spin: 0.6, color: "#BCAAA4", shape: "triangle" },
    { localX: -0.04, localY: -0.16, rw: 0.04, rh: 0.075, flyAngle: Math.PI * 1.18, spin: -0.7, color: "#BCAAA4", shape: "triangle" },
    { localX: 0.04, localY: -0.15, rw: 0.038, rh: 0.072, flyAngle: Math.PI * 1.08, spin: 0.55, color: "#A1887F", shape: "triangle" },
    { localX: 0.14, localY: 0.02, rw: 0.08, rh: 0.05, flyAngle: Math.PI * 0.55, spin: -0.45, color: "#FFFDE7", shape: "rect" },
    { localX: 0.18, localY: 0.06, rw: 0.07, rh: 0.045, flyAngle: Math.PI * 0.42, spin: 0.38, color: "#FFCCBC", shape: "rect" },
    { localX: -0.14, localY: 0.02, rw: 0.12, rh: 0.04, flyAngle: Math.PI * 1.42, spin: -0.6, color: "#8D6E63", shape: "rect" },
    { localX: 0.12, localY: 0.1, rw: 0.06, rh: 0.035, flyAngle: Math.PI * 0.75, spin: 0.9, color: "#3E2723", shape: "triangle" },
    { localX: -0.02, localY: 0.12, rw: 0.14, rh: 0.035, flyAngle: Math.PI, spin: -0.25, color: "#4E342E", shape: "rect" },
  ];
}

function spawnBossExplosionDebris(boss: AnimalBoss, state: GameState, debris: DebrisParticle[]): void {
  const ground = floorY(state);
  const cx = boss.x + boss.width / 2;
  const cy = ground - boss.height * 0.45;
  const bx = birdX(state);
  const by = state.bird.y;
  spawnImpactSparks(debris, bx, by);
  for (let i = 0; i < 4; i++) {
    spawnImpactSparks(debris, cx + (Math.random() - 0.5) * boss.width * 0.6, cy + (Math.random() - 0.5) * boss.height * 0.4);
  }
  const colors = ["#5D4037", "#8D6E63", "#FF7043", "#FFEB3B", "#558B2F", "#FFF176", "#3E2723", "#FFE0B2"];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 8;
    pushDebris(debris, {
      x: cx + (Math.random() - 0.5) * boss.width * 0.9,
      y: cy + (Math.random() - 0.5) * boss.height * 0.7,
      vx: Math.cos(angle) * speed - 1.5,
      vy: Math.sin(angle) * speed - 2.5,
      life: 1,
      maxLife: 1.4 + Math.random() * 1.6,
      size: 6 + Math.random() * 14,
      color: colors[i % colors.length],
      kind: i % 4 === 0 ? "rock" : i % 4 === 1 ? "spark" : "crumb",
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.35,
    });
  }
}

function tryDefeatAnimalBoss(state: GameState): GameState {
  const boss = state.animalBoss;
  if (!boss) return state;

  if (boss.defeatPendingAt) {
    if (state.elapsed < boss.defeatPendingAt) return state;

    const ground = floorY(state);
    const cx = boss.x + boss.width / 2;
    const cy = ground - boss.height * 0.45;
    const debris = [...state.debris];
    spawnBossExplosionDebris(boss, state, debris);
    const score = state.score + 10;
    const absorbUntil = state.elapsed + BOSS_ENERGY_ABSORB_MS;
    return {
      ...state,
      animalBoss: null,
      bossExplosion: {
        cx,
        cy,
        width: boss.width,
        height: boss.height,
        startElapsed: state.elapsed,
        parts: buildBoarExplosionParts(),
        kind: boss.kind,
      },
      slowMoUntil: Math.max(state.slowMoUntil, state.elapsed + BOAR_EXPLOSION_MS * 0.92),
      bossEnergyAbsorbUntil: absorbUntil,
      bossEnergyBoostUntil:
        absorbUntil + BOSS_ENERGY_BOOST_MS + getBirdModifiers(state.birdSpeciesId).bossBoostExtraMs,
      speedMultRampStart: absorbUntil,
      debris,
      score,
      level: levelFromScore(score),
    };
  }

  if (!collideAnimalBoss(state, boss) || !canDefeatAnimalBoss(state)) return state;

  const explodeAt = state.elapsed + BOAR_DEFEAT_VIEW_MS;
  return {
    ...state,
    animalBoss: { ...boss, defeatPendingAt: explodeAt, bitePhase: 0, biteCooldown: 999999 },
    slowMoUntil: Math.max(state.slowMoUntil, explodeAt + BOAR_EXPLOSION_MS * 0.92),
  };
}

function burnEmberJunks(state: GameState): GameState {
  if (!getBirdModifiers(state.birdSpeciesId).junkBurn) return state;
  if (state.elapsed < START_INVULN_MS || canPassObstacles(state)) return state;

  const burning = state.junks.filter(
    (j) => !isJunkRecoveryFood(j.type) && collideJunk(state, j),
  );
  if (burning.length === 0) return state;

  const burnSet = new Set(burning);
  const debris = [...state.debris];
  const bx = birdX(state);
  const by = state.bird.y;
  const pushDebris = (d: DebrisParticle[], p: DebrisParticle) => {
    d.push(p);
  };
  for (const junk of burning) {
    spawnGoldSparkBurst(
      debris,
      junk.x + junk.size * 0.5,
      junk.bottomY - junk.size * 0.4,
      5,
      pushDebris,
    );
  }
  spawnGoldSparkBurst(debris, bx, by, 4, pushDebris);

  return {
    ...state,
    junks: state.junks.filter((j) => !burnSet.has(j)),
    debris,
    screenFlashUntil: state.elapsed + 140,
    screenFlashAlpha: 0.35,
    screenFlashColor: "#FF6F00",
    flapAnim: 1,
  };
}

function checkCollisions(state: GameState): GamePhase {
  const floor = floorY(state);
  if (state.bird.y - birdRadius(state.bird.nutrition) < 0) return "gameover";
  if (state.bird.y + birdRadius(state.bird.nutrition) > floor) return "gameover";
  if (state.elapsed < START_INVULN_MS) return state.phase;
  if (canPassObstacles(state)) return state.phase;
  for (const tree of state.trees) {
    if (collideTree(state, tree)) return "gameover";
  }
  for (const junk of state.junks) {
    if (collideJunk(state, junk)) return "gameover";
  }
  if (state.meteor && collideMeteor(state, state.meteor)) return "gameover";
  for (const crater of state.craters) {
    if (collideCrater(state, crater)) return "gameover";
  }
  for (const h of state.hazards) {
    if (h.kind === "mountain" && collideMountain(state, h)) return "gameover";
    if (seaActive(state) && h.kind === "shark" && collideShark(state, h)) return "gameover";
  }
  for (const tentacle of state.octopusTentacles) {
    if (seaActive(state) && collideOctopusTentacle(state, tentacle)) return "gameover";
  }
  if (
    state.animalBoss &&
    !state.animalBoss.defeatPendingAt &&
    (collideAnimalBoss(state, state.animalBoss) || collideBossMouth(state, state.animalBoss))
  ) {
    if (isNitroActive(state) || isBossEnergyBoostActive(state)) return state.phase;
    return "gameover";
  }
  return state.phase;
}

export function tick(state: GameState, dtMs: number): GameState {
  if (state.phase !== "playing") return state;

  const safeDt = clampTickDt(dtMs);
  let next: GameState = { ...state, elapsed: state.elapsed + safeDt };

  if (isBossEnergyBoostActive(next) && !isBossEnergyBoostActive(state)) {
    next.slowMoUntil = next.elapsed;
  }

  if (next.bossExplosion && next.elapsed > next.bossExplosion.startElapsed + BOAR_EXPLOSION_MS) {
    next.bossExplosion = null;
  }

  if (next.fruitEatFx && next.elapsed >= next.fruitEatFx.until) {
    next.fruitEatFx = null;
  }

  if (next.elapsed >= next.screenFlashUntil) {
    next.screenFlashAlpha = 0;
  }

  next = maybeBossApproachSlowMo(next);

  const slowActive =
    isSlowMoActive(next) && !isBossEnergyBoostActive(next) && !isCityLevel(levelFromScore(next.score));
  const scaledDtMs = safeDt * (slowActive ? slowMoFactor(next) : 1);
  const dt = Math.min(scaledDtMs, 32) / 16.67;

  if (!isNitroActive(next)) next.nitroStacks = 0;
  else if (next.nitroStacks < 1) next.nitroStacks = 1;

  const speedMult = worldSpeedMult(next);
  const level = levelFromScore(next.score);
  const prevLevel = levelFromScore(state.score);
  const inCity = isCityLevel(level);
  const enteredCity = inCity && !isCityLevel(prevLevel);

  if (enteredCity) {
    next.slowMoUntil = 0;
    next.bossApproachSlowMoUsed = true;
    next.bossExplosion = null;
    next.bossEnergyAbsorbUntil = 0;
    if (next.animalBoss && !next.animalBoss.defeatPendingAt) {
      next.animalBoss = null;
    }
    next.cityLandmarkDone = false;
    next.cityLandmarkX = next.width * 1.05;
  }

  const move = (next.speed + level * 0.04) * speedMult * dt;

  next.level = level;
  next.worldScroll += move;
  const vy = Math.min(MAX_FALL_SPEED, next.bird.vy + GRAVITY * dt);
  let birdY = next.bird.y + vy * dt;
  if (!Number.isFinite(birdY)) birdY = next.height * 0.45;
  next.bird = {
    ...next.bird,
    vy: Number.isFinite(vy) ? vy : 0,
    y: birdY,
  };
  next.flapAnim = Math.max(0, next.flapAnim - dt * 0.1);

  scrollTrees(next.trees, move);
  scrollJunks(next.junks, move);
  scrollHazards(next.hazards, move);
  scrollTentacles(next.octopusTentacles, move);
  scrollPickups(next.pickups, move);
  updateDebrisInPlace(next.debris, move, dt);

  if (inCity) {
    if (!next.cityLandmarkDone) {
      if (next.cityLandmarkX == null) {
        next.cityLandmarkX = next.width * 1.05;
      } else if (Number.isFinite(next.cityLandmarkX)) {
        next.cityLandmarkX -= move;
        if (next.cityLandmarkX < -next.width * 0.55) {
          next.cityLandmarkX = null;
          next.cityLandmarkDone = true;
        }
      } else {
        next.cityLandmarkX = null;
        next.cityLandmarkDone = true;
      }
    }
  } else {
    next.cityLandmarkX = null;
    next.cityLandmarkDone = false;
  }

  if (next.animalBoss) {
    const frozen = next.animalBoss.defeatPendingAt != null;
    const bossX = frozen ? next.animalBoss.x : next.animalBoss.x - move;
    if (bossX + next.animalBoss.width < -120) {
      next.animalBoss = null;
    } else {
      next.animalBoss = frozen
        ? next.animalBoss
        : updateAnimalBossBite(next, { ...next.animalBoss, x: bossX }, scaledDtMs);
    }
  }

  if (!seaActive(next)) {
    next.hazards = next.hazards.filter((h) => h.kind !== "shark");
    next.octopusTentacles = [];
  }

  next = updateMeteor(next, dt, move);
  next = updatePterodactyl(next, dt, move);

  const milestone = bossMilestoneForLevel(level);
  if (
    milestone >= BOSS_INTERVAL &&
    milestone > next.lastBossMilestone &&
    !next.animalBoss &&
    !next.bossExplosion &&
    !inCity
  ) {
    next.lastBossMilestone = milestone;
    next.bossApproachSlowMoUsed = false;
    const kind = bossKindForMilestone(milestone);
    const boss = spawnAnimalBoss(next, kind);
    next.animalBoss = boss;
    next.pickups = [...next.pickups, ...spawnBossLeadNitroPickups(next, boss)];
  }

  next.nextTreeX -= move;

  const bx = birdX(next);
  const spacing = treeSpacing(level);
  const spawnHorizon = bx + spacing * 3.2;

  let spawnSteps = 0;
  const maxSpawnSteps = 14;
  while (next.nextTreeX < spawnHorizon && spawnSteps < maxSpawnSteps) {
    spawnSteps += 1;
    const segment = spawnSegment(next, next.nextTreeX);
    next.trees.push(segment.tree);
    next.junks.push(segment.junk);
    next.segmentIndex += 1;

    const pickup = maybeSpawnPickup(next, segment.tree, segment.junk, level);
    if (pickup) next.pickups.push(pickup);

    const extras = spawnSegmentExtras(next, next.nextTreeX, next.segmentIndex);
    for (const h of extras.hazards) next.hazards.push(h);
    for (const t of extras.octopusTentacles) next.octopusTentacles.push(t);
    for (const t of extras.extraTrees) next.trees.push(t);
    for (const j of extras.extraJunks) next.junks.push(j);
    for (const p of extras.pickups) next.pickups.push(p);

    next.nextTreeX += spacing * (0.88 + Math.random() * 0.18);
  }

  const passOpts = {
    groundY: treeGroundY(next),
    birdR: birdRadius(next.bird.nutrition) * 0.88,
  };
  for (const tree of next.trees) {
    if (!tree.passed && tree.x + TREE_WIDTH[tree.type] < bx) {
      tree.passed = true;
      next = onTreePassed(next, tree, passOpts);
    }
  }

  for (const pickup of next.pickups) {
    next = collectPickup(next, pickup);
  }

  next = processJunkRecovery(next);

  next = tryDefeatAnimalBoss(next);

  next = smashObstacles(next);

  if (next.trees.length > MAX_TREES) {
    next.trees = next.trees.slice(-MAX_TREES);
  }
  if (next.hazards.length > MAX_HAZARDS) {
    next.hazards = next.hazards.slice(-MAX_HAZARDS);
  }
  if (next.pickups.length > MAX_PICKUPS) {
    next.pickups = next.pickups.slice(-MAX_PICKUPS);
  }

  next = burnEmberJunks(next);

  const levelAfter = levelFromScore(next.score);
  if (levelAfter > prevLevel) {
    next = onLevelUp(next, prevLevel, levelAfter);
  }
  next.level = levelAfter;

  next = pruneJuice(next);

  const phase = checkCollisions(next);
  return { ...next, phase };
}

function resetCanvasState(ctx: CanvasRenderingContext2D): void {
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function paintBaseSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  city: ReturnType<typeof cityForLevel>,
  pal: ReturnType<typeof sanitizeBiomePalette>,
): void {
  if (city) {
    const cp = cityPalette(city);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, cp.skyTop);
    g.addColorStop(0.55, cp.skyMid);
    g.addColorStop(1, cp.skyBot);
    ctx.fillStyle = g;
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, pal.skyTop);
    g.addColorStop(0.55, pal.skyMid);
    g.addColorStop(1, pal.skyBot);
    ctx.fillStyle = g;
  }
  ctx.fillRect(0, 0, w, h);
}

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { width, height } = state;
  if (width < 2 || height < 2) return;

  resetCanvasState(ctx);
  ctx.clearRect(0, 0, width, height);

  const zv = computeZoneVisual(state.level, state.score);
  const cityMode = isCityLevel(state.level);
  const city = zv.city ?? (cityMode ? cityForLevel(state.level) : null);
  const visualCity = zv.visualCity;
  const biome = zv.biome;
  const safePal = sanitizeBiomePalette(zv.naturePalette);

  paintBaseSky(ctx, width, height, city, safePal);
  const tod = timeOfDay(state.elapsed);
  const warm = Math.max(tod.sunset, tod.sunrise * 0.75);
  const groundLine = treeGroundY(state);
  const floorLine = floorY(state);
  const seaBlend = worldSeaBlend(state) * zv.natureWeight;
  const biomeCtx = {
    width,
    height,
    elapsed: state.elapsed,
    groundY: groundLine,
    floorY: floorLine,
    treeGroundY: groundLine,
    seaBlend,
    night: tod.night,
  };
  const cityCtx = {
    width,
    height,
    elapsed: state.elapsed,
    worldScroll: state.worldScroll,
    groundY: groundLine,
    floorY: floorLine,
    night: tod.night,
  };

  /** В городе природу рисуем только в самом конце цикла (56–62), иначе ломалась палитра/небо. */
  const skipNatureLayer = cityMode && zv.natureWeight < 0.88;

  if (zv.natureWeight > 0.02 && !skipNatureLayer) {
    ctx.save();
    ctx.globalAlpha = zv.natureWeight;
    drawNatureBackdrop(ctx, state, { ...zv, naturePalette: safePal }, tod, biomeCtx);
    ctx.restore();
  }

  if (zv.natureWeight < 0.98 && city) {
    ctx.save();
    ctx.globalAlpha = Math.max(0.08, 1 - zv.natureWeight);
    drawCityBackdrop(ctx, city, zv, cityCtx, width, height, tod.night, warm, state);
    ctx.restore();
  }

  if (!cityMode && zv.inTransition && zv.natureWeight > 0.04 && !skipNatureLayer) {
    ctx.save();
    ctx.globalAlpha = zv.natureWeight * 0.85;
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, safePal.skyTop);
    sky.addColorStop(0.55, safePal.skyMid);
    sky.addColorStop(1, safePal.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  resetCanvasState(ctx);

  for (const tree of state.trees) {
    if (visualCity && city) {
      if (zv.inTransition) {
        ctx.save();
        ctx.globalAlpha = zv.natureWeight;
        drawBottomTree(ctx, tree, state);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 1 - zv.natureWeight;
        drawCityObstacleBuilding(
          ctx,
          tree.x,
          groundLine,
          TREE_WIDTH[tree.type],
          tree.height,
          city,
          tod.night,
        );
        ctx.restore();
      } else {
        drawCityObstacleBuilding(
          ctx,
          tree.x,
          groundLine,
          TREE_WIDTH[tree.type],
          tree.height,
          city,
          tod.night,
        );
      }
    } else {
      drawBottomTree(ctx, tree, state);
    }
  }

  if (cityMode && city && state.cityLandmarkX != null) {
    const lmAlpha = zv.natureWeight < 0.98 ? 1 - zv.natureWeight : 1;
    if (lmAlpha > 0.04) {
      ctx.save();
      ctx.globalAlpha = lmAlpha;
      drawCityLandmarkForeground(ctx, city, cityCtx, state.cityLandmarkX);
      ctx.restore();
    }
  }

  if (state.animalBoss) {
    const ground = floorY(state);
    const intent = computeBossBiteIntent(birdX(state), state.bird.y, state.animalBoss, ground);
    drawAnimalBoss(ctx, state.animalBoss, ground, state.elapsed, intent, canDefeatAnimalBoss(state));
    drawBossFloatingTitle(ctx, state.animalBoss, ground, state.elapsed);
  }

  if (state.bossExplosion) drawBoarExplosion(ctx, state, state.bossExplosion);

  if (seaActive(state)) {
    for (const h of state.hazards) {
      if (h.kind === "shark") drawShark(ctx, h, state);
    }
    for (const tentacle of state.octopusTentacles) {
      drawOctopusTentacle(ctx, tentacle, state);
    }
  }

  drawCraters(ctx, state);

  if (state.meteor) drawMeteor(ctx, state.meteor, state.elapsed);

  for (const junk of state.junks) {
    drawJunk(ctx, junk, state);
  }

  for (const pickup of state.pickups) {
    if (!pickup.collected) drawPickup(ctx, pickup, state);
  }

  drawDebris(ctx, state.debris);

  if (state.pterodactyl) drawPterodactyl(ctx, state.pterodactyl, state);

  if (isBossEnergyAbsorbing(state) && state.bossExplosion) {
    drawBossEnergyAbsorb(ctx, state, state.bossExplosion);
  }
  if (isBossEnergyBoostActive(state)) drawBossEnergyBoostEffect(ctx, state);
  else if (isNitroActive(state)) drawNitroEffect(ctx, state);
  else if (isGhostActive(state)) drawGhostEffect(ctx, state);

  if (zv.natureWeight > 0.08) {
    ctx.save();
    ctx.globalAlpha = zv.natureWeight;
    drawBiomeForeground(ctx, biome, biomeCtx);
    ctx.restore();
  }

  const fxCtx = buildFxCtx(state, biome, visualCity, groundLine, floorLine, tod.night, seaBlend);
  drawSpeedStreaks(ctx, fxCtx);
  drawBoostVignette(ctx, fxCtx);
  drawBirdWake(ctx, fxCtx);
  if (state.phase === "playing") {
    drawBirdTrail(ctx, birdX(state), state.bird.y, state.birdSpeciesId, state.elapsed);
  }
  drawBird(ctx, state);
  if (state.fruitEatFx && state.elapsed < state.fruitEatFx.until) {
    drawFruitEatFx(ctx, state);
  }
  if (
    zv.natureWeight > 0.35 &&
    (isSlowMoActive(state) || isBossEnergyAbsorbing(state) || isBossEnergyBoostActive(state))
  ) {
    ctx.save();
    ctx.globalAlpha = zv.natureWeight;
    drawSlowMoOverlay(ctx, state);
    ctx.restore();
  }
  drawJuicePopups(ctx, state);
  drawHud(ctx, state, zv);
  drawComboHud(ctx, state);
  drawScreenFlash(ctx, state);
  resetCanvasState(ctx);
}

function drawNatureBackdrop(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  zv: ZoneVisual,
  tod: ReturnType<typeof timeOfDay>,
  biomeCtx: {
    width: number;
    height: number;
    elapsed: number;
    groundY: number;
    floorY: number;
    treeGroundY: number;
    seaBlend: number;
    night: number;
  },
): void {
  const biome = zv.biome;
  const pal = zv.naturePalette;

  drawSky(ctx, state, pal);
  drawSun(ctx, state);
  if (tod.night > 0.2) drawStars(ctx, state);
  if (tod.night > 0.55) drawMoon(ctx, state);
  if (biome !== "underwater") drawClouds(ctx, state);
  drawSkyDelicacies(ctx, state);
  drawFarMountains(ctx, state, pal);

  if (zv.prevBiome && zv.biomeDecorBlend > 0.03 && zv.biomeDecorBlend < 0.97) {
    ctx.save();
    ctx.globalAlpha = 1 - zv.biomeDecorBlend;
    drawBiomeBackdrop(ctx, zv.prevBiome, biomeCtx);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = zv.biomeDecorBlend;
    drawBiomeBackdrop(ctx, biome, biomeCtx);
    ctx.restore();
  } else {
    drawBiomeBackdrop(ctx, biome, biomeCtx);
  }

  if (tod.night > 0.5 && biome !== "underwater") drawNightWolves(ctx, state);

  for (const h of state.hazards) {
    if (h.kind === "mountain") drawMountain(ctx, h, state);
  }

  drawLand(ctx, state, pal, biomeCtx.seaBlend);
  drawWater(ctx, state, pal, biomeCtx.seaBlend);
}

function drawCityBackdrop(
  ctx: CanvasRenderingContext2D,
  city: NonNullable<ZoneVisual["city"]>,
  zv: ZoneVisual,
  cityCtx: {
    width: number;
    height: number;
    elapsed: number;
    worldScroll: number;
    groundY: number;
    floorY: number;
    night: number;
  },
  width: number,
  height: number,
  night: number,
  warm: number,
  state: GameState,
): void {
  const drawOneCity = (id: typeof city, alpha: number) => {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    drawCitySky(ctx, id, width, height, night, warm);
    if (night > 0.2) drawStars(ctx, state);
    if (night > 0.55) drawMoon(ctx, state);
    drawCityGround(ctx, id, cityCtx);
    drawCityscape(ctx, id, cityCtx);
    ctx.restore();
  };

  if (zv.prevCity && zv.cityBlend < 0.98) {
    drawOneCity(zv.prevCity, 1 - zv.cityBlend);
  }
  drawOneCity(city, zv.prevCity ? zv.cityBlend : 1);
}

function buildFxCtx(
  state: GameState,
  biome: ReturnType<typeof biomeForLevel>,
  cityMode: boolean,
  groundY: number,
  floorY: number,
  night: number,
  seaBlend: number,
): FxDrawCtx {
  return {
    width: state.width,
    height: state.height,
    elapsed: state.elapsed,
    night,
    biome,
    cityMode,
    seaBlend,
    birdX: birdX(state),
    birdY: state.bird.y,
    groundY,
    floorY,
    speedMult: worldSpeedMult(state),
    nitro: isNitroActive(state),
    bossBoost: isBossEnergyBoostActive(state),
    ghost: isGhostActive(state),
  };
}

function drawSky(ctx: CanvasRenderingContext2D, state: GameState, palette?: BiomePalette): void {
  const { width: w, height: h } = state;
  const tod = timeOfDay(state.elapsed);
  const warm = Math.max(tod.sunset, tod.sunrise * 0.75);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  const pal = sanitizeBiomePalette(palette ?? biomePalette(biomeForLevel(state.level)));

  const topDay = pal.skyTop;
  const topSunset = "#FF7043";
  const topNight = "#0D1B3E";
  const midDay = pal.skyMid;
  const midSunset = "#FFAB91";
  const midNight = "#1A237E";
  const botDay = pal.skyBot;
  const botSunset = "#FFCC80";
  const botNight = "#283593";

  g.addColorStop(0, blendSkyColor(topDay, topSunset, topNight, warm, tod.night));
  g.addColorStop(0.45, blendSkyColor(midDay, midSunset, midNight, warm, tod.night * 0.95));
  g.addColorStop(1, blendSkyColor(botDay, botSunset, botNight, warm * 0.85, tod.night));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (tod.sunset > 0.15) {
    const hz = horizonY(state);
    const sg = ctx.createLinearGradient(0, hz - 80, 0, hz + 30);
    sg.addColorStop(0, `rgba(255,112,67,${tod.sunset * 0.25})`);
    sg.addColorStop(0.5, `rgba(255,183,77,${tod.sunset * 0.35})`);
    sg.addColorStop(1, "rgba(255,183,77,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, hz - 90, w, 120);
  }
}

function blendSkyColor(day: string, sunset: string, night: string, warm: number, nightT: number): string {
  const blended = lerpRgb(parseColorRgb(day), parseColorRgb(sunset), warm);
  return rgbString(lerpRgb(blended, parseColorRgb(night), nightT));
}

function lerpColor(a: string, b: string, t: number): string {
  return rgbString(lerpRgb(parseColorRgb(a), parseColorRgb(b), t));
}

function drawSun(ctx: CanvasRenderingContext2D, state: GameState): void {
  const sun = sunVisual(state);
  if (!sun.visible) return;

  ctx.save();
  ctx.globalAlpha = sun.alpha;

  const glowR = sun.r * (2.4 + sun.glow * 0.5);
  const grad = ctx.createRadialGradient(sun.x, sun.y, sun.r * 0.15, sun.x, sun.y, glowR);
  grad.addColorStop(0, `rgba(255,249,196,${0.95 * sun.glow})`);
  grad.addColorStop(0.35, `rgba(255,213,79,${0.55 * sun.glow})`);
  grad.addColorStop(0.65, `rgba(255,152,0,${0.2 * sun.glow})`);
  grad.addColorStop(1, "rgba(255,87,34,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, glowR, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(sun.x - sun.r * 0.2, sun.y - sun.r * 0.2, 0, sun.x, sun.y, sun.r);
  const soft = sun.glow < 0.65;
  core.addColorStop(0, soft ? "#FFF8E1" : "#FFFDE7");
  core.addColorStop(0.55, soft ? "#FFE082" : "#FFEB3B");
  core.addColorStop(1, soft ? "#FFB74D" : "#FF9800");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, state: GameState): void {
  const nf = nightFactor(state.elapsed);
  ctx.fillStyle = `rgba(255,255,255,${0.15 + nf * 0.75})`;
  for (let i = 0; i < 48; i++) {
    const sx = ((i * 137 + 29) % state.width);
    const sy = ((i * 89 + 11) % Math.floor(state.height * 0.72));
    const r = (i % 3) * 0.6 + 0.8;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(200,220,255,${nf * 0.5})`;
  for (let i = 0; i < 3; i++) {
    const sx = ((i * 211 + 50) % state.width);
    const sy = ((i * 97 + 30) % Math.floor(state.height * 0.5));
    ctx.beginPath();
    ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function moonPosition(state: GameState): { x: number; y: number } {
  return { x: state.width * 0.78, y: 52 };
}

function drawMoon(ctx: CanvasRenderingContext2D, state: GameState): void {
  const nf = nightFactor(state.elapsed);
  const { x: mx, y: my } = moonPosition(state);
  ctx.globalAlpha = nf;
  ctx.fillStyle = "#FFF9C4";
  ctx.beginPath();
  ctx.arc(mx, my, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lerpColor("#B8E6FF", "#0D1B3E", nf);
  ctx.beginPath();
  ctx.arc(mx + 10, my - 4, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawWolfHowling(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale: number,
  elapsed: number,
  phase: number,
  moonX: number,
): void {
  const howl = Math.sin(elapsed * 0.0035 + phase);
  const howling = howl > 0.2;
  const headLift = howling ? (howl - 0.2) * 0.45 : 0;
  const faceMoon = moonX >= x;

  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale * (faceMoon ? 1 : -1), scale);

  const fur = "#2A2A3C";
  const furLight = "#454560";

  ctx.fillStyle = fur;
  ctx.fillRect(-7, -5, 2.5, 7);
  ctx.fillRect(1, -5, 2.5, 7);
  ctx.fillRect(-2.5, -4, 2.5, 6);

  ctx.beginPath();
  ctx.ellipse(0, -11, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = fur;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-9, -13);
  ctx.quadraticCurveTo(-15, -18, -12, -7);
  ctx.stroke();

  const headAngle = -1.05 - headLift * 0.55;
  ctx.save();
  ctx.translate(-1, -17);
  ctx.rotate(headAngle);

  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-3.5, -4.5);
  ctx.lineTo(-5.5, -10);
  ctx.lineTo(-1, -5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, -5);
  ctx.lineTo(4, -9.5);
  ctx.lineTo(4.5, -4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(7, 1.5, 6, 4.5, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = furLight;
  ctx.beginPath();
  ctx.ellipse(8.5, 2, 2, 1.5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  if (howling) {
    ctx.fillStyle = "#14141F";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(12, -3 - headLift * 4, 10.5, -5 - headLift * 3);
    ctx.quadraticCurveTo(9, -2, 10, 0);
    ctx.fill();

    ctx.strokeStyle = `rgba(180,190,230,${Math.min(0.45, (howl - 0.2) * 0.55)})`;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(11, -8 - headLift * 5, 3 + i * 2.5, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();
    }
  }

  ctx.restore();
  ctx.restore();
}

function drawNightWolves(ctx: CanvasRenderingContext2D, state: GameState): void {
  const tod = timeOfDay(state.elapsed);
  const nf = Math.min(1, (tod.night - 0.45) * 1.6);
  if (nf < 0.08) return;

  const groundY = treeGroundY(state);
  const ridgeY = groundY - 6;
  const moon = moonPosition(state);
  const scroll = (state.elapsed * 0.014) % (state.width + 200);

  const pack: Array<{ offset: number; scale: number; phase: number }> = [
    { offset: 30, scale: 0.78, phase: 0 },
    { offset: 175, scale: 0.65, phase: 1.4 },
    { offset: 320, scale: 0.82, phase: 2.6 },
    { offset: 480, scale: 0.6, phase: 0.8 },
    { offset: 610, scale: 0.7, phase: 3.3 },
  ];

  ctx.save();
  ctx.globalAlpha = nf;

  for (const wolf of pack) {
    const x = ((wolf.offset - scroll + state.width + 100) % (state.width + 200)) - 50;
    drawWolfHowling(ctx, x, ridgeY, wolf.scale, state.elapsed, wolf.phase, moon.x);
  }

  ctx.restore();
}

function drawSkySausage(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(-18, 0, 18, 0);
  g.addColorStop(0, "#E57373");
  g.addColorStop(0.45, "#FFAB91");
  g.addColorStop(1, "#D84315");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 6.5, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#BF360C";
  ctx.lineWidth = 0.8;
  for (let i = -14; i <= 14; i += 7) {
    ctx.beginPath();
    ctx.moveTo(i, -5);
    ctx.lineTo(i, 5);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.ellipse(-8, -2, 5, 2, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkyKolbaska(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 10);
  g.addColorStop(0, "#FFCCBC");
  g.addColorStop(0.55, "#E64A19");
  g.addColorStop(1, "#BF360C");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8D6E63";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.quadraticCurveTo(-13, -4, -11, -2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.quadraticCurveTo(13, 4, 11, 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.ellipse(-3, -2, 3, 2, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkyPasta(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#FDD835";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05;
    ctx.beginPath();
    ctx.arc(0, 0, 4 + i * 2.2, a, a + 1.6);
    ctx.stroke();
  }
  ctx.strokeStyle = "#FFB300";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const ang = i * 1.4 + 0.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 3, Math.sin(ang) * 3);
    ctx.quadraticCurveTo(Math.cos(ang) * 12, Math.sin(ang) * 12, Math.cos(ang + 0.8) * 16, Math.sin(ang + 0.8) * 16);
    ctx.stroke();
  }
  ctx.fillStyle = "#FFF59D";
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkyDelicacies(ctx: CanvasRenderingContext2D, state: GameState): void {
  const tod = timeOfDay(state.elapsed);
  const alpha = Math.max(0.32, 0.9 - tod.night * 0.58);
  const offset = (state.elapsed * 0.016) % (state.width + 140);

  const items: Array<{
    kind: "sausage" | "link" | "pasta";
    ox: number;
    y: number;
    rot: number;
    scale: number;
  }> = [
    { kind: "sausage", ox: 20, y: 36, rot: 0.18, scale: 0.72 },
    { kind: "link", ox: 110, y: 62, rot: -0.25, scale: 0.68 },
    { kind: "pasta", ox: 195, y: 24, rot: 0.4, scale: 0.7 },
    { kind: "sausage", ox: 280, y: 48, rot: -0.12, scale: 0.65 },
    { kind: "link", ox: 360, y: 30, rot: 0.3, scale: 0.62 },
    { kind: "pasta", ox: 430, y: 70, rot: -0.35, scale: 0.66 },
    { kind: "link", ox: 510, y: 44, rot: 0.08, scale: 0.7 },
    { kind: "pasta", ox: 590, y: 52, rot: 0.22, scale: 0.64 },
  ];

  for (const item of items) {
    const x = ((item.ox - offset + state.width + 70) % (state.width + 140)) - 35;
    const bob = Math.sin(state.elapsed * 0.002 + item.ox) * 2.5;
    ctx.save();
    ctx.translate(x, item.y + bob);
    ctx.rotate(item.rot);
    ctx.scale(item.scale, item.scale);
    ctx.globalAlpha = alpha;
    if (item.kind === "sausage") drawSkySausage(ctx);
    else if (item.kind === "link") drawSkyKolbaska(ctx);
    else drawSkyPasta(ctx);
    ctx.restore();
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, state: GameState): void {
  const tod = timeOfDay(state.elapsed);
  const warm = Math.max(tod.sunset, tod.sunrise * 0.5);
  const alpha = Math.max(0, 0.85 - tod.night * 0.75);
  if (alpha < 0.05) return;
  ctx.fillStyle = warm > 0.2 ? `rgba(255,220,190,${alpha})` : `rgba(255,255,255,${alpha})`;
  const offset = (state.elapsed * 0.025) % state.width;
  for (let i = 0; i < 5; i++) {
    const x = ((i * 130 - offset + state.width) % (state.width + 80)) - 40;
    const y = 24 + i * 20;
    ctx.beginPath();
    ctx.ellipse(x, y, 34, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 26, y + 3, 26, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCraters(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const crater of state.craters) {
    const r = crater.radius;
    const moundH = r * 0.42;
    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.ellipse(crater.x, crater.y - moundH * 0.3, r, moundH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3E2723";
    ctx.beginPath();
    ctx.ellipse(crater.x, crater.y - moundH * 0.15, r * 0.65, moundH * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(crater.x, crater.y - moundH * 0.1, r * 0.45, moundH * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMeteor(ctx: CanvasRenderingContext2D, meteor: Meteor, elapsed: number): void {
  const nf = nightFactor(elapsed);
  const trailAlpha = 0.35 + (1 - nf) * 0.35;
  ctx.strokeStyle = `rgba(255,200,100,${trailAlpha})`;
  ctx.lineWidth = nf > 0.5 ? 3.5 : 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(meteor.x, meteor.y);
  ctx.lineTo(meteor.x - meteor.vx * 9, meteor.y - meteor.vy * 9);
  ctx.stroke();
  ctx.fillStyle = nf > 0.5 ? "#FF7043" : "#FF5722";
  ctx.shadowColor = "#FF9800";
  ctx.shadowBlur = nf > 0.5 ? 12 : 8;
  ctx.beginPath();
  ctx.arc(meteor.x, meteor.y, METEOR_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFF3E0";
  ctx.beginPath();
  ctx.arc(meteor.x - 1.5, meteor.y - 1.5, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawFarMountains(ctx: CanvasRenderingContext2D, state: GameState, palette?: BiomePalette): void {
  const baseY = treeGroundY(state);
  const warm = timeOfDay(state.elapsed).sunset;
  const pal = palette ?? biomePalette(biomeForLevel(state.level));
  ctx.fillStyle = warm > 0.1 ? `rgba(62,39,35,${0.42 + warm * 0.28})` : pal.farMountains;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 120 - (state.elapsed * 0.015) % 120) % (state.width + 80)) - 40;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + 60, baseY - 50 - (i % 3) * 15);
    ctx.lineTo(x + 120, baseY);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLand(ctx: CanvasRenderingContext2D, state: GameState, palette?: BiomePalette, seaBlendOverride?: number): void {
  const { width: w, height: h } = state;
  const b = seaBlendOverride ?? worldSeaBlend(state);
  const pal = palette ?? biomePalette(biomeForLevel(state.level));
  const landTop = h - LAND_HEIGHT;
  const shoreTop = treeGroundY(state);
  const waterTop = floorY(state);

  ctx.save();
  ctx.globalAlpha = 1 - b * 0.9;
  const landG = ctx.createLinearGradient(0, landTop, 0, h);
  landG.addColorStop(0, pal.landTop);
  landG.addColorStop(0.25, pal.landMid);
  landG.addColorStop(0.55, pal.landBot);
  landG.addColorStop(0.8, "#8D6E63");
  landG.addColorStop(1, pal.landSoil);
  ctx.fillStyle = landG;
  ctx.fillRect(0, landTop, w, h - landTop);

  ctx.fillStyle = pal.grass;
  for (let i = 0; i < 16; i++) {
    const gx = (i * 47 + 8) % w;
    ctx.beginPath();
    ctx.moveTo(gx, landTop + 6);
    ctx.lineTo(gx + 5, landTop - 3);
    ctx.lineTo(gx + 10, landTop + 6);
    ctx.fill();
  }
  ctx.restore();

  if (b <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, b * 1.15);
  const shoreH = Math.max(10, waterTop - shoreTop + 6);
  const shoreG = ctx.createLinearGradient(0, shoreTop, 0, waterTop + 4);
  shoreG.addColorStop(0, "#9CCC65");
  shoreG.addColorStop(0.35, "#7CB342");
  shoreG.addColorStop(0.7, "#689F38");
  shoreG.addColorStop(1, "#C2A878");
  ctx.fillStyle = shoreG;
  ctx.fillRect(0, shoreTop, w, shoreH);

  ctx.fillStyle = "#C2A878";
  ctx.fillRect(0, waterTop - 4, w, 6);
  ctx.fillStyle = "#A89060";
  ctx.fillRect(0, waterTop + 1, w, 3);

  for (let i = 0; i < 14; i++) {
    const gx = (i * 53 + 10) % w;
    ctx.fillStyle = "#7CB342";
    ctx.beginPath();
    ctx.moveTo(gx, shoreTop + 4);
    ctx.lineTo(gx + 4, shoreTop - 2);
    ctx.lineTo(gx + 8, shoreTop + 4);
    ctx.fill();
  }
  ctx.restore();
}

function drawWater(ctx: CanvasRenderingContext2D, state: GameState, palette?: BiomePalette, seaBlendOverride?: number): void {
  const b = seaBlendOverride ?? worldSeaBlend(state);
  if (b <= 0.01) return;

  const { width: w, height: h, elapsed } = state;
  const pal = palette ?? biomePalette(biomeForLevel(state.level));
  const waterTop = floorY(state);
  const t = elapsed * 0.001;
  const nf = nightFactor(elapsed);

  ctx.save();
  ctx.globalAlpha = b;

  const g = ctx.createLinearGradient(0, waterTop, 0, h);
  g.addColorStop(0, lerpColor(pal.waterTop, "#1A237E", nf * 0.65));
  g.addColorStop(0.35, lerpColor(pal.waterMid, "#0D47A1", nf * 0.65));
  g.addColorStop(0.75, lerpColor(pal.waterBot, "#0D47A1", nf * 0.7));
  g.addColorStop(1, lerpColor(pal.waterBot, "#051A38", nf * 0.75));
  ctx.fillStyle = g;
  ctx.fillRect(0, waterTop, w, h - waterTop);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 5; i++) {
    const y = waterTop + 6 + i * 14;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      ctx.lineTo(x, y + Math.sin(x * 0.04 + t * 2.2 + i * 0.9) * (3.5 - i * 0.4));
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.globalAlpha = b * (0.22 - i * 0.03);
    ctx.fill();
  }

  ctx.globalAlpha = b;
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 5) {
    ctx.lineTo(x, waterTop + Math.sin(x * 0.06 + t * 3) * 4);
  }
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 3; i++) {
    const fx = ((i * 47 + t * 40) % (w + 30)) - 15;
    ctx.beginPath();
    ctx.ellipse(fx, waterTop + 3 + Math.sin(t * 4 + i) * 2, 6 + (i % 3) * 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (b > 0.85) {
    ctx.fillStyle = "#C2A878";
    ctx.fillRect(0, h - 10, w, 10);
    ctx.fillStyle = "#A89060";
    ctx.fillRect(0, h - 4, w, 4);
  }

  ctx.restore();
}

function drawBoarExplosionPart(
  ctx: CanvasRenderingContext2D,
  part: BoarExplosionPart,
  px: number,
  py: number,
  w: number,
  h: number,
  rot: number,
  alpha: number,
): void {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;

  const pw = part.rw * w;
  const ph = part.rh * h;

  if (part.shape === "ellipse") {
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, pw / 2, ph / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (part.shape === "corn") {
    const cg = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
    cg.addColorStop(0, "#FFF176");
    cg.addColorStop(0.5, "#FFEB3B");
    cg.addColorStop(1, "#F9A825");
    ctx.fillStyle = cg;
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.fillStyle = "rgba(255,193,7,0.5)";
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(-pw * 0.15 + k * pw * 0.12, -ph * 0.1 + k * ph * 0.12, pw * 0.08, ph * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (part.shape === "triangle") {
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.moveTo(0, -ph / 2);
    ctx.lineTo(-pw / 2, ph / 2);
    ctx.lineTo(pw / 2, ph / 2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = part.color;
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  }

  ctx.restore();
}

function drawBoarExplosion(ctx: CanvasRenderingContext2D, state: GameState, explosion: BoarExplosion): void {
  const age = state.elapsed - explosion.startElapsed;
  const t = Math.min(1, age / BOAR_EXPLOSION_MS);
  const crackT = Math.min(1, t / 0.22);
  const flyT = Math.pow(Math.max(0, (t - 0.08) / 0.92), 1.65);
  const { cx, cy, width: w, height: h, parts } = explosion;

  if (t < 0.2) {
    const flash = 1 - t / 0.2;
    ctx.fillStyle = `rgba(255,255,255,${flash * 0.42})`;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  const ringCount = 4;
  for (let i = 0; i < ringCount; i++) {
    const rt = Math.max(0, flyT - i * 0.08);
    const radius = (w * 0.15 + rt * w * 0.42) * (1 + i * 0.12);
    const alpha = Math.max(0, 0.55 - rt * 0.65 - i * 0.12);
    ctx.strokeStyle = i % 2 === 0 ? `rgba(255,152,0,${alpha})` : `rgba(255,87,34,${alpha})`;
    ctx.lineWidth = 8 - i * 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (crackT < 0.95) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.9 - flyT * 1.1);
    ctx.strokeStyle = "#2E1A12";
    ctx.lineWidth = 2;
    for (let c = 0; c < 6; c++) {
      const a0 = (c / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0) * w * 0.05, cy + Math.sin(a0) * h * 0.05);
      ctx.lineTo(cx + Math.cos(a0) * w * 0.22 * crackT, cy + Math.sin(a0) * h * 0.2 * crackT);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const part of parts) {
    const sep = flyT * flyT;
    const px = cx + part.localX * w + Math.cos(part.flyAngle) * sep * w * 0.62;
    const py = cy + part.localY * h + Math.sin(part.flyAngle) * sep * h * 0.5 + sep * sep * h * 0.12;
    const rot = part.spin * sep * 5.5;
    const alpha = Math.max(0, 1 - flyT * 0.92);
    drawBoarExplosionPart(ctx, part, px, py, w, h, rot, alpha);
  }

  ctx.fillStyle = `rgba(255,111,0,${Math.max(0, 0.38 - flyT * 0.42)})`;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.1 + flyT * w * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function drawBossEnergyAbsorb(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  explosion: BoarExplosion,
): void {
  const absorbStart = state.bossEnergyAbsorbUntil - BOSS_ENERGY_ABSORB_MS;
  const progress = Math.min(1, (state.elapsed - absorbStart) / BOSS_ENERGY_ABSORB_MS);
  const ease = progress * progress * (3 - 2 * progress);
  const bx = birdX(state);
  const by = state.bird.y;
  const { cx, cy, width: w, height: h } = explosion;
  const br = birdRadius(state.bird.nutrition);
  const t = state.elapsed * 0.001;

  const coreAlpha = 0.55 * (1 - ease * 0.7);
  ctx.fillStyle = `rgba(255,213,79,${coreAlpha})`;
  ctx.beginPath();
  ctx.arc(bx, by, br * (1.15 + ease * 0.55), 0, Math.PI * 2);
  ctx.fill();

  const streamCount = 6;
  for (let i = 0; i < streamCount; i++) {
    const angle = (i / streamCount) * Math.PI * 2 + t * 2.2;
    const sx = cx + Math.cos(angle) * w * (0.08 + (i % 3) * 0.06);
    const sy = cy + Math.sin(angle) * h * (0.06 + (i % 4) * 0.05);
    const mx = sx + (bx - sx) * ease * 0.55 + Math.sin(t * 8 + i) * 12 * (1 - ease);
    const my = sy + (by - sy) * ease * 0.55 + Math.cos(t * 7 + i) * 10 * (1 - ease);
    const ex = sx + (bx - sx) * ease;
    const ey = sy + (by - sy) * ease;

    const grad = ctx.createLinearGradient(sx, sy, ex, ey);
    grad.addColorStop(0, `rgba(255,152,0,${0.15 * (1 - ease)})`);
    grad.addColorStop(0.5, `rgba(255,235,59,${0.65 * (1 - ease * 0.35)})`);
    grad.addColorStop(1, `rgba(255,193,7,${0.9 * ease})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3 + (i % 3);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,${0.75 * ease})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 2.5 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 3; i++) {
    const orbit = br * (1.8 + i * 0.15);
    const px = bx + Math.cos(t * 5 + i * 0.9) * orbit * ease;
    const py = by + Math.sin(t * 4.5 + i * 0.9) * orbit * 0.65 * ease;
    ctx.fillStyle = `rgba(255,193,7,${0.5 * ease})`;
    ctx.beginPath();
    ctx.arc(px, py, 3 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = `rgba(255,235,59,${0.35 + Math.sin(t * 12) * 0.15})`;
  ctx.font = "bold 13px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ABSORB", bx, by - br - 18 - Math.sin(t * 10) * 4);
}

function drawBossEnergyBoostEffect(ctx: CanvasRenderingContext2D, state: GameState): void {
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition);
  const remain = state.bossEnergyBoostUntil - state.elapsed;
  const fade = Math.min(1, remain / BOSS_ENERGY_BOOST_MS);
  const ramp = worldSpeedMult(state) / BOSS_ENERGY_SPEED_MULT;
  const t = state.elapsed * 0.001;
  const pulse = (0.88 + Math.sin(t * 22) * 0.12) * (0.35 + ramp * 0.65);

  ctx.save();
  ctx.globalAlpha = fade;

  for (let i = 0; i < 6; i++) {
    const len = (40 + i * 18) * pulse;
    const spread = 8 + i * 2.5;
    const alpha = 0.85 - i * 0.07;
    const grad = ctx.createLinearGradient(bx - len, by, bx, by);
    grad.addColorStop(0, "rgba(255,235,59,0)");
    grad.addColorStop(0.4, `rgba(255,193,7,${alpha})`);
    grad.addColorStop(0.75, `rgba(255,111,0,${alpha})`);
    grad.addColorStop(1, `rgba(255,64,129,${alpha * 0.85})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 6 - i * 0.45;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bx - len, by - spread);
    ctx.quadraticCurveTo(bx - len * 0.4, by, bx - r * 0.4, by - 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - len, by + spread);
    ctx.quadraticCurveTo(bx - len * 0.4, by, bx - r * 0.4, by + 1);
    ctx.stroke();
  }

  ctx.shadowColor = "#FFD700";
  ctx.shadowBlur = 28 * pulse;
  ctx.fillStyle = `rgba(255,235,59,${0.28 * pulse})`;
  ctx.beginPath();
  ctx.ellipse(bx, by, r * 1.65 * pulse, r * 1.35 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = `rgba(255,255,255,${0.55 * pulse})`;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(bx - 24 - i * 22, by + (i - 2.5) * 9, 2.5 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSlowMoOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { width: w, height: h } = state;
  const remain = Math.max(0, state.slowMoUntil - state.elapsed);
  const pulse = 0.75 + Math.sin(state.elapsed * 0.02) * 0.25;
  const bossView = state.animalBoss && state.bossApproachSlowMoUsed && !state.bossExplosion;
  const defeatView = !!state.animalBoss?.defeatPendingAt;
  const explodeView = !!state.bossExplosion;
  const absorbView = isBossEnergyAbsorbing(state);
  const boostView = isBossEnergyBoostActive(state);

  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
  vg.addColorStop(0, "rgba(13,71,161,0)");
  vg.addColorStop(
    1,
    `rgba(13,71,161,${(explodeView ? 0.38 : defeatView ? 0.42 : bossView ? 0.48 : boostView ? 0.18 : 0.22) * pulse})`,
  );
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = `rgba(255,255,255,${0.08 * pulse})`;
  ctx.fillRect(0, 0, w, 3);
  ctx.fillRect(0, h - 3, w, 3);

  ctx.fillStyle = `rgba(187,222,251,${0.85 * pulse})`;
  ctx.font = "bold 15px Manrope, sans-serif";
  ctx.textAlign = "center";
  const label = boostView
    ? `x${BOSS_ENERGY_SPEED_MULT} BOOST!`
    : absorbView
      ? "KABOOM!"
      : explodeView
        ? "KABOOM!"
        : defeatView
          ? "GET READY"
          : bossView
            ? "BOSS AHEAD"
            : "SLOW-MO";
  ctx.fillText(label, w / 2, 36);
  if (absorbView) {
    ctx.font = "bold 11px Manrope, sans-serif";
    ctx.fillStyle = `rgba(255,235,59,${0.9 * pulse})`;
    ctx.fillText("energy → bird", w / 2, 52);
  } else if (boostView) {
    ctx.font = "10px Manrope, sans-serif";
    ctx.fillStyle = `rgba(255,235,59,${0.85 * pulse})`;
    ctx.fillText(`${((state.bossEnergyBoostUntil - state.elapsed) / 1000).toFixed(1)}s`, w / 2, 52);
  } else {
    ctx.font = "10px Manrope, sans-serif";
    ctx.fillStyle = `rgba(255,255,255,${0.7 * pulse})`;
    ctx.fillText(`${(remain / 1000).toFixed(1)}s`, w / 2, 52);
  }
}

function drawMountain(ctx: CanvasRenderingContext2D, m: MountainHazard, state: GameState): void {
  const baseY = floorY(state);
  const x1 = m.x;
  const x2 = m.x + m.width;
  const peakX = m.x + m.width / 2;
  const peakY = baseY - m.height;

  const g = ctx.createLinearGradient(peakX, peakY, peakX, baseY);
  g.addColorStop(0, "#94A3B8");
  g.addColorStop(0.45, "#64748B");
  g.addColorStop(1, "#475569");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x1, baseY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(x2, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(30,41,59,0.18)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const t = i * 0.22;
    ctx.beginPath();
    ctx.moveTo(x1 + (peakX - x1) * t, baseY - m.height * t);
    ctx.lineTo(peakX + (x2 - peakX) * t * 0.85, baseY - m.height * t * 0.85);
    ctx.stroke();
  }

  const snowLine = peakY + m.height * 0.38;
  const snowGrad = ctx.createLinearGradient(peakX, peakY, peakX, snowLine);
  snowGrad.addColorStop(0, "#FFFFFF");
  snowGrad.addColorStop(0.55, "#F1F5F9");
  snowGrad.addColorStop(1, "rgba(226,232,240,0.55)");
  ctx.fillStyle = snowGrad;
  ctx.beginPath();
  ctx.moveTo(peakX - m.width * 0.26, snowLine);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(peakX + m.width * 0.28, snowLine + m.height * 0.04);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.moveTo(peakX - m.width * 0.1, peakY + m.height * 0.14);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(peakX + m.width * 0.12, peakY + m.height * 0.16);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(148,163,184,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(peakX - m.width * 0.18, snowLine + 2);
  ctx.quadraticCurveTo(peakX, snowLine - m.height * 0.06, peakX + m.width * 0.2, snowLine + 3);
  ctx.stroke();

  drawMountainClimber(ctx, m, state, baseY, peakX, peakY, x1);
}

function mountainClimberPose(
  m: MountainHazard,
  state: GameState,
  baseY: number,
  peakX: number,
  x1: number,
): { cx: number; cy: number; angle: number; visible: boolean } {
  const cycle = 12000;
  const raw = ((state.elapsed + m.x * 41) % cycle) / cycle;
  const climbing = raw < 0.9;
  const climb = climbing ? raw / 0.9 : 0;
  const slopeT = 0.1 + climb * 0.72;
  const cx = x1 + (peakX - x1) * slopeT;
  const cy = baseY - m.height * slopeT - 2;
  const angle = Math.atan2(-m.height, peakX - x1);
  return { cx, cy, angle, visible: climbing };
}

function drawMountainClimber(
  ctx: CanvasRenderingContext2D,
  m: MountainHazard,
  state: GameState,
  baseY: number,
  peakX: number,
  _peakY: number,
  x1: number,
): void {
  const { cx, cy, angle, visible } = mountainClimberPose(m, state, baseY, peakX, x1);
  if (!visible) return;

  const step = Math.sin(state.elapsed * 0.011 + m.x * 0.02) * 0.45;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.strokeStyle = "#37474F";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-1.5, 3);
  ctx.lineTo(-3.5 - step * 4, 9);
  ctx.moveTo(1.5, 3);
  ctx.lineTo(3.5 + step * 3, 8.5);
  ctx.stroke();

  ctx.fillStyle = "#546E7A";
  ctx.fillRect(-4.5, -2.5, 2.2, 5.5);

  ctx.fillStyle = "#E53935";
  ctx.fillRect(-3.2, -3.5, 6.4, 7.5);

  ctx.fillStyle = "#FFC107";
  ctx.beginPath();
  ctx.arc(0, -6.5, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(-0.8, -7.2, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#78909C";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(2.5, -1.5);
  ctx.lineTo(7.5 + step * 2, -9 - step);
  ctx.stroke();
  ctx.fillStyle = "#B0BEC5";
  ctx.beginPath();
  ctx.moveTo(7.5 + step * 2, -9 - step);
  ctx.lineTo(9.5 + step * 2, -7.5 - step);
  ctx.lineTo(8.5 + step * 2, -10.5 - step);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#455A64";
  ctx.beginPath();
  ctx.arc(3 + step, -2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawShark(ctx: CanvasRenderingContext2D, shark: SharkHazard, state: GameState): void {
  if (!seaActive(state)) return;
  const p = sharkPose(shark, state);
  const { x, baseY, jump, bodyCx, bodyCy, bodyRx, bodyRy, mouthOpen } = p;

  if (jump > 0.05) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(bodyCx - 18 + i * 9, baseY + 2, 1.5 + (1 - jump) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (jump < 0.9) {
    ctx.fillStyle = "rgba(38,50,56,0.4)";
    ctx.beginPath();
    ctx.ellipse(bodyCx, baseY + 5, bodyRx * 0.7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const grad = ctx.createLinearGradient(bodyCx, bodyCy - bodyRy, bodyCx, bodyCy + bodyRy);
  grad.addColorStop(0, "#546E7A");
  grad.addColorStop(0.5, "#78909C");
  grad.addColorStop(1, "#ECEFF1");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(bodyCx, bodyCy, bodyRx, bodyRy, -0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#455A64";
  ctx.beginPath();
  ctx.moveTo(x + 6, bodyCy - 2);
  ctx.lineTo(x - 14, bodyCy - 12 - jump * 8);
  ctx.lineTo(x - 10, bodyCy + 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#37474F";
  ctx.beginPath();
  ctx.moveTo(x + 2, bodyCy);
  ctx.lineTo(x - 16, bodyCy - 10 - jump * 6);
  ctx.lineTo(x - 14, bodyCy + 10 + jump * 4);
  ctx.lineTo(x - 10, bodyCy + 6 + jump * 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#546E7A";
  ctx.beginPath();
  ctx.moveTo(bodyCx - 4, bodyCy - bodyRy - 2);
  ctx.lineTo(bodyCx + 2, bodyCy - bodyRy - 14 - jump * 6);
  ctx.lineTo(bodyCx + 8, bodyCy - bodyRy);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#455A64";
  ctx.beginPath();
  ctx.ellipse(p.headX, p.headY, 14 + jump * 3, 10 + jump * 4, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ECEFF1";
  ctx.beginPath();
  ctx.ellipse(p.headX + 2, p.headY + 5, 10, 5, 0.2, 0, Math.PI);
  ctx.fill();

  if (mouthOpen) {
    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.ellipse(p.mouthX, p.mouthY + 2, 10, 6, 0.15, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(p.mouthX - 6 + i * 4, p.mouthY + 2);
      ctx.lineTo(p.mouthX - 4 + i * 4, p.mouthY + 8);
      ctx.lineTo(p.mouthX - 2 + i * 4, p.mouthY + 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(p.headX + 4, p.headY - 2, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#263238";
  ctx.beginPath();
  ctx.moveTo(p.headX - 6, p.headY - 6);
  ctx.lineTo(p.headX - 2, p.headY - 14);
  ctx.lineTo(p.headX + 2, p.headY - 6);
  ctx.closePath();
  ctx.fill();
}

function drawOctopusTentacle(ctx: CanvasRenderingContext2D, tentacle: OctopusTentacle, state: GameState): void {
  if (!seaActive(state)) return;
  const p = tentaclePose(tentacle, state);
  if (p.rise < 0.04) return;

  const { baseY, rise, baseX, tips } = p;

  if (rise > 0.08) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(baseX - 12 + i * 8, baseY + 2, 1.5 + (1 - rise) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (rise > 0.12) {
    const headY = baseY - 4;
    const headR = 12 + rise * 6;
    const headGrad = ctx.createRadialGradient(baseX - 4, headY - 4, 2, baseX, headY, headR);
    headGrad.addColorStop(0, "#CE93D8");
    headGrad.addColorStop(0.55, "#8E24AA");
    headGrad.addColorStop(1, "#4A148C");
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(baseX, headY, headR, headR * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    for (let e = 0; e < 2; e++) {
      const ex = baseX + (e === 0 ? -5 : 5);
      ctx.beginPath();
      ctx.ellipse(ex, headY - 3, 3.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(ex, headY - 2, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
    }
  }

  for (let i = 0; i < TENTACLE_COUNT; i++) {
    const tip = tips[i];
    const spread = (i - (TENTACLE_COUNT - 1) / 2) * 15;
    const reach = baseY - tip.y;
    const midX = baseX + spread * 0.55 + Math.sin(state.elapsed * 0.004 + tentacle.phaseSeed + i) * 6;
    const midY = baseY - reach * 0.45;
    const ctrlX = baseX + spread * 0.35 + Math.sin(state.elapsed * 0.006 + i * 1.1) * 14;
    const ctrlY = baseY - reach * 0.62;

    const tentGrad = ctx.createLinearGradient(baseX, baseY, tip.x, tip.y);
    tentGrad.addColorStop(0, "#6A1B9A");
    tentGrad.addColorStop(0.5, "#AB47BC");
    tentGrad.addColorStop(1, "#CE93D8");
    ctx.strokeStyle = tentGrad;
    ctx.lineWidth = 7 + rise * 3 - i * 0.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(baseX + spread * 0.25, baseY - 2);
    ctx.quadraticCurveTo(ctrlX, ctrlY, midX, midY);
    ctx.quadraticCurveTo(tip.x + spread * 0.08, tip.y + 8, tip.x, tip.y);
    ctx.stroke();

    const suckerCount = 4 + Math.floor(rise * 3);
    for (let s = 1; s <= suckerCount; s++) {
      const t = s / (suckerCount + 1);
      const sx = baseX + (tip.x - baseX) * t + Math.sin(t * 8 + i) * 3;
      const sy = baseY + (tip.y - baseY) * t;
      ctx.fillStyle = `rgba(74,20,140,${0.35 + rise * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(sx + 3, sy, 2.2, 2.8, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawDebris(ctx: CanvasRenderingContext2D, debris: DebrisParticle[]): void {
  for (const d of debris) {
    const alpha = Math.min(1, d.life * 1.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rotation);

    if (d.kind === "spark") {
      ctx.fillStyle = d.color;
      ctx.shadowColor = d.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, 0, d.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === "gold") {
      ctx.fillStyle = d.color;
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 3;
      const s = d.size;
      ctx.beginPath();
      for (let k = 0; k < 5; k += 1) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        const r = k % 2 === 0 ? s : s * 0.45;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else if (d.kind === "bubble") {
      ctx.strokeStyle = d.color;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, d.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.arc(-d.size * 0.28, -d.size * 0.28, d.size * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === "leaf") {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, d.size, d.size * 0.55, 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === "rock") {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(-d.size, d.size * 0.3);
      ctx.lineTo(0, -d.size);
      ctx.lineTo(d.size, d.size * 0.4);
      ctx.closePath();
      ctx.fill();
    } else if (d.kind === "splash") {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, d.size, d.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === "crumb") {
      ctx.fillStyle = d.color;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size * 0.7);
    } else {
      ctx.fillStyle = d.color;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size * 1.6);
    }

    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawBottomTree(ctx: CanvasRenderingContext2D, tree: TreeObstacle, state: GameState): void {
  const tw = TREE_WIDTH[tree.type];
  const groundY = treeGroundY(state);
  const y = Math.round(groundY - tree.height);
  drawTreeTrunk(ctx, Math.round(tree.x), y, tw, Math.round(tree.height), tree.type);
}

function treeVariantSeed(x: number, h: number): number {
  return x * 0.13 + h * 0.047;
}

function treeHash(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function drawTreeTrunk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  type: TreeType,
): void {
  if (h <= 8) return;
  const cx = Math.round(x + w / 2);
  const groundY = Math.round(y + h);
  const seed = treeVariantSeed(x, h);
  const lean = Math.round((treeHash(seed) - 0.5) * w * 0.04);
  const trunkH = Math.max(16, Math.min(Math.round(h * 0.28), 44));
  const trunkW = type === "oak" ? w * 0.2 : w * 0.16;
  const canopyBottom = groundY - trunkH;
  const canopyH = h - trunkH;
  const canopyTop = Math.round(y);

  const shadow = ctx.createRadialGradient(cx, groundY + 2, 2, cx, groundY + 2, w * 0.7);
  shadow.addColorStop(0, "rgba(0,0,0,0.18)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 3, w * 0.42, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const trunkGrad = ctx.createLinearGradient(cx - trunkW, groundY - trunkH, cx + trunkW, groundY);
  trunkGrad.addColorStop(0, "#4E342E");
  trunkGrad.addColorStop(0.45, "#6D4C41");
  trunkGrad.addColorStop(1, "#3E2723");
  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(cx - trunkW * 0.62, groundY);
  ctx.quadraticCurveTo(cx - trunkW * 0.7, groundY - trunkH * 0.45, cx - trunkW * 0.4 + lean, groundY - trunkH);
  ctx.lineTo(cx + trunkW * 0.4 + lean, groundY - trunkH);
  ctx.quadraticCurveTo(cx + trunkW * 0.7, groundY - trunkH * 0.45, cx + trunkW * 0.62, groundY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(62,39,35,0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    const bx = cx + (treeHash(seed + i * 2) - 0.5) * trunkW * 0.35;
    ctx.beginPath();
    ctx.moveTo(bx, groundY - 3);
    ctx.lineTo(bx + lean * 0.3, groundY - trunkH + 4);
    ctx.stroke();
  }

  if (type === "oak") {
    drawOakCanopy(ctx, cx + lean * 0.5, canopyTop, canopyBottom, canopyH, w, seed);
  } else if (type === "pine") {
    drawConiferCanopy(ctx, cx + lean * 0.5, canopyTop, canopyBottom, canopyH, w, seed, true);
  } else {
    drawConiferCanopy(ctx, cx + lean * 0.5, canopyTop, canopyBottom, canopyH, w, seed, false);
  }
}

function drawOakCanopy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  _bottom: number,
  ch: number,
  w: number,
  seed: number,
): void {
  const lumps: Array<{ ox: number; oy: number; rx: number; ry: number; color: string }> = [
    { ox: 0, oy: 0.5, rx: 0.5, ry: 0.4, color: "#3E5C40" },
    { ox: -0.18, oy: 0.44, rx: 0.36, ry: 0.3, color: "#4A7349" },
    { ox: 0.16, oy: 0.4, rx: 0.34, ry: 0.28, color: "#567B52" },
    { ox: 0, oy: 0.3, rx: 0.32, ry: 0.24, color: "#62885C" },
  ];

  for (let i = 0; i < lumps.length; i += 1) {
    const l = lumps[i];
    const jx = Math.round((treeHash(seed + i * 1.7) - 0.5) * w * 0.04);
    const jy = Math.round((treeHash(seed + i * 2.3) - 0.5) * ch * 0.03);
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.ellipse(
      Math.round(cx + w * l.ox + jx),
      Math.round(top + ch * l.oy + jy),
      Math.round(w * l.rx),
      Math.round(ch * l.ry),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function drawConiferCanopy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  bottom: number,
  ch: number,
  w: number,
  _seed: number,
  isPine: boolean,
): void {
  const layers = isPine ? 5 : 4;
  const greens = ["#2D4A32", "#3A5C3E", "#456B48", "#527856", "#5E8460"];

  const icx = Math.round(cx);
  for (let i = 0; i < layers; i += 1) {
    const t0 = i / layers;
    const t1 = (i + 1) / layers;
    const layerTop = Math.round(bottom - t1 * ch);
    const layerBot = Math.round(bottom - t0 * ch);
    const spread = Math.round(w * (0.5 + (1 - t1) * 0.42));

    ctx.fillStyle = greens[i % greens.length];
    ctx.beginPath();
    ctx.moveTo(icx, layerTop);
    ctx.lineTo(icx - spread, layerBot);
    ctx.lineTo(icx + spread, layerBot);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "#6B9168";
  ctx.beginPath();
  ctx.moveTo(icx, Math.round(top + ch * 0.05));
  ctx.lineTo(icx - Math.round(w * 0.05), Math.round(top + ch * 0.12));
  ctx.lineTo(icx + Math.round(w * 0.05), Math.round(top + ch * 0.12));
  ctx.closePath();
  ctx.fill();
}

function drawPterodactyl(ctx: CanvasRenderingContext2D, p: Pterodactyl, state: GameState): void {
  const nf = nightFactor(state.elapsed);
  const body = lerpColor("#78909C", "#37474F", nf * 0.75);
  const wing = lerpColor("#546E7A", "#263238", nf * 0.8);
  const flap = Math.sin(p.wingPhase);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(-1, 1);

  ctx.fillStyle = wing;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.moveTo(-4, -3);
  ctx.quadraticCurveTo(-22, -18 - flap * 9, -38, -6 - flap * 5);
  ctx.quadraticCurveTo(-24, 2, -4, -3);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 1, 15, 7.5, -0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(10, -1);
  ctx.quadraticCurveTo(20, -12, 28, -14);
  ctx.lineTo(34, -11);
  ctx.lineTo(28, -7);
  ctx.quadraticCurveTo(18, -3, 10, -1);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(22, -15);
  ctx.lineTo(20, -24);
  ctx.lineTo(17, -16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = lerpColor("#FFCC80", "#795548", nf * 0.55);
  ctx.beginPath();
  ctx.moveTo(32, -11);
  ctx.lineTo(44, -8);
  ctx.lineTo(32, -6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = wing;
  ctx.beginPath();
  ctx.moveTo(2, 2);
  ctx.quadraticCurveTo(14, 20 + flap * 11, 40, 10 + flap * 7);
  ctx.quadraticCurveTo(22, 2, 2, 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ECEFF1";
  ctx.beginPath();
  ctx.arc(26, -10, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(26.6, -10, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGhostEffect(ctx: CanvasRenderingContext2D, state: GameState): void {
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition);
  const pulse = 0.7 + Math.sin(state.elapsed * 0.012) * 0.15;

  ctx.save();
  ctx.strokeStyle = `rgba(186,230,253,${0.45 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(bx, by, r * 1.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = `rgba(224,247,250,${0.18 * pulse})`;
  ctx.beginPath();
  ctx.ellipse(bx, by, r * 1.55, r * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNitroEffect(ctx: CanvasRenderingContext2D, state: GameState): void {
  const bx = birdX(state);
  const by = state.bird.y;
  const r = birdRadius(state.bird.nutrition);
  const t = state.elapsed * 0.001;
  const stacks = Math.max(1, state.nitroStacks);
  const ramp = worldSpeedMult(state) / Math.max(1.01, nitroSpeedMult(state));
  const pulse = (0.85 + Math.sin(t * 18) * 0.15) * (1 + (stacks - 1) * 0.1) * (0.4 + ramp * 0.6);
  const trailCount = Math.min(4, 2 + stacks);

  for (let i = 0; i < trailCount; i++) {
    const len = (28 + i * 14) * pulse;
    const spread = 6 + i * 3;
    const alpha = 0.75 - i * 0.12;
    const grad = ctx.createLinearGradient(bx - len, by, bx, by);
    grad.addColorStop(0, `rgba(255,152,0,0)`);
    grad.addColorStop(0.45, `rgba(255,193,7,${alpha})`);
    grad.addColorStop(0.75, `rgba(255,87,34,${alpha})`);
    grad.addColorStop(1, `rgba(3,169,244,${alpha * 0.9})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5 - i * 0.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bx - len, by - spread + Math.sin(t * 20 + i) * 3);
    ctx.quadraticCurveTo(bx - len * 0.45, by, bx - r * 0.5, by - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - len, by + spread - Math.sin(t * 20 + i) * 3);
    ctx.quadraticCurveTo(bx - len * 0.45, by, bx - r * 0.5, by + 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,235,59,0.35)";
  ctx.beginPath();
  ctx.ellipse(bx - r * 1.1, by, r * 1.5 * pulse, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.5)";

  ctx.fillStyle = "#FF6D00";
  ctx.font = "bold 13px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`x${stacks}`, bx + r * 0.15, by - r - 10);
  ctx.font = "bold 8px Manrope, sans-serif";
  ctx.fillStyle = "#FFB74D";
  ctx.fillText("NITRO", bx + r * 0.15, by - r - 1);
}

function drawJunk(ctx: CanvasRenderingContext2D, junk: JunkObstacle, state: GameState): void {
  const { x, bottomY, size, type } = junk;
  const cx = x + size / 2;

  if (canOfferJunkRecovery(state) && isJunkRecoveryFood(type)) {
    const pulse = 0.45 + Math.sin(state.elapsed * 0.008) * 0.25;
    ctx.save();
    ctx.strokeStyle = `rgba(255,193,7,${pulse})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = "#FFC107";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(cx, bottomY - size * 0.45, size * 0.58, size * 0.52, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (type === "candy") {
    const bodyY = bottomY - size * 0.42;
    const rx = size * 0.3;
    const ry = size * 0.24;

    const drawTwist = (side: -1 | 1) => {
      const edgeX = cx + side * rx;
      ctx.fillStyle = side === -1 ? "#FFD54F" : "#FFCA28";
      ctx.beginPath();
      ctx.moveTo(edgeX, bodyY - ry * 0.5);
      ctx.lineTo(edgeX + side * size * 0.26, bodyY - ry * 1.1);
      ctx.lineTo(edgeX + side * size * 0.22, bodyY);
      ctx.lineTo(edgeX + side * size * 0.26, bodyY + ry * 1.1);
      ctx.lineTo(edgeX, bodyY + ry * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#F9A825";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    drawTwist(-1);
    drawTwist(1);

    ctx.fillStyle = "#E91E63";
    ctx.beginPath();
    ctx.ellipse(cx, bodyY, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, bodyY, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = size * 0.055;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * size * 0.11 - size * 0.35, bodyY - ry * 1.4);
      ctx.lineTo(cx + i * size * 0.11 + size * 0.35, bodyY + ry * 1.4);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = "#AD1457";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, bodyY, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.25, bodyY - ry * 0.25, rx * 0.22, ry * 0.18, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "bacon") {
    drawBaconStrip(ctx, x, cx, bottomY, size);
  } else if (type === "burger") {
    const w = size * 0.52;
    ctx.fillStyle = "#F4A460";
    ctx.beginPath();
    ctx.ellipse(cx, bottomY - size * 0.1, w, size * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#D2691E";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#6D4C41";
    ctx.beginPath();
    ctx.ellipse(cx, bottomY - size * 0.26, w * 0.96, size * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#66BB6A";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.06, bottomY - size * 0.36);
    ctx.quadraticCurveTo(cx, bottomY - size * 0.42, x + size * 0.94, bottomY - size * 0.36);
    ctx.lineTo(x + size * 0.94, bottomY - size * 0.44);
    ctx.quadraticCurveTo(cx, bottomY - size * 0.5, x + size * 0.06, bottomY - size * 0.44);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#FFEB3B";
    ctx.fillRect(x + size * 0.08, bottomY - size * 0.52, size * 0.84, size * 0.07);

    ctx.fillStyle = "#D84315";
    ctx.beginPath();
    ctx.ellipse(cx, bottomY - size * 0.58, w * 0.94, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F4A460";
    ctx.beginPath();
    ctx.ellipse(cx, bottomY - size * 0.74, w, size * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#D2691E";
    ctx.stroke();

    ctx.fillStyle = "#FFF8E1";
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(x + size * 0.16 + i * size * 0.12, bottomY - size * 0.74, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.35, bottomY - size * 0.76, 3, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "pizza") {
    const tipY = bottomY - size * 0.06;
    const crustY = bottomY - size * 0.82;

    ctx.fillStyle = "#FF9800";
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(x + size * 0.04, crustY);
    ctx.lineTo(x + size * 0.96, crustY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#FFE0B2";
    ctx.beginPath();
    ctx.moveTo(cx, tipY + size * 0.1);
    ctx.lineTo(x + size * 0.14, crustY + size * 0.04);
    ctx.lineTo(x + size * 0.86, crustY + size * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#E53935";
    const toppings = [
      [0.28, 0.52],
      [0.42, 0.62],
      [0.58, 0.48],
      [0.72, 0.58],
      [0.36, 0.44],
      [0.64, 0.66],
    ];
    for (const [tx, ty] of toppings) {
      ctx.beginPath();
      ctx.arc(x + size * tx, bottomY - size * ty, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#FF7043";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(x + size * (0.22 + i * 0.14), bottomY - size * 0.38, 4, 2.5, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#E65100";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(x + size * 0.04, crustY);
    ctx.lineTo(x + size * 0.96, crustY);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "#BF360C";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.04, crustY);
    ctx.lineTo(x + size * 0.96, crustY);
    ctx.stroke();
  } else if (type === "soda") {
    drawSodaBottle(ctx, x, cx, bottomY, size, state.elapsed);
  }
}

function drawBaconStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  _cx: number,
  bottomY: number,
  size: number,
): void {
  const topY = bottomY - size * 0.9;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + size * 0.1, bottomY - size * 0.11);
  ctx.bezierCurveTo(
    x + size * 0.04,
    bottomY - size * 0.34,
    x + size * 0.28,
    bottomY - size * 0.46,
    x + size * 0.22,
    bottomY - size * 0.58,
  );
  ctx.bezierCurveTo(
    x + size * 0.16,
    bottomY - size * 0.72,
    x + size * 0.38,
    bottomY - size * 0.84,
    x + size * 0.52,
    bottomY - size * 0.8,
  );
  ctx.bezierCurveTo(
    x + size * 0.68,
    bottomY - size * 0.76,
    x + size * 0.82,
    bottomY - size * 0.58,
    x + size * 0.86,
    bottomY - size * 0.38,
  );
  ctx.bezierCurveTo(
    x + size * 0.9,
    bottomY - size * 0.2,
    x + size * 0.78,
    bottomY - size * 0.1,
    x + size * 0.58,
    bottomY - size * 0.09,
  );
  ctx.bezierCurveTo(
    x + size * 0.34,
    bottomY - size * 0.08,
    x + size * 0.18,
    bottomY - size * 0.09,
    x + size * 0.1,
    bottomY - size * 0.11,
  );
  ctx.closePath();

  const meatGrad = ctx.createLinearGradient(x, topY, x + size, bottomY);
  meatGrad.addColorStop(0, "#C62828");
  meatGrad.addColorStop(0.35, "#E53935");
  meatGrad.addColorStop(0.65, "#D84315");
  meatGrad.addColorStop(1, "#B71C1C");
  ctx.fillStyle = meatGrad;
  ctx.fill();

  ctx.strokeStyle = "#5D4037";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.clip();

  const fatStreaks: Array<[number, number, number, number]> = [
    [0.14, 0.22, 0.78, 0.18],
    [0.18, 0.38, 0.82, 0.34],
    [0.12, 0.52, 0.8, 0.48],
    [0.16, 0.66, 0.76, 0.62],
    [0.2, 0.78, 0.72, 0.74],
  ];
  for (const [x0, y0, x1, y1] of fatStreaks) {
    const wave = size * 0.04;
    ctx.strokeStyle = "rgba(255,252,245,0.92)";
    ctx.lineWidth = size * 0.055 + (y0 % 0.2) * size * 0.02;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + size * x0, bottomY - size * y0);
    ctx.quadraticCurveTo(
      x + size * ((x0 + x1) / 2),
      bottomY - size * ((y0 + y1) / 2) + wave,
      x + size * x1,
      bottomY - size * y1,
    );
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = size * 0.022;
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,235,220,0.55)";
  ctx.beginPath();
  ctx.ellipse(x + size * 0.78, bottomY - size * 0.14, size * 0.09, size * 0.05, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.fillStyle = "#FFEBEE";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.08, bottomY - size * 0.12);
  ctx.lineTo(x + size * 0.14, bottomY - size * 0.2);
  ctx.lineTo(x + size * 0.12, bottomY - size * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#BCAAA4";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.ellipse(x + size * 0.32, bottomY - size * 0.32, size * 0.08, size * 0.035, -0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(62,39,35,0.35)";
  const searSpots: Array<[number, number]> = [
    [0.28, 0.28],
    [0.42, 0.36],
    [0.56, 0.44],
    [0.36, 0.54],
    [0.64, 0.34],
    [0.48, 0.68],
    [0.3, 0.62],
    [0.72, 0.5],
  ];
  for (const [fx, fy] of searSpots) {
    ctx.beginPath();
    ctx.arc(x + size * fx, bottomY - size * fy, 0.85, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSodaBottle(
  ctx: CanvasRenderingContext2D,
  _x: number,
  cx: number,
  bottomY: number,
  size: number,
  elapsed: number,
): void {
  const bw = size * 0.36;
  const bodyTop = bottomY - size * 0.82;
  const bodyBot = bottomY - size * 0.12;
  const neckTop = bottomY - size * 0.92;
  const capTop = bottomY - size;

  ctx.fillStyle = "#8D6E63";
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.55, bodyBot);
  ctx.lineTo(cx - bw * 0.42, bodyTop + size * 0.06);
  ctx.lineTo(cx - bw * 0.22, neckTop);
  ctx.lineTo(cx + bw * 0.22, neckTop);
  ctx.lineTo(cx + bw * 0.42, bodyTop + size * 0.06);
  ctx.lineTo(cx + bw * 0.55, bodyBot);
  ctx.closePath();
  ctx.fill();

  const bodyGrad = ctx.createLinearGradient(cx - bw, bodyTop, cx + bw, bodyBot);
  bodyGrad.addColorStop(0, "#EF5350");
  bodyGrad.addColorStop(0.35, "#C62828");
  bodyGrad.addColorStop(0.7, "#B71C1C");
  bodyGrad.addColorStop(1, "#8E0000");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.5, bodyBot - 2);
  ctx.lineTo(cx - bw * 0.38, bodyTop + size * 0.08);
  ctx.lineTo(cx - bw * 0.2, neckTop + size * 0.04);
  ctx.lineTo(cx + bw * 0.2, neckTop + size * 0.04);
  ctx.lineTo(cx + bw * 0.38, bodyTop + size * 0.08);
  ctx.lineTo(cx + bw * 0.5, bodyBot - 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx - bw * 0.18, bodyTop + size * 0.22, bw * 0.12, size * 0.28, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(cx - bw * 0.34, bodyTop + size * 0.28, bw * 0.68, size * 0.18);
  ctx.fillStyle = "#E53935";
  ctx.font = `bold ${Math.max(7, size * 0.16)}px Manrope, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("COLA", cx, bodyTop + size * 0.4);

  const bubblePhase = elapsed * 0.006;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  for (let i = 0; i < 5; i++) {
    const by = bodyBot - size * (0.18 + ((bubblePhase + i * 0.7) % 3.2) * 0.14);
    const bx = cx + Math.sin(bubblePhase + i * 1.4) * bw * 0.22;
    ctx.beginPath();
    ctx.arc(bx, by, 1.2 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ECEFF1";
  ctx.fillRect(cx - bw * 0.18, neckTop, bw * 0.36, size * 0.06);
  ctx.strokeStyle = "#90A4AE";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - bw * 0.18, neckTop, bw * 0.36, size * 0.06);

  ctx.fillStyle = "#D32F2F";
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.24, capTop + size * 0.03);
  ctx.lineTo(cx - bw * 0.2, neckTop);
  ctx.lineTo(cx + bw * 0.2, neckTop);
  ctx.lineTo(cx + bw * 0.24, capTop + size * 0.03);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#BDBDBD";
  ctx.beginPath();
  ctx.ellipse(cx, capTop + size * 0.025, bw * 0.26, size * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.ellipse(cx - bw * 0.08, capTop + size * 0.02, bw * 0.08, size * 0.012, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5D4037";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.5, bodyBot);
  ctx.lineTo(cx + bw * 0.5, bodyBot);
  ctx.stroke();
}

function drawApplePickup(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  const bodyGrad = ctx.createRadialGradient(-3, -2, 1, 0, 1, 13);
  bodyGrad.addColorStop(0, "#FF8A80");
  bodyGrad.addColorStop(0.4, "#E53935");
  bodyGrad.addColorStop(1, "#9A0007");

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 1, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#C62828";
  ctx.beginPath();
  ctx.ellipse(0, -8, 3.2, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.beginPath();
  ctx.ellipse(-4.5, -1, 3.2, 5.2, -0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(5, 4, 2.5, 3.8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#4E342E";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.quadraticCurveTo(1.5, -13, 3.5, -15);
  ctx.stroke();

  ctx.fillStyle = "#66BB6A";
  ctx.beginPath();
  ctx.ellipse(6.5, -12.5, 5.5, 2.4, 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#388E3C";
  ctx.lineWidth = 0.7;
  ctx.stroke();

  ctx.restore();
}

function drawPeachPickup(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  const bodyGrad = ctx.createRadialGradient(-4, -1, 1, 0, 1, 14);
  bodyGrad.addColorStop(0, "#FFE0B2");
  bodyGrad.addColorStop(0.35, "#FFAB91");
  bodyGrad.addColorStop(0.75, "#FF7043");
  bodyGrad.addColorStop(1, "#D84315");

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 1, 12, 11.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(191,54,12,0.5)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.quadraticCurveTo(1.2, 1, 0, 11);
  ctx.stroke();

  ctx.fillStyle = "rgba(239,83,80,0.3)";
  ctx.beginPath();
  ctx.ellipse(-5.5, 2, 4.5, 5, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.beginPath();
  ctx.ellipse(-3.5, -3, 3.5, 4.2, -0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,183,77,0.35)";
  ctx.beginPath();
  ctx.ellipse(4, 5, 2.5, 2.8, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#6D4C41";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, -15);
  ctx.stroke();

  ctx.fillStyle = "#81C784";
  ctx.beginPath();
  ctx.ellipse(-4, -13.5, 4.5, 2, -0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGrapePickup(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  const berries: Array<[number, number, number]> = [
    [0, -2, 4.9],
    [-5.5, 1, 4.7],
    [5.5, 1, 4.7],
    [-3.5, 6.5, 4.5],
    [3.5, 6.5, 4.5],
    [0, 10.5, 4.1],
    [-6.5, 5.5, 3.8],
    [6.5, 5.5, 3.8],
    [-2.5, 12.5, 3.5],
    [2.5, 12.5, 3.5],
  ];

  for (const [gx, gy, r] of berries) {
    const g = ctx.createRadialGradient(gx - r * 0.35, gy - r * 0.35, 0, gx, gy, r);
    g.addColorStop(0, "#CE93D8");
    g.addColorStop(0.55, "#8E24AA");
    g.addColorStop(1, "#4A148C");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.arc(gx - r * 0.28, gy - r * 0.3, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "#558B2F";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.quadraticCurveTo(-3, -12, -2, -17);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2, -17);
  ctx.quadraticCurveTo(2, -14, 4, -11);
  ctx.stroke();

  ctx.fillStyle = "#689F38";
  ctx.beginPath();
  ctx.ellipse(5, -10, 4, 2, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFlamingOrangePickup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  elapsed: number,
  stackPreview?: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  const t = elapsed * 0.008;

  ctx.shadowColor = "#FF6D00";
  ctx.shadowBlur = 10 + Math.sin(t * 3) * 3;

  const flames: Array<[number, number, number, number]> = [
    [-10, -6, -4, -22],
    [-2, -8, 0, -24],
    [8, -6, 4, -21],
    [-14, 2, -10, -14],
    [12, 2, 10, -13],
  ];

  for (let i = 0; i < flames.length; i++) {
    const [fx, fy, tx, ty] = flames[i];
    const flicker = Math.sin(t * 4 + i * 1.3) * 3;
    const g = ctx.createLinearGradient(fx, fy, tx, ty + flicker);
    g.addColorStop(0, "rgba(255,235,59,0.95)");
    g.addColorStop(0.45, "rgba(255,152,0,0.85)");
    g.addColorStop(1, "rgba(255,87,34,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.quadraticCurveTo(tx + flicker * 0.5, (fy + ty) / 2 + flicker, tx, ty + flicker);
    ctx.quadraticCurveTo(fx * 0.3, (fy + ty) / 2 - 2, fx, fy);
    ctx.fill();
  }

  ctx.shadowBlur = 0;

  const body = ctx.createRadialGradient(-3, -4, 1, 0, 2, 13);
  body.addColorStop(0, "#FFE082");
  body.addColorStop(0.35, "#FFB74D");
  body.addColorStop(0.75, "#FB8C00");
  body.addColorStop(1, "#E65100");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 2, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.ellipse(-4, -1, 3, 4.5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.beginPath();
  ctx.ellipse(4, 5, 2.5, 3.5, 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5D4037";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.quadraticCurveTo(1, -12, 2, -13);
  ctx.stroke();

  ctx.fillStyle = "#66BB6A";
  ctx.beginPath();
  ctx.ellipse(5, -11, 4.5, 2.2, 0.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255,213,79,${0.35 + Math.sin(t * 5) * 0.15})`;
  ctx.beginPath();
  ctx.arc(0, -10, 4 + Math.sin(t * 6) * 1.5, 0, Math.PI * 2);
  ctx.fill();

  if (stackPreview && stackPreview > 1) {
    ctx.fillStyle = "#FF6D00";
    ctx.font = "bold 10px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`x${stackPreview}`, 0, 18);
    ctx.font = "bold 7px Manrope, sans-serif";
    ctx.fillStyle = "#FFB74D";
    ctx.fillText("NITRO", 0, 26);
  }

  ctx.restore();
}

function drawPickup(ctx: CanvasRenderingContext2D, pickup: Pickup, state: GameState): void {
  const { x, y, type } = pickup;
  if (type === "speed") {
    const preview = isNitroActive(state)
      ? Math.min(maxNitroStacks(state), state.nitroStacks + 1)
      : undefined;
    drawFlamingOrangePickup(ctx, x, y, state.elapsed, preview);
    return;
  }
  if (type === "apple") {
    drawApplePickup(ctx, x, y);
  } else if (type === "peach") {
    drawPeachPickup(ctx, x, y);
  } else if (type === "grape") {
    drawGrapePickup(ctx, x, y);
  }
}

function drawFruitEatFx(ctx: CanvasRenderingContext2D, state: GameState): void {
  const fx = state.fruitEatFx;
  if (!fx) return;

  const remain = fx.until - state.elapsed;
  const progress = Math.max(0, Math.min(1, 1 - remain / FRUIT_EAT_FX_MS));
  const bx = birdX(state);
  const by = state.bird.y;
  const gain = NUTRITION_GAIN[fx.fruit] / NUTRITION_THIN_SLOWDOWN;
  const pop = progress < 0.38 ? progress / 0.38 : Math.max(0, 1 - (progress - 0.38) / 0.62);
  const alpha = 1 - progress * 0.92;
  const lift = progress * 28;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(bx + 20, by - 8 - lift);
  const s = 0.5 + pop * 0.55;
  ctx.scale(s, s);
  if (fx.fruit === "apple") drawApplePickup(ctx, 0, 0);
  else if (fx.fruit === "peach") drawPeachPickup(ctx, 0, 0);
  else drawGrapePickup(ctx, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#66BB6A";
  ctx.strokeStyle = "#1B5E20";
  ctx.lineWidth = 2;
  ctx.font = "bold 15px Manrope, sans-serif";
  ctx.textAlign = "center";
  const gainLabel = gain % 1 === 0 ? String(gain) : gain.toFixed(1);
  ctx.strokeText(`+${gainLabel}`, bx + 26, by - 16 - lift);
  ctx.fillText(`+${gainLabel}`, bx + 26, by - 16 - lift);
  ctx.font = "bold 9px Manrope, sans-serif";
  ctx.fillStyle = "#A5D6A7";
  ctx.fillText("nom!", bx + 26, by - 3 - lift);

  ctx.strokeStyle = `rgba(255,235,59,${alpha * 0.7})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(bx + 4, by, 10 + progress * 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBird(ctx: CanvasRenderingContext2D, state: GameState): void {
  const bx = birdX(state);
  const by = state.bird.y;
  const scale = birdScale(state.bird.nutrition);
  const r = 20 * scale;
  const nitro = isNitroActive(state);
  const ghost = isGhostActive(state);
  const absorbing = isBossEnergyAbsorbing(state);
  const bossBoost = isBossEnergyBoostActive(state);
  const tilt = bossBoost || nitro ? -0.12 : Math.max(-0.4, Math.min(0.5, state.bird.vy * 0.04));

  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(tilt);
  if (ghost && !nitro && !bossBoost) ctx.globalAlpha = 0.72 + Math.sin(state.elapsed * 0.014) * 0.08;

  if (bossBoost) {
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 24;
  } else if (absorbing) {
    ctx.shadowColor = "#FF9800";
    ctx.shadowBlur = 16 + Math.sin(state.elapsed * 0.02) * 8;
  } else if (nitro) {
    ctx.shadowColor = "#FF9800";
    ctx.shadowBlur = 18;
  }

  const underwater = !isCityLevel(state.level) && biomeForLevel(state.level) === "underwater";

  const drawOpts = { nitro, ghost, bossBoost, absorbing };

  if (underwater) {
    ctx.fillStyle = bossBoost ? "#FFF59D" : nitro ? "#FFE082" : absorbing ? "#FFECB3" : "#B3E5FC";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.05, r, 0, 0, Math.PI * 2);
    ctx.fill();
    drawDiveSuitBird(ctx, r, state.flapAnim);
    ctx.restore();
    return;
  }

  drawSpeciesBird(ctx, state.birdSpeciesId, r, state.flapAnim, state.elapsed, drawOpts);

  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState, zv: ZoneVisual): void {
  roundRect(ctx, 10, 10, 88, 52, 10);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.stroke();

  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 18px Manrope, sans-serif";
  ctx.fillText(String(state.score), 22, 36);
  ctx.font = "11px Manrope, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText(`Lv ${state.level}`, 22, 50);

  ctx.font = "9px Manrope, sans-serif";
  ctx.fillStyle = "#94a3b8";
  const zoneY = state.height - 14;
  if (zv.inTransition && zv.city && zv.natureWeight < 0.92 && zv.natureWeight > 0.08) {
    ctx.textAlign = "center";
    ctx.globalAlpha = zv.natureWeight;
    ctx.fillText(biomeDisplayName(zv.biome), state.width * 0.5, zoneY - 5);
    ctx.globalAlpha = 1 - zv.natureWeight;
    ctx.fillText(cityDisplayName(zv.city), state.width * 0.5, zoneY + 5);
    ctx.globalAlpha = 1;
  } else if (zv.visualCity && zv.city) {
    ctx.textAlign = "center";
    ctx.fillText(cityDisplayName(zv.city), state.width * 0.5, zoneY);
  } else {
    ctx.textAlign = "left";
    ctx.fillText(biomeDisplayName(zv.biome), 10, zoneY);
  }
  ctx.textAlign = "left";

  const barX = state.width - 118;
  roundRect(ctx, barX, 10, 108, 52, 10);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = "10px Manrope, sans-serif";
  ctx.fillText("nutrition", barX + 10, 24);
  ctx.fillStyle = "#e2e8f0";
  roundRect(ctx, barX + 10, 30, 88, 10, 5);
  ctx.fill();
  const grad = ctx.createLinearGradient(barX, 0, barX + 88, 0);
  grad.addColorStop(0, "#FF7043");
  grad.addColorStop(1, "#66BB6A");
  ctx.fillStyle = grad;
  roundRect(ctx, barX + 10, 30, 88 * (state.bird.nutrition / 100), 10, 5);
  ctx.fill();

  if (isBossEnergyBoostActive(state)) {
    ctx.fillStyle = "#FFD600";
    ctx.font = "bold 10px Manrope, sans-serif";
    ctx.fillText(`x${BOSS_ENERGY_SPEED_MULT} BOSS`, barX + 2, 46);
    ctx.fillStyle = "#FFEA00";
    ctx.fillText("ENERGY", barX + 6, 52);
  } else if (state.elapsed < state.speedBoostUntil) {
    const stacks = Math.max(1, state.nitroStacks);
    ctx.fillStyle = "#FF6D00";
    ctx.font = "bold 10px Manrope, sans-serif";
    ctx.fillText(`x${stacks} ORANGE`, barX + 4, 46);
    ctx.font = "bold 10px Manrope, sans-serif";
    ctx.fillStyle = "#FFB74D";
    ctx.fillText("NITRO", barX + 10, 52);
  } else if (isGhostActive(state)) {
    ctx.fillStyle = "#29B6F6";
    ctx.font = "bold 11px Manrope, sans-serif";
    ctx.fillText("GHOST", barX + 10, 52);
  } else if (canOfferJunkRecovery(state)) {
    ctx.fillStyle = "#F57C00";
    ctx.font = "bold 11px Manrope, sans-serif";
    ctx.fillText("🍔×1", barX + 18, 52);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export type TreeType = "spruce" | "oak" | "pine";

export type JunkType = "candy" | "bacon" | "burger" | "pizza" | "soda";

export type FruitType = "apple" | "peach" | "grape";

export type PickupType = FruitType | "speed";

export type GamePhase = "idle" | "playing" | "gameover" | "victory";

export type HazardKind = "mountain" | "shark";

export type TreeObstacle = {
  x: number;
  type: TreeType;
  height: number;
  passed: boolean;
};

export type JunkObstacle = {
  x: number;
  type: JunkType;
  bottomY: number;
  size: number;
  passed: boolean;
};

export type MountainHazard = {
  kind: "mountain";
  x: number;
  width: number;
  height: number;
};

export type SharkHazard = {
  kind: "shark";
  x: number;
  phaseSeed: number;
};

export type OctopusTentacle = {
  x: number;
  phaseSeed: number;
};

export type BossKind =
  | "boar"
  | "bear"
  | "crocodile"
  | "tiger"
  | "wolf"
  | "lion"
  | "eagle"
  | "snake";

export type AnimalBoss = {
  kind: BossKind;
  x: number;
  width: number;
  height: number;
  /** 0..1 — фаза укуса (рывок головы к птице) */
  bitePhase: number;
  /** elapsed ms до следующей попытки укуса */
  biteCooldown: number;
  /** elapsed ms — момент взрыва после победного удара (пауза для рассмотрения) */
  defeatPendingAt: number | null;
};

/** @deprecated alias */
export type BoarBoss = AnimalBoss;

export type BoarExplosionPart = {
  localX: number;
  localY: number;
  rw: number;
  rh: number;
  flyAngle: number;
  spin: number;
  color: string;
  shape: "ellipse" | "rect" | "corn" | "triangle";
};

export type BossExplosion = {
  cx: number;
  cy: number;
  width: number;
  height: number;
  startElapsed: number;
  parts: BoarExplosionPart[];
  kind: BossKind;
};

/** @deprecated alias */
export type BoarExplosion = BossExplosion;

export type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type Pterodactyl = {
  x: number;
  y: number;
  wingPhase: number;
};

export type Crater = {
  x: number;
  y: number;
  radius: number;
};

export type DebrisKind =
  | "wood"
  | "leaf"
  | "spark"
  | "rock"
  | "crumb"
  | "splash"
  | "gold"
  | "bubble";

export type DebrisParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: DebrisKind;
  rotation: number;
  spin: number;
};

export type Hazard = MountainHazard | SharkHazard;

export type Pickup = {
  x: number;
  y: number;
  type: PickupType;
  collected: boolean;
};

export type FruitEatFx = {
  fruit: FruitType;
  until: number;
};

export type JuicePopup = {
  text: string;
  x: number;
  y: number;
  until: number;
  color: string;
  scale: number;
};

export type JuiceEvent = {
  type: "combo" | "nearMiss" | "levelUp";
  value?: number;
};

export type GhostSample = { t: number; y: number };

export type GhostDuelOpponent = {
  name: string;
  score: number;
  samples: GhostSample[];
};

export type TutorialTipId = "trees" | "junk" | "fruit" | "ghost" | "nitro" | "boss";

export type GameBootOptions = {
  birdBoostActive?: boolean;
  reduceMotion?: boolean;
  metaGhostBonusMs?: number;
  metaGapBonus?: number;
  metaNearMissMult?: number;
  seasonalNutritionMult?: number;
  ghostDuel?: GhostDuelOpponent | null;
};

export type BirdState = {
  y: number;
  vy: number;
  nutrition: number;
};

/** Horizontal runner — ground chunk (Rayman-style auto-run). */
export type PlatformSegment = {
  x: number;
  w: number;
  surfaceY: number;
  /** Left cliff for wall-run */
  wallH?: number;
};

export type RunnerObstacle = {
  x: number;
  w: number;
  h: number;
  kind: "stump" | "vine" | "rock";
  passed: boolean;
};

export type RunnerEnemy = {
  x: number;
  w: number;
  h: number;
  surfaceY: number;
  kind: "beetle" | "junk";
  defeated: boolean;
};

export type RunnerRunMode = "endless" | "stage";

export type GameState = {
  width: number;
  height: number;
  phase: GamePhase;
  /** Unlockable species — affects visuals and passive boosts */
  birdSpeciesId: string;
  bird: BirdState;
  trees: TreeObstacle[];
  junks: JunkObstacle[];
  hazards: Hazard[];
  octopusTentacles: OctopusTentacle[];
  pickups: Pickup[];
  debris: DebrisParticle[];
  meteor: Meteor | null;
  pterodactyl: Pterodactyl | null;
  craters: Crater[];
  score: number;
  level: number;
  fruitsCollected: number;
  speed: number;
  speedBoostUntil: number;
  nitroStacks: number;
  ghostUntil: number;
  elapsed: number;
  nextTreeX: number;
  segmentIndex: number;
  flapAnim: number;
  /** Одноразовое «поправление» от бургера/пиццы на мин. размере */
  junkSalvationUsed: boolean;
  animalBoss: AnimalBoss | null;
  lastBossMilestone: number;
  bossExplosion: BossExplosion | null;
  slowMoUntil: number;
  bossApproachSlowMoUsed: boolean;
  /** elapsed ms — поглощение энергии босса (KABOOM) */
  bossEnergyAbsorbUntil: number;
  /** elapsed ms — x7 ускорение после поглощения */
  bossEnergyBoostUntil: number;
  /** Городская достопримечательность — x в мире, движется вместе с уровнем */
  cityLandmarkX: number | null;
  /** Достопримечательность уже проехала в текущем городском блоке */
  cityLandmarkDone: boolean;
  /** Накопленный сдвиг мира — для параллакса города */
  worldScroll: number;
  /** Момент старта разгона скорости (нитро / буст босса) */
  speedMultRampStart: number;
  /** Короткая анимация поедания фрукта */
  fruitEatFx: FruitEatFx | null;
  /** Тряска экрана (удар, сбор) */
  screenShakeUntil: number;
  screenShakeMag: number;
  /** Вспышка экрана */
  screenFlashUntil: number;
  screenFlashAlpha: number;
  screenFlashColor: string;
  /** Подряд пройденных деревьев без game over */
  comboStreak: number;
  comboBest: number;
  nearMisses: number;
  juicePopups: JuicePopup[];
  juiceEvents: JuiceEvent[];
  /** Meal-log shield hits remaining this run */
  birdBoostHits: number;
  reduceMotion: boolean;
  metaGhostBonusMs: number;
  metaGapBonus: number;
  metaNearMissMult: number;
  seasonalNutritionMult: number;
  ghostDuel: GhostDuelOpponent | null;
  ghostSamples: GhostSample[];
  junkSpawnsEnabled: boolean;
  deathPendingUntil: number;
  paused: boolean;
  nutritionDecayMs: number;
  tutorialShown: TutorialTipId[];
  activeTutorialTip: TutorialTipId | null;
  tutorialTipUntil: number;
  /** Auto-run platforms (NutriBird runner mode) */
  platforms: PlatformSegment[];
  runnerObstacles: RunnerObstacle[];
  gliding: boolean;
  onGround: boolean;
  runnerEnemies: RunnerEnemy[];
  wallRunning: boolean;
  wallX: number;
  attacking: boolean;
  attackUntil: number;
  runnerWorld: number;
  runnerStage: number;
  runMode: RunnerRunMode;
  levelTarget: number;
};

export const TREE_WIDTH: Record<TreeType, number> = {
  spruce: 44,
  oak: 72,
  pine: 56,
};

export const NUTRITION_GAIN: Record<FruitType, number> = {
  apple: 10,
  peach: 8,
  grape: 6,
};

export const GAME_STORAGE_KEY = "nutricrew_bird_best";

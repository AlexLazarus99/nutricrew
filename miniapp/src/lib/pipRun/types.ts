export type GamePhase = "menu" | "playing" | "gameover" | "victory";

export type RunMode = "endless" | "stage";

export type PlatformSegment = {
  x: number;
  w: number;
  surfaceY: number;
  wallH?: number;
};

export type Obstacle = {
  x: number;
  w: number;
  h: number;
  kind: "mushroom" | "root" | "stone";
  passed: boolean;
};

export type Enemy = {
  x: number;
  w: number;
  h: number;
  surfaceY: number;
  kind: "beetle" | "spore";
  defeated: boolean;
};

export type Mote = {
  x: number;
  y: number;
  collected: boolean;
};

export type PipState = {
  y: number;
  vy: number;
};

export type GameState = {
  width: number;
  height: number;
  phase: GamePhase;
  paused: boolean;
  elapsed: number;
  score: number;
  motesCollected: number;
  motesTotal: number;
  runMode: RunMode;
  world: number;
  stage: number;
  isBoss: boolean;
  levelTarget: number;
  scrollX: number;
  speed: number;
  pip: PipState;
  flapAnim: number;
  gliding: boolean;
  glideStart: number;
  onGround: boolean;
  wallRunning: boolean;
  wallX: number;
  attacking: boolean;
  attackUntil: number;
  platforms: PlatformSegment[];
  obstacles: Obstacle[];
  enemies: Enemy[];
  motes: Mote[];
  segIndex: number;
  reduceMotion: boolean;
};

export const STORAGE_BEST = "piprun_best_v1";

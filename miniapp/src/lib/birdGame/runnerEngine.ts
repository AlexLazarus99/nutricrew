/**
 * NutriBird Runner — original auto-run platformer (jump, glide, wall-run, attack).
 * Genre inspired by classic mobile runners; no third-party assets.
 */
import {
  GAME_STORAGE_KEY,
  NUTRITION_GAIN,
  type FruitType,
  type GameBootOptions,
  type GamePhase,
  type GameState,
  type Pickup,
  type PlatformSegment,
  type RunnerEnemy,
  type RunnerObstacle,
  type TreeObstacle,
} from "./types";
import { defaultSessionFields } from "./gameModifiers";
import { emptyJuiceFields } from "./gameJuice";
import { biomeDisplayName, biomePalette } from "./progression";
import { drawBiomeBackdrop, drawBiomeForeground } from "./biomes";
import { drawSpeciesBird, type BirdDrawOpts } from "./birdSprites";
import { sanitizeBiomePalette } from "./colorUtils.js";
import { drawAmbientParticles, drawAtmosphericBloom, drawGodRays } from "./painterly";
import {
  applyStageVictory,
  levelTargetScore,
  stageDifficulty,
  starsForRun,
  worldBiome,
  type RunnerProgress,
} from "./runnerWorlds";

const GRAVITY = 0.4;
const GLIDE_GRAVITY = 0.11;
const WALL_SLIDE = 0.14;
const JUMP_VY = -9;
const WALL_JUMP_VY = -8.5;
const RUN_SPEED = 3.65;
const BIRD_X_RATIO = 0.24;
const BIRD_R = 17;
const GLIDE_MAX_MS = 2400;
const ATTACK_MS = 280;
const ATTACK_RANGE = 58;
const SEGMENT_MIN = 150;
const SEGMENT_MAX = 270;
const GAP_CHANCE = 0.2;
const GAP_MIN = 68;
const GAP_MAX = 115;

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function birdScreenX(state: GameState): number {
  return state.width * BIRD_X_RATIO;
}

function baseGroundY(state: GameState): number {
  return Math.round(state.height * 0.72);
}

function bootFrom(state: GameState): GameBootOptions {
  return {
    birdBoostActive: state.birdBoostHits > 0,
    reduceMotion: state.reduceMotion,
    metaGhostBonusMs: state.metaGhostBonusMs,
    metaGapBonus: state.metaGapBonus,
    metaNearMissMult: state.metaNearMissMult,
    seasonalNutritionMult: state.seasonalNutritionMult,
    ghostDuel: state.ghostDuel,
  };
}

function emptyTrees(): TreeObstacle[] {
  return [];
}

function runnerDefaults(): Pick<
  GameState,
  | "platforms"
  | "runnerObstacles"
  | "runnerEnemies"
  | "gliding"
  | "onGround"
  | "wallRunning"
  | "wallX"
  | "attacking"
  | "attackUntil"
  | "runnerWorld"
  | "runnerStage"
  | "runMode"
  | "levelTarget"
> {
  return {
    platforms: [],
    runnerObstacles: [],
    runnerEnemies: [],
    gliding: false,
    onGround: false,
    wallRunning: false,
    wallX: 0,
    attacking: false,
    attackUntil: 0,
    runnerWorld: 0,
    runnerStage: 1,
    runMode: "endless",
    levelTarget: 0,
  };
}

function seedPlatforms(_width: number, height: number, diff: number): PlatformSegment[] {
  const gy = Math.round(height * 0.72);
  const plats: PlatformSegment[] = [];
  let x = -40;
  for (let i = 0; i < 9; i++) {
    const w = SEGMENT_MIN + hash(i) * (SEGMENT_MAX - SEGMENT_MIN);
    const surfaceY = gy + Math.round((hash(i + 3) - 0.5) * 10);
    const wallH = hash(i + 20) > 0.72 - diff * 0.08 ? 90 + hash(i) * 80 : undefined;
    plats.push({ x, w, surfaceY, wallH });
    x += w;
    if (hash(i + 7) > 1 - GAP_CHANCE - diff * 0.04) {
      x += GAP_MIN + hash(i + 11) * (GAP_MAX - GAP_MIN);
    }
  }
  return plats;
}

function spawnSegment(
  state: GameState,
  fromX: number,
  segIdx: number,
  diff: number,
): { platforms: PlatformSegment[]; obstacles: RunnerObstacle[]; pickups: Pickup[]; enemies: RunnerEnemy[] } {
  const gy = baseGroundY(state);
  const platforms: PlatformSegment[] = [];
  const obstacles: RunnerObstacle[] = [];
  const pickups: Pickup[] = [];
  const enemies: RunnerEnemy[] = [];
  const w = SEGMENT_MIN + hash(segIdx) * (SEGMENT_MAX - SEGMENT_MIN);
  const surfaceY = gy + Math.round((hash(segIdx + 1) - 0.5) * 16);
  const wallH = hash(segIdx + 30) > 0.68 - diff * 0.06 ? 100 + hash(segIdx) * 70 : undefined;
  platforms.push({ x: fromX, w, surfaceY, wallH });

  const roll = hash(segIdx + 5);
  if (roll > 0.48) {
    const kinds = ["stump", "vine", "rock"] as const;
    const kind = kinds[Math.floor(hash(segIdx + 6) * kinds.length)]!;
    obstacles.push({
      x: fromX + w * (0.3 + hash(segIdx + 8) * 0.45),
      w: kind === "vine" ? 28 : 22,
      h: kind === "vine" ? 50 + hash(segIdx) * 28 : 30 + hash(segIdx) * 18,
      kind,
      passed: false,
    });
  } else if (roll > 0.22) {
    const junk = hash(segIdx + 9) > 0.5;
    enemies.push({
      x: fromX + w * (0.4 + hash(segIdx + 10) * 0.35),
      w: 26,
      h: 24,
      surfaceY,
      kind: junk ? "junk" : "beetle",
      defeated: false,
    });
  }

  if (hash(segIdx + 12) > 0.32) {
    const fruits: FruitType[] = ["apple", "peach", "grape"];
    const ft = fruits[Math.floor(hash(segIdx + 13) * fruits.length)]!;
    pickups.push({
      x: fromX + w * (0.2 + hash(segIdx + 14) * 0.55),
      y: surfaceY - 44 - hash(segIdx + 15) * 45,
      type: ft,
      collected: false,
    });
  }

  return { platforms, obstacles, pickups, enemies };
}

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

export function createGame(
  width: number,
  height: number,
  birdSpeciesId = "classic",
  boot: GameBootOptions = {},
): GameState {
  const gy = Math.round(height * 0.72);
  return {
    width,
    height,
    phase: "idle",
    birdSpeciesId,
    bird: { y: gy - BIRD_R - 2, vy: 0, nutrition: 50 },
    trees: emptyTrees(),
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
    speed: RUN_SPEED,
    speedBoostUntil: 0,
    nitroStacks: 0,
    ghostUntil: 0,
    elapsed: 0,
    nextTreeX: width + 100,
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
    ...defaultSessionFields(boot),
    ...runnerDefaults(),
    platforms: seedPlatforms(width, height, 1),
    onGround: true,
  };
}

function beginPlaying(state: GameState, partial: Partial<GameState>): GameState {
  const fresh = createGame(state.width, state.height, state.birdSpeciesId, bootFrom(state));
  return {
    ...fresh,
    ...partial,
    phase: "playing",
    bird: { ...fresh.bird, vy: JUMP_VY * 0.25 },
    flapAnim: 1,
    onGround: false,
    ...emptyJuiceFields(),
  };
}

export function returnToIdle(state: GameState): GameState {
  const fresh = createGame(state.width, state.height, state.birdSpeciesId, bootFrom(state));
  return { ...fresh, phase: "idle" };
}

export function startEndless(state: GameState): GameState {
  return beginPlaying(state, {
    runMode: "endless",
    levelTarget: 0,
    runnerWorld: 0,
    runnerStage: 1,
    platforms: seedPlatforms(state.width, state.height, 1),
  });
}

export function startStage(state: GameState, world: number, stage: number): GameState {
  const diff = stageDifficulty(world, stage);
  return beginPlaying(state, {
    runMode: "stage",
    runnerWorld: world,
    runnerStage: stage,
    levelTarget: levelTargetScore(world, stage),
    level: stage,
    platforms: seedPlatforms(state.width, state.height, diff),
  });
}

function enemyAhead(state: GameState): RunnerEnemy | null {
  const bx = birdScreenX(state);
  for (const e of state.runnerEnemies) {
    if (e.defeated) continue;
    if (e.x > bx - 10 && e.x < bx + ATTACK_RANGE && Math.abs(e.surfaceY - (state.bird.y + BIRD_R)) < 36) {
      return e;
    }
  }
  return null;
}

function tryAttack(state: GameState): GameState {
  const now = state.elapsed;
  const bx = birdScreenX(state);
  let enemies = state.runnerEnemies;
  let score = state.score;
  let hit = false;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (e.defeated) continue;
    const inRange =
      Math.abs(e.x + e.w * 0.5 - (bx + BIRD_R * 0.5)) < ATTACK_RANGE + e.w * 0.5 &&
      Math.abs(e.surfaceY - (state.bird.y + BIRD_R)) < 42;
    if (inRange) {
      hit = true;
      score += e.kind === "junk" ? 25 : 15;
      enemies = enemies.map((en, idx) => (idx === i ? { ...en, defeated: true } : en));
    }
  }

  return {
    ...state,
    runnerEnemies: enemies,
    attacking: true,
    attackUntil: now + ATTACK_MS,
    flapAnim: 1,
    score: hit ? score : state.score,
    screenShakeMag: hit ? 4 : state.screenShakeMag,
    screenShakeUntil: hit ? now + 180 : state.screenShakeUntil,
  };
}

export function flap(state: GameState): GameState {
  if (state.phase === "victory") return state;
  if (state.phase === "idle" || state.phase === "gameover") {
    return startEndless(state);
  }
  if (state.phase !== "playing") return state;

  if (state.wallRunning) {
    return {
      ...state,
      wallRunning: false,
      bird: { ...state.bird, vy: WALL_JUMP_VY, y: state.bird.y - 4 },
      flapAnim: 1,
      gliding: false,
    };
  }

  if (state.onGround && enemyAhead(state)) {
    return tryAttack(state);
  }

  if (state.onGround) {
    return {
      ...state,
      bird: { ...state.bird, vy: JUMP_VY },
      flapAnim: 1,
      gliding: false,
      onGround: false,
    };
  }

  if (!state.gliding && state.bird.vy > -1.5) {
    return { ...state, gliding: true, flapAnim: 0.5, speedMultRampStart: state.elapsed };
  }

  if (state.gliding) {
    return { ...state, gliding: false, bird: { ...state.bird, vy: Math.max(state.bird.vy, 2.2) } };
  }

  return tryAttack(state);
}

function collideObstacle(state: GameState, y: number): boolean {
  const bx = birdScreenX(state);
  const bodyTop = y - BIRD_R;
  const bodyBot = y + BIRD_R;
  for (const o of state.runnerObstacles) {
    if (bx + BIRD_R * 0.4 < o.x || bx - BIRD_R * 0.4 > o.x + o.w) continue;
    const top = baseGroundY(state) - o.h;
    if (bodyBot > top + 6 && bodyTop < baseGroundY(state)) return true;
  }
  for (const e of state.runnerEnemies) {
    if (e.defeated || state.attacking) continue;
    if (bx + BIRD_R * 0.35 < e.x || bx - BIRD_R * 0.35 > e.x + e.w) continue;
    if (bodyBot > e.surfaceY - e.h && bodyTop < e.surfaceY) return true;
  }
  return false;
}

function scrollWorld(state: GameState, move: number): GameState {
  const scroll = <T extends { x: number }>(arr: T[]) =>
    arr.map((o) => ({ ...o, x: o.x - move })).filter((o) => o.x > -80);

  let platforms = scroll(state.platforms);
  let runnerObstacles = scroll(state.runnerObstacles);
  let runnerEnemies = scroll(state.runnerEnemies);
  let pickups = state.pickups
    .map((p) => ({ ...p, x: p.x - move }))
    .filter((p) => p.x > -30);

  let segmentIndex = state.segmentIndex;
  const diff =
    state.runMode === "stage"
      ? stageDifficulty(state.runnerWorld, state.runnerStage)
      : 1 + state.score * 0.0004;

  const rightEdge = platforms.reduce((m, p) => Math.max(m, p.x + p.w), 0);
  if (rightEdge < state.width + 130) {
    const gap = hash(segmentIndex + state.score) > 1 - GAP_CHANCE - diff * 0.03;
    const spawnX = rightEdge + (gap ? GAP_MIN + hash(segmentIndex) * 36 : 0);
    const spawned = spawnSegment(state, spawnX, segmentIndex, diff);
    platforms = [...platforms, ...spawned.platforms];
    runnerObstacles = [...runnerObstacles, ...spawned.obstacles];
    runnerEnemies = [...runnerEnemies, ...spawned.enemies];
    pickups = [...pickups, ...spawned.pickups];
    segmentIndex += 1;
  }

  return {
    ...state,
    platforms,
    runnerObstacles,
    runnerEnemies,
    pickups,
    segmentIndex,
    worldScroll: state.worldScroll + move,
    wallX: state.wallRunning ? state.wallX - move : state.wallX,
  };
}

function tryWallLatch(state: GameState, y: number, vy: number): { wall: boolean; wallX: number; y: number; vy: number } {
  if (state.onGround || state.gliding) return { wall: false, wallX: 0, y, vy };
  const bx = birdScreenX(state);
  for (const p of state.platforms) {
    if (!p.wallH || p.wallH < 50) continue;
    const wallX = p.x;
    const nearWall = bx + BIRD_R > wallX - 8 && bx - BIRD_R < wallX + 22;
    const onWallHeight = y > p.surfaceY - p.wallH && y < p.surfaceY + 10;
    if (nearWall && onWallHeight && vy >= -1) {
      return { wall: true, wallX, y: Math.min(y + 2, p.surfaceY - BIRD_R), vy: WALL_SLIDE };
    }
  }
  return { wall: false, wallX: 0, y, vy };
}

export function tick(state: GameState, dtMs: number): GameState {
  if (state.phase !== "playing" || state.paused) {
    return { ...state, elapsed: state.elapsed + dtMs, flapAnim: Math.max(0, state.flapAnim - dtMs * 0.012) };
  }

  const dt = dtMs / 16.67;
  const diff =
    state.runMode === "stage"
      ? stageDifficulty(state.runnerWorld, state.runnerStage)
      : 1 + state.score * 0.0004;
  const speed = state.speed + Math.min(2.4, state.score * 0.0007) + diff * 0.35;
  let next: GameState = { ...state, elapsed: state.elapsed + dtMs };
  next = scrollWorld(next, speed * dt);
  next = { ...next, score: next.score + Math.round(speed * dt * 0.42) };

  const attacking = next.elapsed < next.attackUntil;
  let wallRunning = next.wallRunning;
  let wallX = next.wallX;
  let gliding = next.gliding && !wallRunning;
  let vy = next.bird.vy;
  let y = next.bird.y;

  if (wallRunning) {
    vy = WALL_SLIDE;
    y += vy * dt;
    const bx = birdScreenX(next);
    y = Math.max(y, 40);
    if (bx > wallX + 30 || y > next.height * 0.85) wallRunning = false;
  } else {
    const grav = gliding ? GLIDE_GRAVITY : GRAVITY;
    if (gliding && next.elapsed - next.speedMultRampStart > GLIDE_MAX_MS) gliding = false;
    vy += grav * dt;
    y += vy * dt;
    const latch = tryWallLatch(next, y, vy);
    if (latch.wall) {
      wallRunning = true;
      wallX = latch.wallX;
      y = latch.y;
      vy = latch.vy;
      gliding = false;
    }
  }

  let onGround = false;
  if (!wallRunning) {
    const bx = birdScreenX(next);
    const feet = y + BIRD_R;
    for (const p of next.platforms) {
      if (bx >= p.x + 2 && bx <= p.x + p.w - 2 && vy >= 0 && feet >= p.surfaceY - 8 && feet <= p.surfaceY + 14) {
        y = p.surfaceY - BIRD_R;
        vy = 0;
        onGround = true;
        gliding = false;
        break;
      }
    }
  }

  const bx = birdScreenX(next);
  let fruitsCollected = next.fruitsCollected;
  let nutrition = next.bird.nutrition;
  const pickups = next.pickups.map((p) => {
    if (p.collected) return p;
    const dx = p.x - bx;
    const dy = p.y - y;
    if (dx * dx + dy * dy < (BIRD_R + 16) ** 2) {
      if (p.type === "apple" || p.type === "peach" || p.type === "grape") {
        fruitsCollected += 1;
        nutrition = Math.min(100, nutrition + NUTRITION_GAIN[p.type]);
      }
      return { ...p, collected: true };
    }
    return p;
  });

  const level =
    state.runMode === "stage" ? state.runnerStage : 1 + Math.floor(next.score / 400);

  let phase: GamePhase = next.phase;
  if (y > next.height + 50 || (!attacking && collideObstacle(next, y))) {
    phase = "gameover";
  } else if (state.runMode === "stage" && next.score >= state.levelTarget) {
    phase = "victory";
  }

  const flapAnim = Math.max(0, next.flapAnim - dtMs * 0.014);

  let ghostSamples = next.ghostSamples;
  if (phase === "playing" && next.elapsed % 220 < dtMs) {
    const samples = [...ghostSamples, { t: next.elapsed, y }];
    ghostSamples = samples.length > 90 ? samples.slice(-90) : samples;
  }

  return {
    ...next,
    phase,
    level,
    pickups,
    fruitsCollected,
    gliding,
    onGround,
    wallRunning,
    wallX,
    attacking,
    attackUntil: attacking ? next.attackUntil : 0,
    flapAnim,
    ghostSamples,
    bird: { y, vy, nutrition },
  };
}

export function victoryStars(state: GameState): 1 | 2 | 3 {
  return starsForRun(state.score, state.levelTarget, state.fruitsCollected);
}

export function applyVictoryProgress(state: GameState, progress: RunnerProgress): RunnerProgress {
  if (state.runMode !== "stage") return progress;
  return applyStageVictory(progress, state.runnerWorld, state.runnerStage, victoryStars(state));
}

function drawSky(ctx: CanvasRenderingContext2D, state: GameState): void {
  const biome =
    state.runMode === "stage" ? worldBiome(state.runnerWorld) : worldBiome(Math.min(4, Math.floor(state.score / 800)));
  const pal = sanitizeBiomePalette(biomePalette(biome));
  const g = ctx.createLinearGradient(0, 0, 0, state.height);
  g.addColorStop(0, pal.skyTop);
  g.addColorStop(0.55, pal.skyMid);
  g.addColorStop(1, pal.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawPlatforms(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  pal: ReturnType<typeof sanitizeBiomePalette>,
): void {
  for (const p of state.platforms) {
    const top = p.surfaceY;
    const landG = ctx.createLinearGradient(0, top, 0, state.height);
    landG.addColorStop(0, pal.landTop);
    landG.addColorStop(0.35, pal.landMid);
    landG.addColorStop(0.7, pal.landBot);
    landG.addColorStop(1, pal.landSoil);
    ctx.fillStyle = landG;
    ctx.beginPath();
    ctx.moveTo(p.x, top + 6);
    ctx.quadraticCurveTo(p.x + p.w * 0.25, top - 4, p.x + p.w * 0.5, top);
    ctx.quadraticCurveTo(p.x + p.w * 0.75, top + 3, p.x + p.w, top + 5);
    ctx.lineTo(p.x + p.w, state.height);
    ctx.lineTo(p.x, state.height);
    ctx.closePath();
    ctx.fill();

    if (p.wallH && p.wallH > 40) {
      const wg = ctx.createLinearGradient(p.x, top - p.wallH, p.x + 24, top);
      wg.addColorStop(0, pal.landBot);
      wg.addColorStop(1, pal.landMid);
      ctx.fillStyle = wg;
      ctx.fillRect(p.x - 2, top - p.wallH, 20, p.wallH);
      ctx.fillStyle = "rgba(129,199,132,0.35)";
      ctx.fillRect(p.x, top - p.wallH * 0.4, 8, p.wallH * 0.25);
    }
  }
}

function drawRunnerObstacle(ctx: CanvasRenderingContext2D, o: RunnerObstacle, groundY: number): void {
  const base = groundY;
  if (o.kind === "stump") {
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(o.x, base - o.h, o.w, o.h);
  } else if (o.kind === "vine") {
    ctx.strokeStyle = "#388E3C";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(o.x + o.w * 0.5, base - o.h);
    ctx.quadraticCurveTo(o.x, base - o.h * 0.5, o.x + o.w, base - 18);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#78909C";
    ctx.beginPath();
    ctx.moveTo(o.x, base);
    ctx.lineTo(o.x + o.w * 0.5, base - o.h);
    ctx.lineTo(o.x + o.w, base);
    ctx.fill();
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: RunnerEnemy): void {
  if (e.defeated) return;
  const y = e.surfaceY - e.h;
  if (e.kind === "junk") {
    ctx.fillStyle = "#E65100";
    ctx.beginPath();
    ctx.roundRect(e.x, y, e.w, e.h, 6);
    ctx.fill();
    ctx.fillStyle = "#FFCC80";
    ctx.fillRect(e.x + 4, y + 4, e.w - 8, 6);
  } else {
    ctx.fillStyle = "#7B1FA2";
    ctx.beginPath();
    ctx.ellipse(e.x + e.w * 0.5, y + e.h * 0.55, e.w * 0.5, e.h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(e.x + e.w * 0.35, y + e.h * 0.45, 3, 0, Math.PI * 2);
    ctx.arc(e.x + e.w * 0.65, y + e.h * 0.45, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPickup(ctx: CanvasRenderingContext2D, p: Pickup): void {
  if (p.collected) return;
  const colors: Record<string, string> = { apple: "#E53935", peach: "#FFAB91", grape: "#7E57C2", speed: "#FFD54F" };
  ctx.fillStyle = colors[p.type] ?? "#FFD54F";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState): void {
  const biome =
    state.runMode === "stage" ? worldBiome(state.runnerWorld) : worldBiome(Math.min(4, Math.floor(state.score / 800)));
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(10, 10, 100, 48);
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 17px Manrope, sans-serif";
  ctx.fillText(String(state.score), 20, 34);
  ctx.font = "10px Manrope, sans-serif";
  ctx.fillStyle = "#64748b";
  if (state.runMode === "stage") {
    ctx.fillText(`W${state.runnerWorld + 1}-${state.runnerStage}`, 20, 48);
    const pct = Math.min(1, state.score / Math.max(1, state.levelTarget));
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(20, 52, 80 * pct, 3);
    ctx.fillStyle = "#64748b";
    ctx.fillText(`${state.score}/${state.levelTarget}`, 20, 62);
  } else {
    ctx.fillText(`Lv ${state.level}`, 20, 48);
  }
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(biomeDisplayName(biome), 10, state.height - 12);

  const tags: string[] = [];
  if (state.gliding) tags.push("GLIDE");
  if (state.wallRunning) tags.push("WALL");
  if (state.attacking) tags.push("HIT");
  if (tags.length) {
    ctx.fillStyle = "rgba(129,199,132,0.9)";
    ctx.font = "bold 10px Manrope, sans-serif";
    ctx.fillText(tags.join(" · "), state.width - 90, 24);
  }
}

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.width < 2 || state.height < 2) return;
  ctx.clearRect(0, 0, state.width, state.height);

  const biome =
    state.runMode === "stage" ? worldBiome(state.runnerWorld) : worldBiome(Math.min(4, Math.floor(state.score / 800)));
  const pal = sanitizeBiomePalette(biomePalette(biome));
  const groundY = baseGroundY(state);

  drawSky(ctx, state);
  try {
    drawGodRays(ctx, state.width, state.height, state.elapsed, 0, groundY);
  } catch {
    /* optional */
  }

  const biomeCtx = {
    width: state.width,
    height: state.height,
    elapsed: state.elapsed,
    worldScroll: state.worldScroll,
    groundY,
    floorY: groundY,
    treeGroundY: groundY,
    night: 0,
  };
  drawBiomeBackdrop(ctx, biome, biomeCtx);
  try {
    drawAmbientParticles(ctx, state.width, groundY, state.elapsed, 0);
  } catch {
    /* optional */
  }

  drawPlatforms(ctx, state, pal);
  for (const o of state.runnerObstacles) drawRunnerObstacle(ctx, o, groundY);
  for (const e of state.runnerEnemies) drawEnemy(ctx, e);
  for (const p of state.pickups) drawPickup(ctx, p);
  drawBiomeForeground(ctx, biome, biomeCtx);

  const bx = birdScreenX(state);
  const opts: BirdDrawOpts = {
    nitro: false,
    ghost: state.elapsed < state.ghostUntil,
    bossBoost: false,
    absorbing: false,
    gliding: state.gliding,
    attacking: state.attacking,
    wallRunning: state.wallRunning,
  };
  ctx.save();
  ctx.translate(bx, state.bird.y);
  const tilt = state.wallRunning ? 0.2 : state.gliding ? 0.08 : Math.max(-0.35, Math.min(0.4, state.bird.vy * 0.04));
  ctx.rotate(tilt);
  drawSpeciesBird(ctx, state.birdSpeciesId, BIRD_R, state.flapAnim, state.elapsed, opts);
  ctx.restore();

  try {
    drawAtmosphericBloom(ctx, state.width, state.height, 0);
  } catch {
    ctx.globalCompositeOperation = "source-over";
  }

  drawHud(ctx, state);

  if (state.phase === "idle" || state.phase === "victory") {
    ctx.fillStyle = "rgba(15,23,42,0.22)";
    ctx.fillRect(0, 0, state.width, state.height);
  }
}

import {
  isBossStage,
  levelTarget,
  moteGoal,
  PIP_WORLDS,
  stageDifficulty,
} from "./worlds";
import {
  drawBackdrop,
  drawEnemy,
  drawHud,
  drawMote,
  drawObstacle,
  drawPip,
  drawPlatforms,
  worldTheme,
} from "./render";
import type { Enemy, GameState, Mote, Obstacle, PlatformSegment } from "./types";
import { STORAGE_BEST } from "./types";

const GRAVITY = 0.42;
const GLIDE_GRAVITY = 0.1;
const WALL_SLIDE = 0.12;
const JUMP_VY = -9.2;
const WALL_JUMP_VY = -8.8;
const RUN_SPEED = 3.8;
const PIP_X_RATIO = 0.26;
const PIP_R = 16;
const GLIDE_MAX_MS = 2600;
const ATTACK_MS = 260;
const ATTACK_RANGE = 56;
const SEG_MIN = 145;
const SEG_MAX = 265;
const GAP_CHANCE = 0.22;

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function pipX(state: GameState): number {
  return state.width * PIP_X_RATIO;
}

function groundY(state: GameState): number {
  return Math.round(state.height * 0.72);
}

function seedPlatforms(height: number, diff: number, seed: number): PlatformSegment[] {
  const gy = Math.round(height * 0.72);
  const plats: PlatformSegment[] = [];
  let x = -40;
  for (let i = 0; i < 10; i++) {
    const idx = seed * 100 + i;
    const w = SEG_MIN + hash(idx) * (SEG_MAX - SEG_MIN);
    const surfaceY = gy + Math.round((hash(idx + 3) - 0.5) * 12);
    const wallH = hash(idx + 20) > 0.7 - diff * 0.07 ? 85 + hash(idx) * 75 : undefined;
    plats.push({ x, w, surfaceY, wallH });
    x += w;
    if (hash(idx + 7) > 1 - GAP_CHANCE - diff * 0.05) {
      x += 65 + hash(idx + 11) * 55;
    }
  }
  return plats;
}

function spawnChunk(
  state: GameState,
  fromX: number,
  segIdx: number,
  diff: number,
): {
  platforms: PlatformSegment[];
  obstacles: Obstacle[];
  motes: Mote[];
  enemies: Enemy[];
} {
  const gy = groundY(state);
  const platforms: PlatformSegment[] = [];
  const obstacles: Obstacle[] = [];
  const motes: Mote[] = [];
  const enemies: Enemy[] = [];
  const w = SEG_MIN + hash(segIdx) * (SEG_MAX - SEG_MIN);
  const surfaceY = gy + Math.round((hash(segIdx + 1) - 0.5) * 18);
  const wallH = hash(segIdx + 30) > 0.65 - diff * 0.06 ? 95 + hash(segIdx) * 65 : undefined;
  platforms.push({ x: fromX, w, surfaceY, wallH });

  if (hash(segIdx + 5) > 0.45) {
    const kinds = ["mushroom", "root", "stone"] as const;
    obstacles.push({
      x: fromX + w * 0.35,
      w: 28 + hash(segIdx) * 16,
      h: 24 + hash(segIdx + 2) * 20,
      kind: kinds[Math.floor(hash(segIdx + 6) * kinds.length)]!,
      passed: false,
    });
  }

  if (hash(segIdx + 9) > 0.55) {
    motes.push({
      x: fromX + w * 0.5,
      y: surfaceY - 35 - hash(segIdx + 10) * 40,
      collected: false,
    });
  }
  if (hash(segIdx + 12) > 0.7) {
    motes.push({ x: fromX + w * 0.75, y: surfaceY - 55, collected: false });
  }

  if (hash(segIdx + 15) > 0.62 - diff * 0.05) {
    enemies.push({
      x: fromX + w * 0.6,
      w: 30,
      h: 22,
      surfaceY,
      kind: hash(segIdx) > 0.5 ? "beetle" : "spore",
      defeated: false,
    });
  }

  return { platforms, obstacles, motes, enemies };
}

export function loadBestScore(): number {
  try {
    return Number(localStorage.getItem(STORAGE_BEST)) || 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(STORAGE_BEST, String(score));
  } catch {
    /* ignore */
  }
}

export function createGame(width: number, height: number, reduceMotion = false): GameState {
  const gy = groundY({ width, height } as GameState);
  return {
    width,
    height,
    phase: "menu",
    paused: false,
    elapsed: 0,
    score: 0,
    motesCollected: 0,
    motesTotal: 0,
    runMode: "endless",
    world: 0,
    stage: 1,
    isBoss: false,
    levelTarget: 0,
    scrollX: 0,
    speed: RUN_SPEED,
    pip: { y: gy - PIP_R * 2, vy: 0 },
    flapAnim: 0,
    gliding: false,
    glideStart: 0,
    onGround: true,
    wallRunning: false,
    wallX: 0,
    attacking: false,
    attackUntil: 0,
    platforms: seedPlatforms(height, 1, 0),
    obstacles: [],
    enemies: [],
    motes: [],
    segIndex: 10,
    reduceMotion,
  };
}

function beginRun(state: GameState, partial: Partial<GameState>): GameState {
  const gy = groundY(state);
  const seed = state.world * 100 + state.stage;
  const diff = stageDifficulty(state.world, state.stage);
  return {
    ...state,
    ...partial,
    phase: "playing",
    paused: false,
    elapsed: 0,
    score: 0,
    motesCollected: 0,
    scrollX: 0,
    pip: { y: gy - PIP_R * 2, vy: JUMP_VY * 0.2 },
    flapAnim: 1,
    gliding: false,
    onGround: false,
    wallRunning: false,
    attacking: false,
    platforms: seedPlatforms(state.height, diff, seed),
    obstacles: [],
    enemies: [],
    motes: [],
    segIndex: 10,
  };
}

export function startEndless(state: GameState): GameState {
  return beginRun(state, {
    runMode: "endless",
    world: 0,
    stage: 1,
    isBoss: false,
    levelTarget: 0,
    motesTotal: 0,
    speed: RUN_SPEED,
  });
}

export function startStage(state: GameState, world: number, stage: number): GameState {
  const boss = isBossStage(world, stage);
  const motes = moteGoal(world, stage);
  return beginRun(state, {
    runMode: "stage",
    world,
    stage,
    isBoss: boss,
    levelTarget: levelTarget(world, stage, boss),
    motesTotal: motes,
    speed: RUN_SPEED + world * 0.08 + (boss ? 0.4 : 0),
  });
}

function surfaceAt(state: GameState, x: number): { y: number; wallX: number; wallH?: number } | null {
  const wx = state.scrollX + x;
  for (const p of state.platforms) {
    if (wx >= p.x && wx <= p.x + p.w) {
      return { y: p.surfaceY, wallX: p.x + p.w, wallH: p.wallH };
    }
  }
  return null;
}

function enemyNear(state: GameState): Enemy | null {
  const px = pipX(state);
  for (const e of state.enemies) {
    if (e.defeated) continue;
    if (e.x > state.scrollX + px - 20 && e.x < state.scrollX + px + ATTACK_RANGE) {
      if (Math.abs(e.surfaceY - (state.pip.y + PIP_R)) < 38) return e;
    }
  }
  return null;
}

function tryAttack(state: GameState): GameState {
  const px = pipX(state);
  const wx = state.scrollX + px;
  let enemies = state.enemies;
  let score = state.score;
  let hit = false;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (e.defeated) continue;
    if (
      Math.abs(e.x + e.w * 0.5 - wx) < ATTACK_RANGE + e.w * 0.5 &&
      Math.abs(e.surfaceY - (state.pip.y + PIP_R)) < 40
    ) {
      hit = true;
      score += e.kind === "beetle" ? 20 : 12;
      enemies = enemies.map((en, idx) => (idx === i ? { ...en, defeated: true } : en));
    }
  }
  return {
    ...state,
    enemies,
    score: hit ? score : state.score,
    attacking: true,
    attackUntil: state.elapsed + ATTACK_MS,
    flapAnim: 1,
  };
}

export function onTap(state: GameState): GameState {
  if (state.phase === "menu" || state.phase === "gameover" || state.phase === "victory") {
    return startEndless(state);
  }
  if (state.phase !== "playing" || state.paused) return state;

  if (state.wallRunning) {
    return {
      ...state,
      wallRunning: false,
      pip: { ...state.pip, vy: WALL_JUMP_VY, y: state.pip.y - 4 },
      gliding: false,
      flapAnim: 1,
    };
  }

  if (state.onGround && enemyNear(state)) return tryAttack(state);

  if (state.onGround) {
    return {
      ...state,
      pip: { ...state.pip, vy: JUMP_VY },
      onGround: false,
      gliding: false,
      flapAnim: 1,
    };
  }

  if (!state.gliding && state.pip.vy > -1.5) {
    return { ...state, gliding: true, glideStart: state.elapsed, flapAnim: 0.5 };
  }

  if (state.gliding) {
    return { ...state, gliding: false, pip: { ...state.pip, vy: Math.max(state.pip.vy, 2) } };
  }

  return tryAttack(state);
}

function collide(state: GameState, y: number): boolean {
  const px = pipX(state);
  const foot = y + PIP_R * 2;
  const surf = surfaceAt(state, px);
  if (surf && foot >= surf.y - 4 && foot <= surf.y + 12 && state.pip.vy >= 0) return false;

  for (const o of state.obstacles) {
    const ox = o.x - state.scrollX;
    if (ox + o.w < px - PIP_R || ox > px + PIP_R) continue;
    const oy = (surf?.y ?? groundY(state)) - o.h;
    if (y + PIP_R * 2 > oy + 4 && y < oy + o.h) return true;
  }

  for (const e of state.enemies) {
    if (e.defeated) continue;
    const ex = e.x - state.scrollX;
    if (ex + e.w < px - PIP_R || ex > px + PIP_R) continue;
    const ey = e.surfaceY - e.h;
    if (y + PIP_R * 2 > ey + 2 && y < e.surfaceY) return true;
  }

  if (!surf && foot > groundY(state) + 40) return true;
  return false;
}

export function tick(state: GameState, dtMs: number): GameState {
  if (state.phase !== "playing" || state.paused) return state;

  const dt = dtMs / 16.67;
  let next: GameState = {
    ...state,
    elapsed: state.elapsed + dtMs,
    flapAnim: Math.max(0, state.flapAnim - dt * 0.08),
    attacking: state.elapsed < state.attackUntil,
  };

  const move = next.speed * dt;
  next = { ...next, scrollX: next.scrollX + move, score: next.score + Math.floor(move * 0.35) };

  let { y, vy } = next.pip;
  const px = pipX(next);
  const surf = surfaceAt(next, px);

  if (next.wallRunning) {
    vy = WALL_SLIDE;
    if (!surf?.wallH) next = { ...next, wallRunning: false };
  } else {
    vy += (next.gliding ? GLIDE_GRAVITY : GRAVITY) * dt;
    if (next.gliding && next.elapsed - next.glideStart > GLIDE_MAX_MS) {
      next = { ...next, gliding: false };
    }
  }

  y += vy * dt;

  let onGround = false;
  let wallRunning = next.wallRunning;
  let wallX = next.wallX;

  if (surf) {
    const foot = y + PIP_R * 2;
    if (foot >= surf.y - 2 && vy >= 0) {
      y = surf.y - PIP_R * 2;
      vy = 0;
      onGround = true;
      next = { ...next, gliding: false };
    }
    if (
      surf.wallH &&
      !onGround &&
      foot > surf.y - surf.wallH &&
      px + PIP_R > surf.wallX - state.scrollX - 16
    ) {
      wallRunning = true;
      wallX = surf.wallX;
      y = Math.min(y, surf.y - PIP_R);
      vy = WALL_SLIDE;
    }
  } else {
    onGround = false;
    wallRunning = false;
  }

  next = { ...next, pip: { y, vy }, onGround, wallRunning, wallX };

  if (collide(next, y)) {
    return { ...next, phase: "gameover" };
  }

  let motesCollected = next.motesCollected;
  const motes = next.motes.map((m) => {
    if (m.collected) return m;
    const dx = m.x - next.scrollX - px;
    const dy = m.y - y;
    if (dx * dx + dy * dy < (PIP_R + 14) ** 2) {
      motesCollected += 1;
      return { ...m, collected: true };
    }
    return m;
  });
  next = { ...next, motes, motesCollected };

  const last = next.platforms[next.platforms.length - 1];
  if (last && last.x + last.w < next.scrollX + next.width + 200) {
    const diff = next.runMode === "stage" ? stageDifficulty(next.world, next.stage) : 1 + next.score / 2000;
    const chunk = spawnChunk(next, last.x + last.w + (hash(next.segIndex) > 0.75 ? 70 : 0), next.segIndex, diff);
    next = {
      ...next,
      segIndex: next.segIndex + 1,
      platforms: [...next.platforms, ...chunk.platforms],
      obstacles: [...next.obstacles, ...chunk.obstacles],
      motes: [...next.motes, ...chunk.motes],
      enemies: [...next.enemies, ...chunk.enemies],
    };
  }

  const cullBefore = next.scrollX - 120;
  next = {
    ...next,
    platforms: next.platforms.filter((p) => p.x + p.w > cullBefore),
    obstacles: next.obstacles.filter((o) => o.x > cullBefore),
    motes: next.motes.filter((m) => m.x > cullBefore || m.collected),
    enemies: next.enemies.filter((e) => e.x > cullBefore || e.defeated),
  };

  if (next.runMode === "stage" && next.score >= next.levelTarget) {
    return { ...next, phase: "victory" };
  }

  return next;
}

export function returnToMenu(state: GameState): GameState {
  return { ...createGame(state.width, state.height, state.reduceMotion), phase: "menu" };
}

export function victoryStars(state: GameState): 1 | 2 | 3 {
  const goal = state.motesTotal || moteGoal(state.world, state.stage);
  if (state.score < state.levelTarget) return 1;
  if (state.motesCollected >= goal && state.score >= state.levelTarget * 1.2) return 3;
  if (state.motesCollected >= goal || state.score >= state.levelTarget * 1.15) return 2;
  return 1;
}

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.width < 2 || state.height < 2) return;
  ctx.clearRect(0, 0, state.width, state.height);

  const theme =
    state.runMode === "stage"
      ? worldTheme(state.world)
      : worldTheme(Math.min(PIP_WORLDS.length - 1, Math.floor(state.score / 1500)));

  drawBackdrop(ctx, state, theme);
  drawPlatforms(ctx, state, theme);
  for (const o of state.obstacles) drawObstacle(ctx, o, state.scrollX, groundY(state));
  for (const e of state.enemies) drawEnemy(ctx, e, state.scrollX);
  for (const m of state.motes) drawMote(ctx, m, state.scrollX, state.elapsed);

  drawPip(ctx, pipX(state), state.pip.y, PIP_R, {
    gliding: state.gliding,
    attacking: state.attacking,
    wallRunning: state.wallRunning,
    flapAnim: state.flapAnim,
  });

  drawHud(ctx, state, theme);

  if (state.phase === "menu" || state.phase === "victory") {
    ctx.fillStyle = "rgba(15,23,42,0.2)";
    ctx.fillRect(0, 0, state.width, state.height);
  }
}

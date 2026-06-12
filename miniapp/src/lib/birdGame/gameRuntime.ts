import { computeElevation, elevationDisplayName, elevationHudKey } from "./elevationZones";
import { zoneHudForLevel } from "./gameHud";
import { isCityLevel } from "./progression";
import { TREE_WIDTH, type GameState, type Hazard, type JunkObstacle, type Pickup, type TreeObstacle } from "./types";
import type { DebrisParticle } from "./types";
import type { OctopusTentacle } from "./types";

/** In-place scroll + cull — avoids .map/.filter allocations each frame. */
export function scrollTrees(trees: TreeObstacle[], move: number): void {
  let w = 0;
  for (let i = 0; i < trees.length; i++) {
    const t = trees[i];
    t.x -= move;
    if (t.x + TREE_WIDTH[t.type] > -30) {
      if (w !== i) trees[w] = t;
      w++;
    }
  }
  trees.length = w;
}

export function scrollJunks(junks: JunkObstacle[], move: number): void {
  let w = 0;
  for (let i = 0; i < junks.length; i++) {
    const j = junks[i];
    j.x -= move;
    if (j.x + j.size > -30) {
      if (w !== i) junks[w] = j;
      w++;
    }
  }
  junks.length = w;
}

export function scrollHazards(hazards: Hazard[], move: number): void {
  let w = 0;
  for (let i = 0; i < hazards.length; i++) {
    const h = hazards[i];
    h.x -= move;
    const keep =
      h.kind === "mountain" ? h.x + h.width > -40 : h.x + 100 > -40;
    if (keep) {
      if (w !== i) hazards[w] = h;
      w++;
    }
  }
  hazards.length = w;
}

export function scrollTentacles(tentacles: OctopusTentacle[], move: number): void {
  let w = 0;
  for (let i = 0; i < tentacles.length; i++) {
    const t = tentacles[i];
    t.x -= move;
    if (t.x + 80 > -40) {
      if (w !== i) tentacles[w] = t;
      w++;
    }
  }
  tentacles.length = w;
}

export function scrollPickups(pickups: Pickup[], move: number): void {
  let w = 0;
  for (let i = 0; i < pickups.length; i++) {
    const p = pickups[i];
    p.x -= move;
    if (p.x > -30 && !p.collected) {
      if (w !== i) pickups[w] = p;
      w++;
    }
  }
  pickups.length = w;
}

export function updateDebrisInPlace(debris: DebrisParticle[], move: number, dt: number): void {
  let w = 0;
  for (let i = 0; i < debris.length; i++) {
    const d = debris[i];
    d.x -= move + d.vx * dt;
    d.y += d.vy * dt;
    d.vy += 0.14 * dt;
    d.vx *= 1 - 0.02 * dt;
    d.life -= dt * 0.045;
    d.rotation += d.spin * dt;
    if (d.life > 0) {
      if (w !== i) debris[w] = d;
      w++;
    }
  }
  debris.length = w;
}

export const TICK_DT_CLAMP_MS = 48;
/** Fixed simulation step (~60 Hz) for smooth physics on high-refresh displays */
export const SIM_STEP_MS = 1000 / 60;
export const MAX_SIM_STEPS_PER_FRAME = 5;

export function clampTickDt(dtMs: number): number {
  if (!Number.isFinite(dtMs) || dtMs <= 0) return 16;
  return Math.min(dtMs, TICK_DT_CLAMP_MS);
}

export type HudSnapshot = {
  score: number;
  level: number;
  nutrition: number;
  phase: GameState["phase"];
  fruitsCollected: number;
  comboStreak: number;
  ghostSeconds: number;
  nitroStacks: number;
  birdBoostHits: number;
  paused: boolean;
  zoneKey: string;
  zoneFallback: string;
  elevationKey: string | null;
  elevationFallback: string | null;
  bossNear: boolean;
};

export function hudSnapshot(state: GameState): HudSnapshot {
  const ghostSeconds =
    state.elapsed < state.ghostUntil
      ? Math.ceil((state.ghostUntil - state.elapsed) / 1000)
      : 0;
  const nitroStacks = state.elapsed < state.speedBoostUntil ? Math.max(1, state.nitroStacks) : 0;
  const milestone = Math.ceil(state.level / 100) * 100;
  const bossNear = !state.animalBoss && milestone > state.level && milestone - state.level <= 3;

  const zone = zoneHudForLevel(state.level);
  const zoneKey = zone.zoneKey;
  const zoneFallback = zone.zoneFallback;
  const elev = computeElevation({
    score: state.score,
    canvasH: state.height,
    isCity: isCityLevel(state.level),
    worldScroll: state.worldScroll,
    elapsed: state.elapsed,
  });
  const showElev = !zone.isCity && (elev.activeKind !== "ground" || elev.blend > 0.08);
  const elevationKey = showElev ? elevationHudKey(elev.activeKind) : null;
  const elevationFallback = showElev ? elevationDisplayName(elev.activeKind) : null;

  return {
    score: state.score,
    level: state.level,
    nutrition: Math.round(state.bird.nutrition),
    phase: state.phase,
    fruitsCollected: state.fruitsCollected,
    comboStreak: state.comboStreak,
    ghostSeconds,
    nitroStacks,
    birdBoostHits: state.birdBoostHits,
    paused: state.paused,
    zoneKey,
    zoneFallback,
    elevationKey,
    elevationFallback,
    bossNear,
  };
}

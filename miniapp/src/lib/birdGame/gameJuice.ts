import {
  TREE_WIDTH,
  type GameState,
  type JuiceEvent,
  type JuicePopup,
  type TreeObstacle,
} from "./types";

function levelFromScore(score: number): number {
  return Math.floor(score / 3) + 1;
}

export type { JuiceEvent, JuicePopup };

const MAX_POPUPS = 6;
const POPUP_MS = 1100;
const COMBO_BONUS_EVERY = 5;
const COMBO_BONUS_POINTS = 2;

export function emptyJuiceFields(): Pick<
  GameState,
  "comboStreak" | "comboBest" | "juicePopups" | "juiceEvents" | "nearMisses"
> {
  return {
    comboStreak: 0,
    comboBest: 0,
    juicePopups: [],
    juiceEvents: [],
    nearMisses: 0,
  };
}

function pushPopup(
  state: GameState,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 1,
): GameState {
  const popups = state.juicePopups.slice(-(MAX_POPUPS - 1));
  popups.push({
    text,
    x,
    y,
    until: state.elapsed + POPUP_MS,
    color,
    scale,
  });
  return { ...state, juicePopups: popups };
}

function pushEvent(state: GameState, event: JuiceEvent): GameState {
  if (state.juiceEvents.length >= 8) return state;
  return { ...state, juiceEvents: [...state.juiceEvents, event] };
}

export function pruneJuice(state: GameState): GameState {
  const popups = state.juicePopups.filter((p) => p.until > state.elapsed);
  if (popups.length === state.juicePopups.length) return state;
  return { ...state, juicePopups: popups };
}

export function clearJuiceEvents(state: GameState): GameState {
  if (state.juiceEvents.length === 0) return state;
  return { ...state, juiceEvents: [] };
}

export function onLevelUp(state: GameState, prevLevel: number, level: number): GameState {
  if (level <= prevLevel) return state;
  let next = pushPopup(
    state,
    `LEVEL ${level}`,
    state.width * 0.5,
    state.height * 0.32,
    "#7C4DFF",
    1.15,
  );
  next = pushEvent(next, { type: "levelUp", value: level });
  next = {
    ...next,
    screenFlashUntil: next.elapsed + 220,
    screenFlashAlpha: state.reduceMotion ? 0.15 : 0.28,
    screenFlashColor: "#B388FF",
    screenShakeUntil: state.reduceMotion ? 0 : next.elapsed + 260,
    screenShakeMag: state.reduceMotion ? 0 : 4,
  };
  return next;
}

export type TreePassOpts = {
  groundY: number;
  birdR: number;
  nearMissMult?: number;
};

export function onTreePassed(state: GameState, tree: TreeObstacle, opts: TreePassOpts): GameState {
  const bx = state.width * 0.26;
  const streak = state.comboStreak + 1;
  let extra = 0;
  if (wasNearMissTree(state, tree, opts)) extra = 1;

  let next: GameState = {
    ...state,
    comboStreak: streak,
    comboBest: Math.max(state.comboBest, streak),
    score: state.score + 1 + extra,
    nearMisses: extra > 0 ? state.nearMisses + 1 : state.nearMisses,
    level: levelFromScore(state.score + 1 + extra),
  };

  if (extra > 0) {
    next = pushPopup(next, "CLOSE! +1", bx, state.bird.y - 42, "#29B6F6", 1);
    next = pushEvent(next, { type: "nearMiss" });
    if (!state.reduceMotion) {
      next = {
        ...next,
        screenFlashUntil: Math.max(next.screenFlashUntil, next.elapsed + 140),
        screenFlashAlpha: Math.max(next.screenFlashAlpha, 0.2),
        screenFlashColor: "#29B6F6",
      };
    }
  }

  if (streak >= 3 && streak % COMBO_BONUS_EVERY === 0) {
    const bonus = COMBO_BONUS_POINTS;
    next = {
      ...next,
      score: next.score + bonus,
      level: levelFromScore(next.score),
    };
    next = pushPopup(
      next,
      `COMBO ×${streak}! +${bonus}`,
      bx,
      state.bird.y - 28,
      "#FF6D00",
      1.1,
    );
    next = pushEvent(next, { type: "combo", value: streak });
    next = {
      ...next,
      screenShakeUntil: Math.max(next.screenShakeUntil, next.elapsed + 120),
      screenShakeMag: Math.max(next.screenShakeMag, 2.5),
    };
  } else if (streak >= 5 && streak % 3 === 0) {
    next = pushPopup(next, `×${streak}`, bx + 12, state.bird.y - 18, "#FFB300", 0.95);
  }

  return next;
}

/** Score gate in dungeon segments (no bottom trees). */
export function onGatePassed(state: GameState): GameState {
  const bx = state.width * 0.26;
  const streak = state.comboStreak + 1;
  let next: GameState = {
    ...state,
    comboStreak: streak,
    comboBest: Math.max(state.comboBest, streak),
    score: state.score + 1,
    level: levelFromScore(state.score + 1),
  };

  if (streak >= 3 && streak % COMBO_BONUS_EVERY === 0) {
    const bonus = COMBO_BONUS_POINTS;
    next = {
      ...next,
      score: next.score + bonus,
      level: levelFromScore(next.score),
    };
    next = pushPopup(
      next,
      `COMBO ×${streak}! +${bonus}`,
      bx,
      state.bird.y - 28,
      "#FF6D00",
      1.1,
    );
    next = pushEvent(next, { type: "combo", value: streak });
    next = {
      ...next,
      screenShakeUntil: Math.max(next.screenShakeUntil, next.elapsed + 120),
      screenShakeMag: Math.max(next.screenShakeMag, 2.5),
    };
  } else if (streak >= 5 && streak % 3 === 0) {
    next = pushPopup(next, `×${streak}`, bx + 12, state.bird.y - 18, "#FFB300", 0.95);
  }

  return next;
}

function wasNearMissTree(state: GameState, tree: TreeObstacle, opts: TreePassOpts): boolean {
  if (nearMissTreeHit(state, tree, opts, 0.88)) return false;
  const mult = opts.nearMissMult ?? 1;
  return nearMissTreeHit(state, tree, opts, 1.14 * mult);
}

function nearMissTreeHit(
  state: GameState,
  tree: TreeObstacle,
  opts: TreePassOpts,
  radiusMult: number,
): boolean {
  const bx = state.width * 0.26;
  const by = state.bird.y;
  const r = opts.birdR * radiusMult;
  const tw = TREE_WIDTH[tree.type];
  const y = opts.groundY - tree.height;
  const nearestX = Math.max(tree.x, Math.min(bx, tree.x + tw));
  const nearestY = Math.max(y, Math.min(by, y + tree.height));
  const dx = bx - nearestX;
  const dy = by - nearestY;
  return dx * dx + dy * dy < r * r;
}

export function drawJuicePopups(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const p of state.juicePopups) {
    const left = p.until - state.elapsed;
    if (left <= 0) continue;
    const t = 1 - left / POPUP_MS;
    const alpha = 1 - t;
    const lift = t * 22;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y - lift);
    ctx.scale(p.scale, p.scale);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 3;
    ctx.font = "bold 15px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText(p.text, 0, 0);
    ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }
}

export function drawComboHud(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.comboStreak < 3 || state.phase !== "playing") return;
  const pulse = 0.9 + Math.sin(state.elapsed * 0.014) * 0.1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#FF6D00";
  ctx.font = "bold 12px Manrope, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`COMBO ×${state.comboStreak}`, 102, 24);
  ctx.restore();
}

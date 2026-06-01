import type { BiomeId } from "./progression";
import type { DebrisParticle, GameState } from "./types";

export type FxDrawCtx = {
  width: number;
  height: number;
  elapsed: number;
  night: number;
  biome: BiomeId;
  cityMode: boolean;
  seaBlend: number;
  birdX: number;
  birdY: number;
  groundY: number;
  floorY: number;
  speedMult: number;
  nitro: boolean;
  bossBoost: boolean;
  ghost: boolean;
};

export function screenShakePatch(
  state: GameState,
  mag: number,
  ms: number,
): Pick<GameState, "screenShakeUntil" | "screenShakeMag"> {
  return {
    screenShakeUntil: Math.max(state.screenShakeUntil, state.elapsed + ms),
    screenShakeMag: Math.max(state.screenShakeMag, mag),
  };
}

export function getScreenShakeOffset(state: GameState): { x: number; y: number } {
  if (state.elapsed >= state.screenShakeUntil || state.screenShakeMag <= 0) {
    return { x: 0, y: 0 };
  }
  const fade =
    1 - (state.elapsed - (state.screenShakeUntil - 280)) / 280;
  const m = state.screenShakeMag * Math.max(0, Math.min(1, fade));
  const t = state.elapsed * 0.001;
  return {
    x: Math.sin(t * 47) * m + Math.sin(t * 83) * m * 0.35,
    y: Math.cos(t * 53) * m * 0.65,
  };
}

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** @deprecated Фоновые частицы отключены */
export function drawAmbientFx(_ctx: CanvasRenderingContext2D, _fx: FxDrawCtx): void {
  /* отключено */
}

/** Линии скорости по краям экрана при нитро / бусте */
export function drawSpeedStreaks(ctx: CanvasRenderingContext2D, fx: FxDrawCtx): void {
  const boost = fx.nitro || fx.bossBoost;
  if (!boost || fx.speedMult < 1.15) return;

  const { width: w, height: h, elapsed: e } = fx;
  const intensity = Math.min(1, (fx.speedMult - 1) / 4);
  const lines = Math.floor(3 + intensity * 5);

  for (let i = 0; i < lines; i += 1) {
    const side = i % 2 === 0 ? 0 : 1;
    const t = (e * 0.012 + i * 0.37) % 1;
    const y = t * h;
    const len = (40 + hash(i + e * 0.001) * 90) * intensity;
    const x0 = side === 0 ? 4 + hash(i) * 18 : w - 4 - hash(i) * 18;
    const x1 = side === 0 ? x0 + len : x0 - len;
    const alpha = (0.08 + intensity * 0.22) * (1 - Math.abs(t - 0.5) * 1.2);

    const grad = ctx.createLinearGradient(x0, y, x1, y);
    grad.addColorStop(0, `rgba(255,255,255,0)`);
    grad.addColorStop(
      0.5,
      fx.bossBoost ? `rgba(255,235,59,${alpha})` : `rgba(255,193,7,${alpha})`,
    );
    grad.addColorStop(1, `rgba(255,87,34,0)`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2 + intensity * 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }
}

/** Кильватер / брызги у птицы над водой */
export function drawBirdWake(ctx: CanvasRenderingContext2D, fx: FxDrawCtx): void {
  if (fx.seaBlend < 0.4 || fx.cityMode) return;
  if (fx.birdY < fx.groundY - 24) return;

  const { birdX: bx, birdY: by, elapsed: e } = fx;
  const t = e * 0.001;
  const splash = fx.speedMult > 1.2;

  for (let i = 0; i < (splash ? 3 : 2); i += 1) {
    const ox = -18 - i * (splash ? 14 : 10);
    const oy = 6 + Math.sin(t * 8 + i) * 3;
    ctx.fillStyle = `rgba(187,222,251,${0.35 - i * 0.04})`;
    ctx.beginPath();
    ctx.ellipse(bx + ox, by + oy, 5 + i * 1.2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (splash) {
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(bx - 12 - i * 11, by + 4);
      ctx.quadraticCurveTo(bx - 20 - i * 11, by - 2, bx - 28 - i * 11, by + 5);
      ctx.stroke();
    }
  }
}

/** Виньетка и цветовой оттенок при ускорении / призраке */
export function drawBoostVignette(ctx: CanvasRenderingContext2D, fx: FxDrawCtx): void {
  const { width: w, height: h } = fx;
  const pulse = 0.85 + Math.sin(fx.elapsed * 0.018) * 0.15;

  if (fx.bossBoost || fx.nitro) {
    const intensity = Math.min(0.42, (fx.speedMult - 1) * 0.12) * pulse;
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
    vg.addColorStop(0, "rgba(255,193,7,0)");
    vg.addColorStop(1, `rgba(255,111,0,${intensity})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  if (fx.ghost && !fx.nitro && !fx.bossBoost) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
    vg.addColorStop(0, "rgba(224,247,250,0)");
    vg.addColorStop(1, `rgba(129,212,250,${0.12 * pulse})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
}

/** Вспышка экрана при ударе / сборе */
/** Едва заметная вспышка (почти отключена) */
export function drawScreenFlash(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.elapsed >= state.screenFlashUntil || state.screenFlashAlpha <= 0) return;
  const remain = state.screenFlashUntil - state.elapsed;
  const alpha = Math.min(0.04, state.screenFlashAlpha * Math.min(1, remain / 80));
  if (alpha < 0.008) return;
  ctx.fillStyle = state.screenFlashColor;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.globalAlpha = 1;
}

export function screenFlashPatch(
  state: GameState,
  color: string,
  alpha: number,
  ms: number,
): Pick<GameState, "screenFlashUntil" | "screenFlashAlpha" | "screenFlashColor"> {
  return {
    screenFlashUntil: Math.max(state.screenFlashUntil, state.elapsed + ms),
    screenFlashAlpha: Math.max(state.screenFlashAlpha, alpha),
    screenFlashColor: color,
  };
}

export function spawnGoldSparkBurst(
  debris: DebrisParticle[],
  x: number,
  y: number,
  count: number,
  push: (d: DebrisParticle[], p: DebrisParticle) => void,
): void {
  const golds = ["#FFD700", "#FFC107", "#FFEB3B", "#FFF59D", "#FF8F00"];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4.5;
    push(debris, {
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed + 1.2,
      vy: Math.sin(angle) * speed - 1.5,
      life: 1,
      maxLife: 0.45 + Math.random() * 0.55,
      size: 3 + Math.random() * 5,
      color: golds[i % golds.length],
      kind: "gold",
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.35,
    });
  }
}

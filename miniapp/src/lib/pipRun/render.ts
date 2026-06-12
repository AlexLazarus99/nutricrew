import type { Enemy, GameState, Mote, Obstacle, PlatformSegment } from "./types";
import { PIP_WORLDS, type WorldTheme } from "./worlds";

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, state: GameState, theme: WorldTheme): void {
  const { width, height } = state;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, theme.skyTop);
  g.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  const scroll = state.scrollX * 0.15;
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const bx = ((i * 140 - scroll) % (width + 160)) - 80;
    const bh = 60 + hash(i + theme.id.length) * 90;
    const by = height * 0.35 - bh * 0.3;
    ctx.fillStyle = `rgba(${theme.foliage === "#7B1FA2" ? "123,31,162" : "46,125,50"},0.25)`;
    ctx.beginPath();
    ctx.ellipse(bx + 50, by + bh, 55, bh, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  if (theme.id === "brook") {
    ctx.fillStyle = "rgba(79,195,247,0.35)";
    ctx.fillRect(0, height * 0.55, width, height * 0.2);
  }
  if (theme.id === "marsh") {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.08 + hash(i) * 0.06})`;
      const fx = ((i * 200 - state.scrollX * 0.08) % (width + 100)) - 50;
      ctx.fillRect(fx, height * 0.2 + hash(i + 2) * 40, 120, 30);
    }
  }
  if (theme.id === "glade") {
    for (let i = 0; i < 40; i++) {
      const sx = hash(i) * width;
      const sy = hash(i + 50) * height * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.5})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
}

function drawPlatformChunk(
  ctx: CanvasRenderingContext2D,
  p: PlatformSegment,
  scrollX: number,
  theme: WorldTheme,
  width: number,
): void {
  const x = p.x - scrollX;
  if (x + p.w < -20 || x > width + 20) return;
  const top = p.surfaceY;

  ctx.fillStyle = theme.ground;
  ctx.fillRect(x, top, p.w, 80);

  ctx.fillStyle = theme.foliage;
  ctx.beginPath();
  for (let i = 0; i < p.w; i += 18) {
    const h = 8 + hash(Math.floor(p.x) + i) * 14;
    ctx.moveTo(x + i, top);
    ctx.lineTo(x + i + 9, top - h);
    ctx.lineTo(x + i + 18, top);
  }
  ctx.fill();

  if (p.wallH) {
    ctx.fillStyle = theme.ground;
    ctx.fillRect(x + p.w - 14, top - p.wallH, 14, p.wallH);
    ctx.fillStyle = theme.foliage;
    ctx.fillRect(x + p.w - 18, top - p.wallH - 8, 22, 10);
  }
}

export function drawPlatforms(ctx: CanvasRenderingContext2D, state: GameState, theme: WorldTheme): void {
  for (const p of state.platforms) drawPlatformChunk(ctx, p, state.scrollX, theme, state.width);
}

export function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, scrollX: number, groundY: number): void {
  const x = o.x - scrollX;
  const y = groundY - o.h;
  if (o.kind === "mushroom") {
    ctx.fillStyle = "#E57373";
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, y + 6, o.w / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFEBEE";
    ctx.fillRect(x + o.w * 0.25, y + 10, o.w * 0.5, o.h - 10);
  } else if (o.kind === "root") {
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y + o.h);
    ctx.quadraticCurveTo(x + o.w, y, x + o.w * 0.5, y + o.h * 0.3);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#78909C";
    ctx.beginPath();
    ctx.moveTo(x, y + o.h);
    ctx.lineTo(x + o.w * 0.5, y);
    ctx.lineTo(x + o.w, y + o.h);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, scrollX: number): void {
  if (e.defeated) return;
  const x = e.x - scrollX;
  const y = e.surfaceY - e.h;
  if (e.kind === "beetle") {
    ctx.fillStyle = "#4527A0";
    ctx.beginPath();
    ctx.ellipse(x + e.w / 2, y + e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#B39DDB";
    ctx.fillRect(x + 2, y + e.h * 0.3, e.w - 4, 3);
  } else {
    ctx.fillStyle = "rgba(156,39,176,0.7)";
    ctx.beginPath();
    ctx.arc(x + e.w / 2, y + e.h / 2, e.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawMote(ctx: CanvasRenderingContext2D, m: Mote, scrollX: number, t: number): void {
  if (m.collected) return;
  const x = m.x - scrollX;
  const pulse = 1 + Math.sin(t * 0.008 + m.x) * 0.15;
  ctx.fillStyle = "#FFEE58";
  ctx.shadowColor = "#FFF59D";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, m.y, 7 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

export function drawPip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  opts: { gliding: boolean; attacking: boolean; wallRunning: boolean; flapAnim: number },
): void {
  ctx.save();
  ctx.translate(x, y);
  const tilt = opts.wallRunning ? 0.25 : opts.gliding ? 0.1 : 0;
  ctx.rotate(tilt);

  ctx.fillStyle = "#26C6DA";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.arc(r * 0.25, -r * 0.15, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#004D40";
  ctx.beginPath();
  ctx.arc(r * 0.32, -r * 0.15, r * 0.12, 0, Math.PI * 2);
  ctx.fill();

  if (opts.attacking) {
    ctx.fillStyle = "#FFB74D";
    ctx.beginPath();
    ctx.arc(r * 1.1, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (opts.gliding) {
    ctx.fillStyle = "rgba(129,199,132,0.85)";
    for (const side of [-1, 1] as const) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.1, 0);
      ctx.quadraticCurveTo(side * r * 1.2, -r * 0.5, side * r * 1.4, r * 0.1);
      ctx.quadraticCurveTo(side * r * 0.6, r * 0.2, side * r * 0.1, 0);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#81C784";
    const wing = Math.sin(opts.flapAnim * Math.PI * 2) * 0.3;
    ctx.beginPath();
    ctx.ellipse(-r * 0.5, -r * 0.2 + wing * 5, r * 0.55, r * 0.35, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawHud(ctx: CanvasRenderingContext2D, state: GameState, theme: WorldTheme): void {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(8, 8, 108, state.runMode === "stage" ? 58 : 42);
  ctx.fillStyle = "#263238";
  ctx.font = "bold 16px Manrope, sans-serif";
  ctx.fillText(String(state.score), 18, 30);
  ctx.font = "10px Manrope, sans-serif";
  ctx.fillStyle = "#607D8B";
  if (state.runMode === "stage") {
    const label = state.isBoss ? "BOSS" : `${state.world + 1}-${state.stage}`;
    ctx.fillText(label, 18, 44);
    const pct = Math.min(1, state.score / Math.max(1, state.levelTarget));
    ctx.fillStyle = theme.accent;
    ctx.fillRect(18, 50, 88 * pct, 3);
    ctx.fillStyle = "#90A4AE";
    ctx.fillText(`${state.motesCollected}/${state.motesTotal} ✦`, 18, 62);
  } else {
    ctx.fillText("ENDLESS", 18, 44);
  }

  const tags: string[] = [];
  if (state.gliding) tags.push("GLIDE");
  if (state.wallRunning) tags.push("WALL");
  if (state.attacking) tags.push("PUNCH");
  if (tags.length) {
    ctx.fillStyle = theme.accent;
    ctx.font = "bold 9px Manrope, sans-serif";
    ctx.fillText(tags.join(" · "), state.width - 88, 22);
  }
}

export function worldTheme(world: number): WorldTheme {
  return PIP_WORLDS[world] ?? PIP_WORLDS[0]!;
}

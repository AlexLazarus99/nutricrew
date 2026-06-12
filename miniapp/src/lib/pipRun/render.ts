import { drawWorldBackdrop, drawWorldForeground } from "./backdrops";
import {
  drawAmbientParticles,
  drawAtmosphericBloom,
  drawMossPatch,
  drawPurpleFlowers,
  drawVignette,
  phash,
  softBlob,
} from "./painterly";
import type { Enemy, GameState, Mote, Obstacle, PlatformSegment } from "./types";
import { PIP_WORLDS, type WorldTheme } from "./worlds";

function hash(n: number): number {
  return phash(n);
}

function drawPlatformChunk(
  ctx: CanvasRenderingContext2D,
  p: PlatformSegment,
  scrollX: number,
  theme: WorldTheme,
  canvasW: number,
  canvasH: number,
): void {
  const x = p.x - scrollX;
  if (x + p.w < -30 || x > canvasW + 30) return;
  const top = p.surfaceY;
  const bottom = canvasH;

  const landG = ctx.createLinearGradient(0, top, 0, bottom);
  landG.addColorStop(0, theme.landTop);
  landG.addColorStop(0.15, theme.landMid);
  landG.addColorStop(0.4, theme.landBot);
  landG.addColorStop(0.7, "#5D4E42");
  landG.addColorStop(1, theme.landSoil);
  ctx.fillStyle = landG;
  ctx.fillRect(x, top, p.w, bottom - top);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, top, p.w, bottom - top);
  ctx.clip();

  for (let i = 0; i < Math.ceil(p.w / 16); i++) {
    const gx = x + i * 16 + (hash(Math.floor(p.x) + i) * 6);
    const bump = Math.sin(gx * 0.05) * 2;
    softBlob(ctx, gx + 8, top + 2 + bump, 10, 5, theme.grass, "#C5E1A5");
  }

  if (theme.id === "canopy" || theme.id === "brook") {
    for (let i = 0; i < 2; i++) {
      if (hash(Math.floor(p.x) + i * 7) > 0.4) {
        drawPurpleFlowers(ctx, x + p.w * (0.3 + i * 0.35), top - 2, 0.75, 2);
      }
    }
  }

  ctx.restore();

  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + p.w, top);
  ctx.stroke();

  if (p.wallH) {
    const wx = x + p.w - 16;
    const wallG = ctx.createLinearGradient(wx, top - p.wallH, wx + 16, top);
    wallG.addColorStop(0, theme.landBot);
    wallG.addColorStop(0.5, theme.landMid);
    wallG.addColorStop(1, theme.landTop);
    ctx.fillStyle = wallG;
    ctx.fillRect(wx, top - p.wallH, 16, p.wallH);
    drawMossPatch(ctx, wx + 8, top - p.wallH * 0.4, 12, 8);
    softBlob(ctx, wx + 4, top - p.wallH - 6, 18, 10, theme.grass, "#AED581");
  }
}

export function drawPlatforms(ctx: CanvasRenderingContext2D, state: GameState, theme: WorldTheme): void {
  for (const p of state.platforms) {
    drawPlatformChunk(ctx, p, state.scrollX, theme, state.width, state.height);
  }
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  o: Obstacle,
  scrollX: number,
  surfaceY: number,
  t: number,
): void {
  const x = o.x - scrollX;
  const y = surfaceY - o.h;
  if (o.kind === "mushroom") {
    const capG = ctx.createRadialGradient(x + o.w / 2, y + 4, 0, x + o.w / 2, y + 8, o.w / 2);
    capG.addColorStop(0, "#EF9A9A");
    capG.addColorStop(0.6, "#E57373");
    capG.addColorStop(1, "#C62828");
    ctx.fillStyle = capG;
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, y + 6, o.w / 2, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFEBEE";
    ctx.fillRect(x + o.w * 0.28, y + 12, o.w * 0.44, o.h - 12);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x + o.w * (0.3 + i * 0.2), y + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (o.kind === "root") {
    ctx.strokeStyle = "#4E342E";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y + o.h);
    ctx.bezierCurveTo(x + o.w * 0.3, y + o.h * 0.4, x + o.w * 0.7, y, x + o.w * 0.5, y + o.h * 0.25);
    ctx.stroke();
    drawMossPatch(ctx, x + o.w * 0.4, y + o.h * 0.35, 10, 6);
  } else {
    const sg = ctx.createLinearGradient(x, y, x + o.w, y + o.h);
    sg.addColorStop(0, "#90A4AE");
    sg.addColorStop(0.5, "#607D8B");
    sg.addColorStop(1, "#455A64");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(x, y + o.h);
    ctx.lineTo(x + o.w * 0.5, y);
    ctx.lineTo(x + o.w, y + o.h);
    ctx.closePath();
    ctx.fill();
    drawMossPatch(ctx, x + o.w * 0.45, y + o.h * 0.5, 8, 5);
  }
  void t;
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, scrollX: number, t: number): void {
  if (e.defeated) return;
  const x = e.x - scrollX;
  const y = e.surfaceY - e.h;
  if (e.kind === "beetle") {
    const bob = Math.sin(t * 0.006 + e.x) * 2;
    const bg = ctx.createRadialGradient(x + e.w / 2, y + e.h / 2, 0, x + e.w / 2, y + e.h / 2, e.w / 2);
    bg.addColorStop(0, "#7E57C2");
    bg.addColorStop(0.7, "#4527A0");
    bg.addColorStop(1, "#311B92");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(x + e.w / 2, y + e.h / 2 + bob, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(x + 4, y + e.h * 0.35 + bob, e.w - 8, 3);
    ctx.fillStyle = "#1A237E";
    ctx.beginPath();
    ctx.arc(x + e.w * 0.7, y + e.h * 0.35 + bob, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const pulse = 1 + Math.sin(t * 0.008 + e.x) * 0.12;
    const g = ctx.createRadialGradient(x + e.w / 2, y + e.h / 2, 0, x + e.w / 2, y + e.h / 2, e.w * pulse);
    g.addColorStop(0, "rgba(233,30,99,0.9)");
    g.addColorStop(0.6, "rgba(156,39,176,0.65)");
    g.addColorStop(1, "rgba(156,39,176,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + e.w / 2, y + e.h / 2, (e.w / 2) * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawMote(ctx: CanvasRenderingContext2D, m: Mote, scrollX: number, t: number): void {
  if (m.collected) return;
  const x = m.x - scrollX;
  const pulse = 1 + Math.sin(t * 0.009 + m.x * 0.1) * 0.18;
  const r = 8 * pulse;

  ctx.save();
  ctx.shadowColor = "#FFF59D";
  ctx.shadowBlur = 14;
  const g = ctx.createRadialGradient(x, m.y, 0, x, m.y, r);
  g.addColorStop(0, "#FFFDE7");
  g.addColorStop(0.35, "#FFEE58");
  g.addColorStop(0.7, "#FBC02D");
  g.addColorStop(1, "rgba(251,192,45,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, m.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 0.012 + m.x) * 0.3})`;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const a = t * 0.003 + i * (Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(x, m.y);
    ctx.lineTo(x + Math.cos(a) * r * 1.4, m.y + Math.sin(a) * r * 1.4);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  opts: { gliding: boolean; attacking: boolean; wallRunning: boolean; flapAnim: number },
  t: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  const tilt = opts.wallRunning ? 0.28 : opts.gliding ? 0.12 : Math.min(0.35, Math.max(-0.2, opts.flapAnim * 0.15));
  ctx.rotate(tilt);

  const glow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2.2);
  glow.addColorStop(0, "rgba(38,198,218,0.45)");
  glow.addColorStop(1, "rgba(38,198,218,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
  ctx.fill();

  const bodyG = ctx.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.1, 0, 0, r);
  bodyG.addColorStop(0, "#4DD0E1");
  bodyG.addColorStop(0.55, "#26C6DA");
  bodyG.addColorStop(1, "#00838F");
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  if (opts.attacking) {
    const ag = ctx.createRadialGradient(r * 1.1, 0, 0, r * 1.1, 0, r * 0.5);
    ag.addColorStop(0, "#FFE082");
    ag.addColorStop(1, "#FF8F00");
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(r * 1.1, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (opts.gliding) {
    for (const side of [-1, 1] as const) {
      const wg = ctx.createLinearGradient(side * r * 0.2, 0, side * r * 1.3, 0);
      wg.addColorStop(0, "rgba(129,199,132,0.95)");
      wg.addColorStop(1, "rgba(104,159,56,0.4)");
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(side * r * 0.15, 0);
      ctx.quadraticCurveTo(side * r * 1.15, -r * 0.55, side * r * 1.45, r * 0.08);
      ctx.quadraticCurveTo(side * r * 0.65, r * 0.15, side * r * 0.15, 0);
      ctx.fill();
    }
  } else {
    const wing = Math.sin(opts.flapAnim * Math.PI * 2 + t * 0.01) * 0.35;
    softBlob(ctx, -r * 0.45, -r * 0.15 + wing * 6, r * 0.6, r * 0.38, "rgba(129,199,132,0.9)", "#AED581");
  }

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(r * 0.28, -r * 0.18, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#004D40";
  ctx.beginPath();
  ctx.arc(r * 0.34, -r * 0.18, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(r * 0.22, -r * 0.24, r * 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawHud(ctx: CanvasRenderingContext2D, state: GameState, theme: WorldTheme): void {
  const h = state.runMode === "stage" ? 62 : 46;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 8;
  const panelG = ctx.createLinearGradient(8, 8, 8, 8 + h);
  panelG.addColorStop(0, "rgba(255,255,255,0.95)");
  panelG.addColorStop(1, "rgba(255,255,255,0.88)");
  ctx.fillStyle = panelG;
  const rx = 10;
  const px = 8;
  const py = 8;
  const pw = 112;
  ctx.beginPath();
  ctx.moveTo(px + rx, py);
  ctx.lineTo(px + pw - rx, py);
  ctx.quadraticCurveTo(px + pw, py, px + pw, py + rx);
  ctx.lineTo(px + pw, py + h - rx);
  ctx.quadraticCurveTo(px + pw, py + h, px + pw - rx, py + h);
  ctx.lineTo(px + rx, py + h);
  ctx.quadraticCurveTo(px, py + h, px, py + h - rx);
  ctx.lineTo(px, py + rx);
  ctx.quadraticCurveTo(px, py, px + rx, py);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#263238";
  ctx.font = "bold 17px Manrope, sans-serif";
  ctx.fillText(String(state.score), 20, 32);
  ctx.font = "10px Manrope, sans-serif";
  ctx.fillStyle = "#607D8B";
  if (state.runMode === "stage") {
    const label = state.isBoss ? "👑 BOSS" : `${state.world + 1}-${state.stage}`;
    ctx.fillText(label, 20, 46);
    const pct = Math.min(1, state.score / Math.max(1, state.levelTarget));
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(20, 52, 88, 4);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(20, 52, 88 * pct, 4);
    ctx.fillStyle = "#90A4AE";
    ctx.fillText(`✦ ${state.motesCollected}/${state.motesTotal}`, 20, 66);
  } else {
    ctx.fillText("∞ ENDLESS", 20, 46);
  }

  const tags: string[] = [];
  if (state.gliding) tags.push("GLIDE");
  if (state.wallRunning) tags.push("WALL");
  if (state.attacking) tags.push("PUNCH");
  if (tags.length) {
    ctx.fillStyle = theme.accent;
    ctx.font = "bold 9px Manrope, sans-serif";
    ctx.fillText(tags.join(" · "), state.width - 92, 24);
  }
  ctx.restore();
}

export function worldTheme(world: number): WorldTheme {
  return PIP_WORLDS[world] ?? PIP_WORLDS[0]!;
}

export function drawScene(ctx: CanvasRenderingContext2D, state: GameState, theme: WorldTheme): void {
  const gy = Math.round(state.height * 0.72);
  const night = theme.night;

  drawWorldBackdrop(ctx, state, theme);

  if (!state.reduceMotion) {
    try {
      drawAmbientParticles(ctx, state.width, gy, state.elapsed, night);
    } catch {
      /* optional */
    }
  }

  drawPlatforms(ctx, state, theme);

  for (const o of state.obstacles) {
    const surf = state.platforms.find((p) => o.x >= p.x && o.x <= p.x + p.w);
    drawObstacle(ctx, o, state.scrollX, surf?.surfaceY ?? gy, state.elapsed);
  }
  for (const e of state.enemies) drawEnemy(ctx, e, state.scrollX, state.elapsed);
  for (const m of state.motes) drawMote(ctx, m, state.scrollX, state.elapsed);

  const px = state.width * 0.26;
  drawPip(ctx, px, state.pip.y, 16, {
    gliding: state.gliding,
    attacking: state.attacking,
    wallRunning: state.wallRunning,
    flapAnim: state.flapAnim,
  }, state.elapsed);

  drawWorldForeground(ctx, state, theme);

  if (!state.reduceMotion) {
    try {
      drawAtmosphericBloom(ctx, state.width, state.height, night);
    } catch {
      ctx.globalCompositeOperation = "source-over";
    }
  }

  drawVignette(ctx, state.width, state.height, 0.28 + night * 0.15);
  drawHud(ctx, state, theme);
}

import type { GameState } from "./types";
import {
  drawForestSpire,
  drawFramingTrunk,
  drawGodRays,
  drawHorizonHaze,
  drawPainterlyCanopy,
  drawPainterlyCloud,
  drawPurpleFlowers,
  phash,
  softBlob,
} from "./painterly";
import type { WorldTheme } from "./worlds";

function groundY(h: number): number {
  return Math.round(h * 0.72);
}

function parallaxX(scroll: number, factor: number, w: number, offset: number): number {
  return ((offset - scroll * factor) % (w + 200)) - 100;
}

export function drawWorldBackdrop(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  theme: WorldTheme,
): void {
  const { width: w, height: h, scrollX, elapsed } = state;
  const gy = groundY(h);
  const night = theme.night ?? 0;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyBottom);
  sky.addColorStop(1, theme.haze);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  drawGodRays(ctx, w, gy, elapsed, night);

  for (let i = 0; i < 5; i++) {
    const cx = parallaxX(scrollX, 0.06, w, i * 180);
    const cy = h * (0.12 + (i % 3) * 0.04);
    drawPainterlyCloud(ctx, cx, cy, 0.9 + (i % 2) * 0.3, 0.55 - night * 0.2, i % 2 === 0);
  }

  switch (theme.id) {
    case "brook":
      drawBrook(ctx, w, h, gy, scrollX, elapsed);
      break;
    case "tunnel":
      drawTunnel(ctx, w, h, gy, scrollX);
      break;
    case "marsh":
      drawMarsh(ctx, w, h, gy, scrollX, elapsed);
      break;
    case "heartwood":
      drawHeartwood(ctx, w, h, gy, scrollX);
      break;
    case "canopy":
      drawCanopy(ctx, w, h, gy, scrollX, elapsed);
      break;
    case "glade":
      drawGlade(ctx, w, h, gy, elapsed);
      break;
    default:
      drawBrook(ctx, w, h, gy, scrollX, elapsed);
  }

  drawHorizonHaze(ctx, w, gy, theme.haze, night);

  if (theme.id !== "tunnel" && theme.id !== "heartwood") {
    drawFramingTrunk(ctx, -10, gy + 20, 55, h * 0.55, "left");
    drawFramingTrunk(ctx, w + 10, gy + 15, 48, h * 0.48, "right");
  }
}

function drawBrook(ctx: CanvasRenderingContext2D, w: number, h: number, gy: number, scroll: number, t: number): void {
  for (let i = 0; i < 6; i++) {
    drawForestSpire(ctx, parallaxX(scroll, 0.12, w, i * 110 + 40), gy + 10, 90 + i * 15, 0.45);
  }
  const waterY = gy + 25;
  const wg = ctx.createLinearGradient(0, waterY, 0, h);
  wg.addColorStop(0, "rgba(79,195,247,0.55)");
  wg.addColorStop(0.5, "rgba(41,182,246,0.4)");
  wg.addColorStop(1, "rgba(2,119,189,0.35)");
  ctx.fillStyle = wg;
  ctx.fillRect(0, waterY, w, h - waterY);
  for (let i = 0; i < 8; i++) {
    const wx = (i * 90 - scroll * 0.25 + t * 0.02) % (w + 40);
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + phash(i) * 0.1})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wx, waterY + 8);
    ctx.quadraticCurveTo(wx + 30, waterY + 4 + Math.sin(t * 0.003 + i) * 3, wx + 60, waterY + 8);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    softBlob(ctx, parallaxX(scroll, 0.2, w, i * 150), gy - 5, 35, 12, "rgba(102,187,106,0.5)", "rgba(174,213,129,0.6)");
  }
}

function drawTunnel(ctx: CanvasRenderingContext2D, w: number, h: number, gy: number, scroll: number): void {
  const cg = ctx.createRadialGradient(w * 0.5, h * 0.35, 20, w * 0.5, h * 0.4, w * 0.9);
  cg.addColorStop(0, "rgba(255,213,79,0.12)");
  cg.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) {
    const rx = parallaxX(scroll, 0.18, w, i * 130);
    ctx.strokeStyle = "rgba(78,52,46,0.6)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(rx, gy);
    ctx.quadraticCurveTo(rx + 40, gy - 80 - i * 8, rx + 20, gy - 120);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    softBlob(ctx, parallaxX(scroll, 0.1, w, i * 160), gy * 0.5, 20, 20, "rgba(255,193,7,0.25)");
  }
}

function drawMarsh(ctx: CanvasRenderingContext2D, w: number, h: number, gy: number, scroll: number, t: number): void {
  for (let i = 0; i < 6; i++) {
    const fx = parallaxX(scroll, 0.05, w, i * 200);
    ctx.fillStyle = `rgba(255,255,255,${0.06 + phash(i) * 0.05})`;
    ctx.fillRect(fx, h * 0.15 + phash(i + 1) * 50, 140, 35);
  }
  for (let i = 0; i < 10; i++) {
    const rx = parallaxX(scroll, 0.22, w, i * 70);
    const rh = 40 + phash(i) * 30 + Math.sin(t * 0.002 + i) * 3;
    ctx.fillStyle = "rgba(85,139,47,0.35)";
    ctx.fillRect(rx, gy - rh, 4, rh);
    ctx.beginPath();
    ctx.ellipse(rx + 2, gy - rh, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 3; i++) {
    drawPurpleFlowers(ctx, parallaxX(scroll, 0.15, w, i * 220), gy - 8, 1, 4);
  }
}

function drawHeartwood(ctx: CanvasRenderingContext2D, w: number, h: number, gy: number, scroll: number): void {
  const rg = ctx.createLinearGradient(w * 0.5, 0, w * 0.5, h);
  rg.addColorStop(0, "rgba(62,39,35,0.3)");
  rg.addColorStop(0.6, "rgba(93,64,55,0.15)");
  rg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 5; i++) {
    const ringY = gy * 0.25 + i * 35;
    ctx.strokeStyle = `rgba(109,76,65,${0.15 + i * 0.03})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, ringY, w * 0.45 - i * 15, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    softBlob(ctx, parallaxX(scroll, 0.08, w, i * 180), gy - 20, 50, 25, "rgba(93,64,55,0.4)");
  }
}

function drawCanopy(ctx: CanvasRenderingContext2D, w: number, h: number, gy: number, scroll: number, t: number): void {
  for (let i = 0; i < 7; i++) {
    const cx = parallaxX(scroll, 0.14, w, i * 100);
    drawPainterlyCanopy(ctx, cx, h * 0.08, h * 0.22, 80 + (i % 3) * 20, i, ["#AED581", "#7CB342", "#558B2F"]);
  }
  for (let i = 0; i < 8; i++) {
    drawPurpleFlowers(ctx, parallaxX(scroll, 0.2, w, i * 95), gy - 5 + Math.sin(t * 0.002 + i) * 2, 0.9, 3);
  }
  for (let i = 0; i < 6; i++) {
    const lx = parallaxX(scroll, 0.35, w, i * 60 + t * 0.03);
    const ly = h * 0.2 + (i % 4) * 40;
    ctx.fillStyle = `rgba(171,71,188,${0.35 + phash(i) * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 10, 5, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGlade(ctx: CanvasRenderingContext2D, w: number, h: number, gy: number, t: number): void {
  for (let i = 0; i < 60; i++) {
    const sx = phash(i * 7) * w;
    const sy = phash(i * 11) * gy * 0.7;
    const tw = 0.4 + Math.sin(t * 0.004 + i) * 0.35;
    ctx.fillStyle = `rgba(255,255,255,${tw})`;
    ctx.fillRect(sx, sy, 1.5 + (i % 2), 1.5 + (i % 2));
  }
  const mg = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.5, w * 0.6);
  mg.addColorStop(0, "rgba(126,87,212,0.35)");
  mg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = mg;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) {
    softBlob(ctx, w * (0.2 + i * 0.2), gy - 30, 40, 40, "rgba(255,213,79,0.2)", "rgba(255,241,118,0.35)");
  }
}

export function drawWorldForeground(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  theme: WorldTheme,
): void {
  const { width: w, height: h, scrollX } = state;
  const gy = groundY(h);
  ctx.save();
  ctx.globalAlpha = 0.55;

  if (theme.id === "canopy" || theme.id === "brook") {
    for (let i = 0; i < 6; i++) {
      const lx = parallaxX(scrollX, 0.45, w, i * 80);
      const ly = gy * 0.3 + (i % 3) * 50;
      ctx.fillStyle = theme.id === "canopy" ? "rgba(123,31,162,0.45)" : "rgba(76,175,80,0.4)";
      ctx.beginPath();
      ctx.ellipse(lx, ly, 14, 7, 0.8 + i * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (theme.id === "marsh") {
    for (let i = 0; i < 5; i++) {
      const rx = parallaxX(scrollX, 0.5, w, i * 100);
      ctx.fillStyle = "rgba(129,199,132,0.5)";
      ctx.fillRect(rx, gy - 25, 3, 25);
    }
  }

  ctx.restore();
}

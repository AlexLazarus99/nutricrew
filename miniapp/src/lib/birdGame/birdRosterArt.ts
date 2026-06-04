import type { BirdId } from "./birdCatalog";
import { BIRD_UI } from "./birdCatalog";
import { drawSpeciesBird } from "./birdSprites";
import { resolveBirdId } from "./birdModifiers";

export const ROSTER_PREVIEW_W = 280;
export const ROSTER_PREVIEW_H = 200;

function smoothFlap(elapsed: number): number {
  return (Math.sin(elapsed * 0.011) + 1) * 0.5;
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  elapsed: number,
  locked: boolean,
): void {
  const pulse = 0.85 + Math.sin(elapsed * 0.0025) * 0.15;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, locked ? "rgba(12,18,32,0.95)" : "rgba(18,28,48,0.92)");
  g.addColorStop(0.55, locked ? "rgba(8,12,22,0.88)" : `color-mix(in srgb, ${accent} 22%, rgba(10,16,28,0.9))`);
  g.addColorStop(1, "rgba(6,10,18,0.96)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(
    w * 0.5,
    h * 0.48,
    8,
    w * 0.5,
    h * 0.48,
    w * 0.52,
  );
  glow.addColorStop(0, `color-mix(in srgb, ${accent} ${Math.floor(42 * pulse)}%, transparent)`);
  glow.addColorStop(0.45, `color-mix(in srgb, ${accent} 12%, transparent)`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = locked ? 0.25 : 0.55;
  for (let i = 0; i < 14; i++) {
    const sx = ((i * 47 + Math.sin(elapsed * 0.001 + i) * 20) % w) + w;
    const sy = (i * 29 + elapsed * 0.012) % h;
    ctx.fillStyle = i % 3 === 0 ? accent : "#ffffff";
    ctx.beginPath();
    ctx.arc(sx % w, sy % h, 0.6 + (i % 4) * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSpeciesAura(
  ctx: CanvasRenderingContext2D,
  id: BirdId,
  cx: number,
  cy: number,
  r: number,
  elapsed: number,
): void {
  switch (id) {
    case "ember":
      for (let i = 0; i < 8; i++) {
        const a = elapsed * 0.008 + i * 0.9;
        ctx.globalAlpha = 0.35 + Math.sin(a) * 0.2;
        ctx.fillStyle = i % 2 ? "#FFAB40" : "#FF5722";
        ctx.beginPath();
        ctx.arc(
          cx - r * (0.9 + i * 0.12),
          cy + Math.sin(a * 1.3) * r * 0.35,
          3 + i * 0.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    case "frost":
      ctx.strokeStyle = "rgba(179,229,252,0.55)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * Math.PI * 2 + elapsed * 0.004;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * r * 1.35, cy + Math.sin(ang) * r * 1.35);
        ctx.stroke();
      }
      break;
    case "neon":
      for (let i = 0; i < 5; i++) {
        const hue = (elapsed * 0.05 + i * 55) % 360;
        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.65)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r * (1.05 + i * 0.08), elapsed * 0.006 + i, elapsed * 0.006 + i + 1.8);
        ctx.stroke();
      }
      break;
    case "royal":
      ctx.fillStyle = "rgba(255,215,0,0.45)";
      for (let i = 0; i < 6; i++) {
        const t = elapsed * 0.005 + i;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(t) * r * 0.95, cy - r * 1.1 + Math.sin(t * 2) * 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case "storm":
      if (Math.sin(elapsed * 0.02) > 0.88) {
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.2, cy - r * 0.55);
        ctx.lineTo(cx + r * 0.45, cy - r * 0.05);
        ctx.lineTo(cx + r * 0.05, cy - r * 0.15);
        ctx.lineTo(cx + r * 0.3, cy + r * 0.45);
        ctx.lineTo(cx - r * 0.05, cy);
        ctx.closePath();
        ctx.fill();
      }
      break;
    default:
      break;
  }
  ctx.globalAlpha = 1;
}

function drawRimLight(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 1.15, r * 1.05, 0, -0.8, 0.5);
  ctx.stroke();
}

/** High-resolution animated portrait for the aviary cards */
export function drawBirdRosterPortrait(
  ctx: CanvasRenderingContext2D,
  speciesId: string,
  w: number,
  h: number,
  elapsed: number,
  opts: { locked?: boolean } = {},
): void {
  const id = resolveBirdId(speciesId);
  const ui = BIRD_UI[id];
  const accent = ui?.accent ?? "#FFD54F";
  const locked = opts.locked ?? false;

  ctx.clearRect(0, 0, w, h);
  drawBackdrop(ctx, w, h, accent, elapsed, locked);

  const bob = Math.sin(elapsed * 0.0028) * 5;
  const cx = w * 0.52;
  const cy = h * 0.54 + bob;
  const r = Math.min(w, h) * 0.36;
  const flap = smoothFlap(elapsed);
  const blink = Math.sin(elapsed * 0.0013) > 0.992;

  drawSpeciesAura(ctx, id, cx, cy, r, elapsed);

  ctx.save();
  ctx.translate(cx, cy);
  const breathe = 1 + Math.sin(elapsed * 0.0035) * 0.04;
  ctx.scale(breathe, breathe);
  if (locked) ctx.globalAlpha = 0.72;

  ctx.shadowColor = accent;
  ctx.shadowBlur = 18 + Math.sin(elapsed * 0.004) * 8;
  drawSpeciesBird(ctx, id, r, flap, elapsed, {
    nitro: false,
    ghost: false,
    bossBoost: false,
    absorbing: false,
  });
  ctx.shadowBlur = 0;

  if (blink) {
    ctx.fillStyle = ui.glow;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(r * 0.38, -r * 0.14, r * 0.2, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawRimLight(ctx, 0, 0, r);
  ctx.restore();

  if (locked) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, w - 12, h - 12);
  }
}

export function setupRosterCanvas(
  canvas: HTMLCanvasElement,
  logicalW = ROSTER_PREVIEW_W,
  logicalH = ROSTER_PREVIEW_H,
): { ctx: CanvasRenderingContext2D; w: number; h: number } | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.max(1, Math.floor(logicalW * dpr));
  canvas.height = Math.max(1, Math.floor(logicalH * dpr));
  canvas.style.width = "100%";
  canvas.style.height = `${logicalH}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) {
    (ctx as CanvasRenderingContext2D & { imageSmoothingQuality: string }).imageSmoothingQuality =
      "high";
  }
  return { ctx, w: logicalW, h: logicalH };
}

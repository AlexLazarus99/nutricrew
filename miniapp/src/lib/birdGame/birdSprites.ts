import type { BirdId } from "./birdCatalog";
import { resolveBirdId } from "./birdModifiers";

export type BirdDrawOpts = {
  nitro: boolean;
  ghost: boolean;
  bossBoost: boolean;
  absorbing: boolean;
};

function wingY(flapAnim: number, r: number, side: -1 | 1): number {
  const flap = flapAnim > 0 ? -0.65 : 0.25;
  return flap * r * 0.32 * side;
}

function drawEye(ctx: CanvasRenderingContext2D, r: number, pupil = "#1a1a1a"): void {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(r * 0.35, -r * 0.15, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pupil;
  ctx.beginPath();
  ctx.arc(r * 0.42, -r * 0.15, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeak(ctx: CanvasRenderingContext2D, r: number, color: string, dark: string): void {
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(r * 0.88, 0);
  ctx.lineTo(r * 1.38, r * 0.1);
  ctx.lineTo(r * 0.88, r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(r * 0.9, r * 0.02);
  ctx.lineTo(r * 1.32, r * 0.09);
  ctx.lineTo(r * 0.9, r * 0.16);
  ctx.closePath();
  ctx.fill();
}

function drawWing(
  ctx: CanvasRenderingContext2D,
  r: number,
  flapAnim: number,
  fill: string,
  stroke?: string,
): void {
  ctx.fillStyle = fill;
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
  }
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, wingY(flapAnim, r, -1), r * 0.48, r * 0.3, -0.55, 0, Math.PI * 2);
  ctx.fill();
  if (stroke) ctx.stroke();
}

function drawClassic(
  ctx: CanvasRenderingContext2D,
  r: number,
  flapAnim: number,
  opts: BirdDrawOpts,
): void {
  const body = opts.bossBoost ? "#FFF59D" : opts.nitro ? "#FFE082" : "#FFD54F";
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.05, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#F9A825";
  ctx.lineWidth = 2;
  ctx.stroke();
  drawEye(ctx, r);
  drawBeak(ctx, r, "#FF8F00", "#E65100");
  drawWing(ctx, r, flapAnim, "#FBC02D", "#F9A825");
}

function drawEmber(
  ctx: CanvasRenderingContext2D,
  r: number,
  flapAnim: number,
  elapsed: number,
  opts: BirdDrawOpts,
): void {
  const pulse = 0.85 + Math.sin(elapsed * 0.012) * 0.15;
  const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.5);
  g.addColorStop(0, `rgba(255,171,64,${0.55 * pulse})`);
  g.addColorStop(1, "rgba(255,87,34,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
  ctx.fill();

  const body = opts.nitro ? "#FF8A65" : "#FF5722";
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.08, r * 0.98, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFAB40";
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, r * 0.05, r * 0.55, r * 0.45, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FF6F00";
  for (let i = 0; i < 5; i++) {
    const a = elapsed * 0.008 + i * 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * (0.9 + i * 0.08), Math.sin(a) * r * 0.25);
    ctx.lineTo(-r * (1.35 + Math.sin(a) * 0.1), Math.sin(a + 0.5) * r * 0.45);
    ctx.lineTo(-r * (0.75 + i * 0.06), Math.sin(a + 1) * r * 0.15);
    ctx.fill();
  }

  drawEye(ctx, r, "#3E2723");
  drawBeak(ctx, r, "#FF6D00", "#BF360C");
  drawWing(ctx, r, flapAnim, "#FF7043", "#E64A19");

  ctx.fillStyle = `rgba(255,235,59,${0.35 + pulse * 0.25})`;
  ctx.beginPath();
  ctx.arc(r * 0.5, -r * 0.35, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrost(
  ctx: CanvasRenderingContext2D,
  r: number,
  flapAnim: number,
  elapsed: number,
  opts: BirdDrawOpts,
): void {
  const shimmer = Math.sin(elapsed * 0.018) * 0.12;
  ctx.fillStyle = `rgba(179,229,252,${0.35 + shimmer})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.2, r * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = opts.nitro ? "#81D4FA" : "#4FC3F7";
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.06, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#E1F5FE";
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.1, r * 0.7, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#B3E5FC";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + elapsed * 0.004;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r * 0.5, Math.sin(ang) * r * 0.5);
    ctx.lineTo(Math.cos(ang) * r * 1.15, Math.sin(ang) * r * 1.15);
    ctx.stroke();
  }

  drawEye(ctx, r, "#01579B");
  ctx.fillStyle = "#0277BD";
  ctx.fillRect(r * 0.2, -r * 0.35, r * 0.45, r * 0.22);
  drawBeak(ctx, r, "#81D4FA", "#0288D1");
  drawWing(ctx, r, flapAnim, "#B3E5FC", "#4FC3F7");

  if (opts.ghost) {
    ctx.fillStyle = "rgba(224,247,250,0.5)";
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNeon(
  ctx: CanvasRenderingContext2D,
  r: number,
  flapAnim: number,
  elapsed: number,
  opts: BirdDrawOpts,
): void {
  const hue = (elapsed * 0.06) % 360;
  ctx.shadowColor = `hsl(${hue}, 90%, 65%)`;
  ctx.shadowBlur = opts.nitro ? 28 : 16;

  ctx.fillStyle = "#1A1033";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.05, r, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = `hsl(${(hue + 120) % 360}, 100%, 75%)`;
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, 0, r * 0.55, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  drawEye(ctx, r, "#E040FB");
  drawBeak(ctx, r, `hsl(${hue}, 100%, 65%)`, "#7B1FA2");
  drawWing(ctx, r, flapAnim, `hsl(${(hue + 60) % 360}, 95%, 70%)`);

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.sin(elapsed * 0.02) * 0.15})`;
  ctx.beginPath();
  ctx.arc(r * 0.15, -r * 0.25, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoyal(
  ctx: CanvasRenderingContext2D,
  r: number,
  flapAnim: number,
  elapsed: number,
): void {
  const bob = Math.sin(elapsed * 0.01) * r * 0.06;
  ctx.fillStyle = "#F3E5F5";
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, -r * 1.15 + bob);
  ctx.lineTo(0, -r * 1.55 + bob);
  ctx.lineTo(r * 0.15, -r * 1.15 + bob);
  ctx.lineTo(r * 0.22, -r * 0.85 + bob);
  ctx.lineTo(-r * 0.22, -r * 0.85 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.arc(0, -r * 1.35 + bob, r * 0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#CE93D8";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.08, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#AB47BC";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.05, r * 0.75, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  drawEye(ctx, r, "#4A148C");
  drawBeak(ctx, r, "#FFD54F", "#F57F17");
  drawWing(ctx, r, flapAnim, "#E1BEE7", "#8E24AA");

  ctx.strokeStyle = "rgba(255,215,0,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.2, elapsed * 0.005, elapsed * 0.005 + Math.PI * 1.4);
  ctx.stroke();
}

function drawStorm(
  ctx: CanvasRenderingContext2D,
  r: number,
  flapAnim: number,
  elapsed: number,
  opts: BirdDrawOpts,
): void {
  ctx.fillStyle = "#3949AB";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.1, r * 0.98, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5C6BC0";
  ctx.beginPath();
  ctx.ellipse(-r * 0.12, -r * 0.08, r * 0.6, r * 0.5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  const flash = Math.sin(elapsed * 0.025) > 0.92;
  if (flash || opts.bossBoost) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.moveTo(r * 0.1, -r * 0.5);
    ctx.lineTo(r * 0.35, r * 0.15);
    ctx.lineTo(r * 0.05, r * 0.05);
    ctx.lineTo(r * 0.25, r * 0.55);
    ctx.lineTo(-r * 0.05, r * 0.1);
    ctx.lineTo(-r * 0.2, -r * 0.45);
    ctx.closePath();
    ctx.fill();
  }

  drawEye(ctx, r, "#1A237E");
  drawBeak(ctx, r, "#FFEB3B", "#F9A825");
  drawWing(ctx, r, flapAnim, "#7986CB", "#303F9F");

  ctx.strokeStyle = "rgba(159,168,218,0.6)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const phase = elapsed * 0.01 + i * 2.1;
    ctx.beginPath();
    ctx.moveTo(-r * 1.1, Math.sin(phase) * r * 0.35);
    ctx.quadraticCurveTo(-r * 1.5, Math.sin(phase + 1) * r * 0.5, -r * 1.85, Math.sin(phase + 2) * r * 0.2);
    ctx.stroke();
  }
}

export function drawSpeciesBird(
  ctx: CanvasRenderingContext2D,
  speciesId: string,
  r: number,
  flapAnim: number,
  elapsed: number,
  opts: BirdDrawOpts,
): void {
  const id = resolveBirdId(speciesId);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (r > 36) {
    ctx.lineWidth = Math.max(2, r * 0.04);
  }
  switch (id) {
    case "ember":
      drawEmber(ctx, r, flapAnim, elapsed, opts);
      break;
    case "frost":
      drawFrost(ctx, r, flapAnim, elapsed, opts);
      break;
    case "neon":
      drawNeon(ctx, r, flapAnim, elapsed, opts);
      break;
    case "royal":
      drawRoyal(ctx, r, flapAnim, elapsed);
      break;
    case "storm":
      drawStorm(ctx, r, flapAnim, elapsed, opts);
      break;
    default:
      drawClassic(ctx, r, flapAnim, opts);
  }
  ctx.restore();
}

export function drawBirdTrail(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  speciesId: string,
  elapsed: number,
): void {
  const id = resolveBirdId(speciesId);
  if (id === "classic") return;

  const colors: Record<BirdId, string[]> = {
    classic: [],
    ember: ["#FF6F00", "#FFAB40", "#FF5722"],
    frost: ["#B3E5FC", "#E1F5FE", "#4FC3F7"],
    neon: ["#E040FB", "#7C4DFF", "#00E5FF"],
    royal: ["#E1BEE7", "#FFD700", "#AB47BC"],
    storm: ["#9FA8DA", "#FFEB3B", "#5C6BC0"],
  };
  const palette = colors[id];
  if (!palette.length) return;

  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const x = bx - 18 - i * 9 - Math.sin(elapsed * 0.02 + i) * 4;
    const y = by + Math.sin(elapsed * 0.015 + i * 0.8) * (4 + i);
    ctx.globalAlpha = 0.55 - t * 0.45;
    ctx.fillStyle = palette[i % palette.length];
    ctx.beginPath();
    ctx.arc(x, y, 3.5 - t * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Mini preview for shop cards */
export function drawBirdPreview(
  ctx: CanvasRenderingContext2D,
  speciesId: string,
  size: number,
  elapsed: number,
): void {
  ctx.save();
  ctx.translate(size / 2, size / 2);
  const flap = Math.sin(elapsed * 0.008) > 0 ? 1 : 0;
  drawSpeciesBird(ctx, speciesId, size * 0.22, flap, elapsed, {
    nitro: false,
    ghost: false,
    bossBoost: false,
    absorbing: false,
  });
  ctx.restore();
}

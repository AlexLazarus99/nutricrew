/** Soft painterly canvas helpers — layered blobs, moss, glow, no hard outlines. */

function fadeColor(color: string, alpha = 0): string {
  const rgba = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgba) return `rgba(${rgba[1]},${rgba[2]},${rgba[3]},${alpha})`;
  if (color.startsWith("#") && color.length >= 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return `rgba(0,0,0,${alpha})`;
}

export function safeComposite(ctx: CanvasRenderingContext2D, mode: GlobalCompositeOperation): void {
  try {
    ctx.globalCompositeOperation = mode;
  } catch {
    ctx.globalCompositeOperation = "source-over";
  }
}

export function phash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function softBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  highlight?: string,
): void {
  const g = ctx.createRadialGradient(x - rx * 0.25, y - ry * 0.3, 0, x, y, Math.max(rx, ry));
  g.addColorStop(0, highlight ?? color);
  g.addColorStop(0.55, color);
  g.addColorStop(1, fadeColor(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPainterlyCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  alpha: number,
  warm: boolean,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  const base = warm ? "rgba(255,220,190," : "rgba(255,255,255,";
  const blobs = [
    { ox: 0, oy: 0, rx: 34, ry: 16 },
    { ox: 26, oy: 3, rx: 26, ry: 14 },
    { ox: -18, oy: 4, rx: 22, ry: 12 },
    { ox: 12, oy: -6, rx: 20, ry: 11 },
  ];
  for (const b of blobs) {
    const g = ctx.createRadialGradient(
      x + b.ox * scale - b.rx * scale * 0.2,
      y + b.oy * scale - b.ry * scale * 0.25,
      0,
      x + b.ox * scale,
      y + b.oy * scale,
      b.rx * scale,
    );
    g.addColorStop(0, `${base}0.95)`);
    g.addColorStop(0.6, `${base}0.7)`);
    g.addColorStop(1, `${base}0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x + b.ox * scale, y + b.oy * scale, b.rx * scale, b.ry * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGodRays(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  elapsed: number,
  night: number,
): void {
  if (night > 0.55) return;
  ctx.save();
  const fade = 1 - night * 0.7;
  for (let i = 0; i < 6; i++) {
    const bx = w * (0.1 + i * 0.16) + Math.sin(elapsed * 0.0004 + i * 1.3) * 24;
    const g = ctx.createLinearGradient(bx, 0, bx + 60, groundY);
    g.addColorStop(0, `rgba(255,249,196,${0.14 * fade})`);
    g.addColorStop(0.4, `rgba(200,230,180,${0.07 * fade})`);
    g.addColorStop(1, "rgba(200,230,180,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx + 40 + i * 6, groundY);
    ctx.lineTo(bx - 18 + i * 4, groundY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawHorizonHaze(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  color: string,
  night: number,
): void {
  ctx.save();
  ctx.globalAlpha = 0.38 * (1 - night * 0.5);
  const g = ctx.createLinearGradient(0, groundY - 120, 0, groundY + 20);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.45, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, groundY - 130, w, 150);
  ctx.restore();
}

export function drawPurpleFlowers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  count: number,
): void {
  const petals = ["#CE93D8", "#BA68C8", "#AB47BC", "#E1BEE7"];
  for (let i = 0; i < count; i++) {
    const fx = x + (phash(i * 3.7) - 0.5) * 28 * scale;
    const fy = y + (phash(i * 5.1) - 0.5) * 12 * scale;
    const r = (3 + phash(i) * 2) * scale;
    ctx.fillStyle = petals[i % petals.length]!;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(a) * r, fy + Math.sin(a) * r, r * 0.55, r * 0.4, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#FFD54F";
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawMossPatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h));
  g.addColorStop(0, "rgba(129,199,132,0.8)");
  g.addColorStop(0.5, "rgba(76,175,80,0.6)");
  g.addColorStop(1, "rgba(56,142,60,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFramingTrunk(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  w: number,
  h: number,
  side: "left" | "right",
): void {
  const lean = side === "left" ? 0.08 : -0.08;
  const trunkG = ctx.createLinearGradient(x - w, baseY - h, x + w * 0.3, baseY);
  trunkG.addColorStop(0, "#3E2723");
  trunkG.addColorStop(0.35, "#5D4037");
  trunkG.addColorStop(0.7, "#6D4C41");
  trunkG.addColorStop(1, "#4E342E");
  ctx.fillStyle = trunkG;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, baseY);
  ctx.bezierCurveTo(x - w * 0.6, baseY - h * 0.5, x + w * lean, baseY - h * 0.85, x + w * 0.15, baseY - h);
  ctx.bezierCurveTo(x + w * 0.35, baseY - h * 0.7, x + w * 0.55, baseY - h * 0.3, x + w * 0.45, baseY);
  ctx.closePath();
  ctx.fill();
  drawMossPatch(ctx, x + w * 0.1, baseY - h * 0.35, w * 0.35, h * 0.12);
  softBlob(ctx, x + w * 0.2, baseY - h * 0.92, w * 0.7, h * 0.22, "rgba(46,125,50,0.85)", "rgba(129,199,132,0.9)");
}

export function drawForestSpire(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  h: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(x, baseY - h, x, baseY);
  g.addColorStop(0, "rgba(38,80,70,0.75)");
  g.addColorStop(1, "rgba(25,60,55,0.3)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.bezierCurveTo(x - 8, baseY - h * 0.4, x - 4, baseY - h * 0.75, x, baseY - h);
  ctx.bezierCurveTo(x + 4, baseY - h * 0.75, x + 8, baseY - h * 0.4, x, baseY);
  ctx.fill();
  ctx.restore();
}

export function drawPainterlyCanopy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  ch: number,
  w: number,
  seed: number,
  greens: [string, string, string],
): void {
  const lumps = [
    { ox: 0, oy: 0.5, rx: 0.5, ry: 0.4 },
    { ox: -0.2, oy: 0.42, rx: 0.38, ry: 0.32 },
    { ox: 0.18, oy: 0.38, rx: 0.36, ry: 0.3 },
  ];
  for (let i = 0; i < lumps.length; i++) {
    const l = lumps[i]!;
    const lx = cx + w * l.ox + (phash(seed + i) - 0.5) * w * 0.06;
    const ly = top + ch * l.oy;
    const rx = w * l.rx;
    const ry = ch * l.ry;
    const g = ctx.createRadialGradient(lx - rx * 0.2, ly - ry * 0.3, 0, lx, ly, rx);
    g.addColorStop(0, greens[0]);
    g.addColorStop(0.5, greens[1]);
    g.addColorStop(1, greens[2]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(lx, ly, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawAmbientParticles(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  elapsed: number,
  night: number,
): void {
  if (w < 8) return;
  ctx.save();
  for (let i = 0; i < 22; i++) {
    const px = (i * 61 + elapsed * (0.025 + (i % 4) * 0.01)) % w;
    const py = groundY * 0.2 + (i * 17 + Math.sin(elapsed * 0.0012 + i) * 35) % (groundY - 30);
    const glow = night > 0.45 ? 0.5 + Math.sin(elapsed * 0.005 + i) * 0.45 : 0.3;
    const color =
      night > 0.45
        ? `rgba(255,235,120,${glow * 0.55})`
        : `rgba(255,255,255,${glow * 0.4})`;
    const g = ctx.createRadialGradient(px, py, 0, px, py, 5);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, 2.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawAtmosphericBloom(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  night: number,
): void {
  if (night > 0.5) return;
  ctx.save();
  safeComposite(ctx, "screen");
  const g = ctx.createRadialGradient(w * 0.5, h * 0.12, 0, w * 0.5, h * 0.28, w * 0.75);
  g.addColorStop(0, `rgba(255,249,196,${0.1 * (1 - night)})`);
  g.addColorStop(0.45, `rgba(200,230,180,${0.05 * (1 - night)})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.35): void {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.55, h * 0.2, w * 0.5, h * 0.5, h * 0.85);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(15,23,42,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

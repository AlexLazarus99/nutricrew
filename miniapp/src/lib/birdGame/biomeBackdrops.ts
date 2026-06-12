import { biomePalette, type BiomeId } from "./progression";

export type BackdropCtx = {
  width: number;
  height: number;
  elapsed: number;
  worldScroll: number;
  groundY: number;
  night: number;
};

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function nightDim(c: BackdropCtx, strength = 0.4): number {
  return 1 - c.night * strength;
}

/** Wavy painterly hill band. */
function drawHillBand(
  ctx: CanvasRenderingContext2D,
  c: BackdropCtx,
  opts: {
    scroll: number;
    parallax: number;
    alpha: number;
    color: string;
    yOff: number;
    count: number;
    span: number;
    peakAmp: number;
  },
): void {
  const baseY = c.groundY + 6;
  ctx.globalAlpha = opts.alpha * nightDim(c);
  ctx.fillStyle = opts.color;
  const mod = opts.span;
  const offset = (opts.scroll * opts.parallax) % mod;
  for (let i = -2; i < opts.count; i++) {
    const lx = i * mod - offset;
    const peak = baseY - c.height * opts.yOff - (i % 5) * opts.peakAmp;
    ctx.beginPath();
    ctx.moveTo(lx - 40, baseY + 12);
    ctx.bezierCurveTo(lx + 25, peak, lx + 85, peak + 10, lx + 140, baseY + 6);
    ctx.bezierCurveTo(lx + 95, baseY + 18, lx + 35, baseY + 14, lx - 40, baseY + 12);
    ctx.fill();
  }
}

function drawForestSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  color: string,
  round: boolean,
): void {
  ctx.fillStyle = color;
  const w = 28 * scale;
  const h = 52 * scale;
  if (round) {
    ctx.beginPath();
    ctx.ellipse(x, baseY - h * 0.45, w * 0.55, h * 0.38, 0, 0, Math.PI * 2);
    ctx.ellipse(x - w * 0.2, baseY - h * 0.62, w * 0.38, h * 0.28, 0, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.18, baseY - h * 0.58, w * 0.35, h * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4E342E";
    ctx.fillRect(x - 3 * scale, baseY - h * 0.2, 6 * scale, h * 0.22);
  } else {
    ctx.beginPath();
    ctx.moveTo(x, baseY - h);
    ctx.lineTo(x - w * 0.5, baseY);
    ctx.lineTo(x + w * 0.5, baseY);
    ctx.closePath();
    ctx.fill();
  }
}

function drawConiferSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  color: string,
): void {
  ctx.fillStyle = color;
  const h = 58 * scale;
  const w = 22 * scale;
  for (let layer = 0; layer < 4; layer++) {
    const t = layer / 4;
    const top = baseY - h + t * h * 0.55;
    const bot = baseY - h + (t + 0.28) * h;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x - w * (0.9 - t * 0.2), bot);
    ctx.lineTo(x + w * (0.9 - t * 0.2), bot);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#4E342E";
  ctx.fillRect(x - 2.5 * scale, baseY - 8 * scale, 5 * scale, 10 * scale);
}

function drawCactusSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
): void {
  ctx.fillStyle = "#558B2F";
  const h = 42 * scale;
  ctx.fillRect(x - 4 * scale, baseY - h, 8 * scale, h);
  ctx.beginPath();
  ctx.ellipse(x, baseY - h - 4 * scale, 10 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 5 * scale, baseY - h * 0.65, 14 * scale, 5 * scale);
  ctx.fillRect(x + 16 * scale, baseY - h * 0.82, 5 * scale, h * 0.35);
}

function drawPalmSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  sway: number,
): void {
  ctx.fillStyle = "#4E342E";
  ctx.fillRect(x - 2 * scale, baseY - 48 * scale, 4 * scale, 48 * scale);
  ctx.strokeStyle = "#388E3C";
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = "round";
  for (let f = 0; f < 5; f++) {
    const angle = -0.9 + f * 0.45 + sway;
    ctx.beginPath();
    ctx.moveTo(x, baseY - 46 * scale);
    ctx.quadraticCurveTo(
      x + Math.cos(angle) * 28 * scale,
      baseY - 58 * scale + Math.sin(angle) * 10,
      x + Math.cos(angle) * 42 * scale,
      baseY - 50 * scale + Math.sin(angle) * 18,
    );
    ctx.stroke();
  }
}

function drawIceberg(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  w: number,
  h: number,
): void {
  const g = ctx.createLinearGradient(x, baseY - h, x, baseY);
  g.addColorStop(0, "rgba(240,248,255,0.95)");
  g.addColorStop(0.5, "rgba(200,230,245,0.85)");
  g.addColorStop(1, "rgba(176,216,232,0.7)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x + w * 0.35, baseY - h * 0.55);
  ctx.lineTo(x + w * 0.55, baseY - h);
  ctx.lineTo(x + w * 0.78, baseY - h * 0.48);
  ctx.lineTo(x + w, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, baseY - h * 0.72, w * 0.12, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Meadow — lush forest edge behind open field. */
export function drawMeadowForestBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const pal = biomePalette("meadow");
  const scroll = c.worldScroll;
  const baseY = c.groundY + 4;

  ctx.save();
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.08,
    alpha: 0.28,
    color: "rgba(90,143,120,0.5)",
    yOff: 0.38,
    count: 10,
    span: 110,
    peakAmp: 12,
  });
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.16,
    alpha: 0.4,
    color: "rgba(74,124,100,0.58)",
    yOff: 0.28,
    count: 12,
    span: 92,
    peakAmp: 16,
  });
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.28,
    alpha: 0.52,
    color: pal.farMountains,
    yOff: 0.18,
    count: 14,
    span: 78,
    peakAmp: 14,
  });

  const treeScroll = scroll * 0.15;
  ctx.globalAlpha = 0.5 * nightDim(c, 0.35);
  for (let i = 0; i < 18; i++) {
    const tx = ((i * 64 - treeScroll) % (c.width + 70)) - 20;
    drawForestSilhouette(ctx, tx, baseY - (i % 3) * 5, 0.9 + hash(i) * 0.4, "#3E5C40", true);
  }
  ctx.globalAlpha = 0.62 * nightDim(c, 0.3);
  for (let i = 0; i < 12; i++) {
    const tx = ((i * 88 - treeScroll * 1.25) % (c.width + 90)) - 25;
    drawConiferSilhouette(ctx, tx, baseY, 0.95 + hash(i + 7) * 0.35, "#2D4A32");
  }
  ctx.globalAlpha = 0.2 * nightDim(c);
  ctx.fillStyle = "rgba(180,220,160,0.35)";
  for (let i = 0; i < 6; i++) {
    const fx = ((i * 130 - scroll * 0.05) % (c.width + 60)) + 20;
    ctx.beginPath();
    ctx.ellipse(fx, baseY - 30 - i * 8, 50, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Deep forest — layered woods with mist. */
export function drawForestBiomeBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const scroll = c.worldScroll * 0.1;
  const baseY = c.groundY;
  const t = c.elapsed * 0.001;

  ctx.save();
  const mist = ctx.createLinearGradient(0, baseY - c.height * 0.5, 0, baseY);
  mist.addColorStop(0, "rgba(27,94,32,0.12)");
  mist.addColorStop(0.6, "rgba(27,94,32,0.28)");
  mist.addColorStop(1, "rgba(27,94,32,0.38)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, c.width, baseY);

  const layers = [
    { colors: ["#1B5E20", "#234D28"], alpha: 0.45, parallax: 0.7, count: 10, y: 28 },
    { colors: ["#2E7D32", "#33691E"], alpha: 0.58, parallax: 1, count: 14, y: 14 },
    { colors: ["#388E3C", "#43A047"], alpha: 0.72, parallax: 1.35, count: 16, y: 0 },
  ];

  for (let layer = 0; layer < layers.length; layer++) {
    const L = layers[layer]!;
    ctx.globalAlpha = L.alpha * nightDim(c, 0.45);
    const treeScroll = scroll * L.parallax;
    for (let i = 0; i < L.count; i++) {
      const tx = ((i * 58 - treeScroll) % (c.width + 55)) - 12;
      const col = L.colors[i % 2]!;
      if (i % 3 === 0) {
        drawConiferSilhouette(ctx, tx, baseY - L.y, 1.15 + layer * 0.18 + hash(i) * 0.25, col);
      } else {
        drawForestSilhouette(ctx, tx, baseY - L.y, 1.05 + layer * 0.15 + hash(i + 3) * 0.3, col, true);
      }
    }
  }

  ctx.globalAlpha = 0.15 * (0.7 + Math.sin(t * 0.8) * 0.3);
  ctx.fillStyle = "rgba(200,230,210,0.4)";
  for (let i = 0; i < 5; i++) {
    const mx = ((i * 160 - scroll * 0.3) % (c.width + 80)) - 20;
    ctx.beginPath();
    ctx.ellipse(mx, baseY - 60 - i * 15, 70, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Desert — mesas, dunes, distant cacti. */
export function drawDesertBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const scroll = c.worldScroll * 0.09;
  const baseY = c.groundY;
  const t = c.elapsed * 0.001;

  ctx.save();
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.1,
    alpha: 0.32,
    color: "rgba(230,160,80,0.35)",
    yOff: 0.22,
    count: 8,
    span: 150,
    peakAmp: 10,
  });
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.22,
    alpha: 0.48,
    color: "rgba(191,54,12,0.32)",
    yOff: 0.14,
    count: 10,
    span: 125,
    peakAmp: 18,
  });

  ctx.globalAlpha = 0.55 * nightDim(c);
  for (let i = -1; i < 9; i++) {
    const dx = i * 145 - scroll * 1.1;
    const h = 55 + (i % 3) * 28;
    ctx.fillStyle = i % 2 === 0 ? "rgba(161,98,60,0.55)" : "rgba(191,108,50,0.48)";
    ctx.beginPath();
    ctx.moveTo(dx, baseY + 4);
    ctx.bezierCurveTo(dx + 40, baseY - h, dx + 95, baseY - h * 0.7, dx + 150, baseY + 4);
    ctx.fill();
  }

  ctx.globalAlpha = 0.38 * nightDim(c);
  ctx.fillStyle = "rgba(255,213,128,0.25)";
  for (let i = 0; i < 7; i++) {
    const dx = ((i * 100 - scroll * 0.6) % (c.width + 80)) - 15;
    const dy = baseY + 2 + Math.sin(dx * 0.02 + t) * 2;
    ctx.beginPath();
    ctx.ellipse(dx + 40, dy, 55, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.5 * nightDim(c);
  for (let i = 0; i < 8; i++) {
    const cx = ((i * 75 - scroll * 1.4) % (c.width + 50)) - 10;
    drawCactusSilhouette(ctx, cx, baseY, 0.75 + hash(i) * 0.4);
  }
  ctx.restore();
}

/** Oasis — dunes with palm grove. */
export function drawOasisBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const scroll = c.worldScroll * 0.1;
  const baseY = c.groundY;
  const t = c.elapsed * 0.001;

  ctx.save();
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.12,
    alpha: 0.35,
    color: "rgba(255,193,7,0.28)",
    yOff: 0.2,
    count: 8,
    span: 140,
    peakAmp: 12,
  });
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.24,
    alpha: 0.5,
    color: "rgba(129,199,132,0.38)",
    yOff: 0.12,
    count: 10,
    span: 115,
    peakAmp: 16,
  });

  ctx.globalAlpha = 0.42 * nightDim(c);
  ctx.fillStyle = "rgba(102,187,106,0.35)";
  ctx.beginPath();
  ctx.ellipse(c.width * 0.55, baseY - 8, c.width * 0.35, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.65 * nightDim(c);
  for (let i = 0; i < 9; i++) {
    const px = ((i * 72 - scroll * 1.2) % (c.width + 60)) - 15;
    const sway = Math.sin(t * 1.5 + i) * 0.08;
    drawPalmSilhouette(ctx, px, baseY, 0.85 + hash(i) * 0.35, sway);
  }

  ctx.globalAlpha = 0.45 * nightDim(c);
  for (let i = 0; i < 6; i++) {
    const bx = ((i * 95 - scroll * 0.8) % (c.width + 40)) + 10;
    drawForestSilhouette(ctx, bx, baseY, 0.7 + hash(i + 2) * 0.25, "#2E7D32", true);
  }
  ctx.restore();
}

/** Antarctica — ice shelves and bergs. */
export function drawAntarcticaBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const scroll = c.worldScroll * 0.07;
  const baseY = c.groundY;

  ctx.save();
  ctx.globalAlpha = 0.25 * nightDim(c, 0.2);
  const skyGlow = ctx.createLinearGradient(0, 0, 0, baseY * 0.5);
  skyGlow.addColorStop(0, "rgba(180,220,255,0.2)");
  skyGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = skyGlow;
  ctx.fillRect(0, 0, c.width, baseY);

  ctx.globalAlpha = 0.5 * nightDim(c, 0.25);
  for (let i = -1; i < 8; i++) {
    const ix = i * 155 - scroll;
    drawIceberg(ctx, ix, baseY, 120 + (i % 3) * 30, 50 + (i % 4) * 18);
  }

  ctx.globalAlpha = 0.7 * nightDim(c, 0.3);
  for (let i = 0; i < 7; i++) {
    const ix = ((i * 110 - scroll * 1.3) % (c.width + 100)) - 30;
    const h = 35 + (i % 3) * 22;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.moveTo(ix, baseY + 2);
    ctx.lineTo(ix + 45, baseY - h);
    ctx.lineTo(ix + 95, baseY + 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 0.35 * nightDim(c);
  ctx.fillStyle = "rgba(220,240,255,0.5)";
  for (let i = 0; i < 12; i++) {
    const sx = (i * 47 + c.elapsed * 0.025) % c.width;
    const sy = (i * 31 + c.elapsed * 0.018) % (baseY - 30);
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Jungle — dense tropical canopy layers. */
export function drawJungleCanopyBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const scroll = c.worldScroll * 0.13;
  const baseY = c.groundY;
  const t = c.elapsed * 0.001;

  ctx.save();
  ctx.fillStyle = "rgba(13,71,20,0.2)";
  ctx.fillRect(0, 0, c.width, baseY);

  for (let layer = 0; layer < 4; layer++) {
    ctx.globalAlpha = (0.32 + layer * 0.14) * nightDim(c, 0.4);
    const layerScroll = scroll * (0.7 + layer * 0.22);
    for (let i = 0; i < 11 + layer * 2; i++) {
      const jx = ((i * 62 - layerScroll) % (c.width + 55)) - 12;
      const jy = baseY - 35 - layer * 22 - (i % 4) * 14;
      const rx = 34 + layer * 6 + hash(i) * 12;
      const ry = 24 + layer * 4;
      const g = ctx.createRadialGradient(jx, jy, 0, jx, jy, rx);
      g.addColorStop(0, `rgba(56,142,60,${0.55 - layer * 0.08})`);
      g.addColorStop(1, `rgba(27,94,32,${0.35 - layer * 0.06})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(jx + rx * 0.4, jy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 0.55 * nightDim(c);
  for (let i = 0; i < 10; i++) {
    const jx = ((i * 55 + scroll * 0.5) % (c.width + 40)) - 8;
    ctx.fillStyle = "rgba(27,94,32,0.5)";
    ctx.beginPath();
    ctx.moveTo(jx, baseY);
    ctx.lineTo(jx + 16, baseY - 75 - (i % 3) * 18);
    ctx.lineTo(jx + 34, baseY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 0.18 * (0.8 + Math.sin(t * 0.6) * 0.2);
  ctx.fillStyle = "rgba(129,199,132,0.35)";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(
      ((i * 180 - scroll * 0.2) % (c.width + 60)) + 40,
      baseY - 45 - i * 20,
      80,
      25,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

/** Mountains — alpine ridges and snow caps. */
export function drawMountainsBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const pal = biomePalette("mountains");
  const scroll = c.worldScroll * 0.11;
  const baseY = c.groundY;

  ctx.save();
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.14,
    alpha: 0.38,
    color: "rgba(96,125,139,0.45)",
    yOff: 0.26,
    count: 9,
    span: 130,
    peakAmp: 20,
  });
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.26,
    alpha: 0.55,
    color: pal.farMountains,
    yOff: 0.15,
    count: 11,
    span: 105,
    peakAmp: 28,
  });

  ctx.globalAlpha = 0.65 * nightDim(c, 0.35);
  for (let i = -1; i < 9; i++) {
    const mx = i * 118 - scroll * 1.15;
    const peak = 75 + (i % 4) * 32;
    const g = ctx.createLinearGradient(mx + 55, baseY - peak, mx + 55, baseY);
    g.addColorStop(0, "#B0BEC5");
    g.addColorStop(0.35, "#78909C");
    g.addColorStop(0.7, "#546E7A");
    g.addColorStop(1, "#455A64");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(mx, baseY + 4);
    ctx.lineTo(mx + 55, baseY - peak);
    ctx.lineTo(mx + 115, baseY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.moveTo(mx + 38, baseY - peak * 0.62);
    ctx.lineTo(mx + 55, baseY - peak);
    ctx.lineTo(mx + 72, baseY - peak * 0.58);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 0.5 * nightDim(c);
  const treeScroll = scroll * 1.5;
  for (let i = 0; i < 10; i++) {
    const tx = ((i * 80 - treeScroll) % (c.width + 60)) - 15;
    drawConiferSilhouette(ctx, tx, baseY, 0.7 + hash(i) * 0.3, "#37474F");
  }
  ctx.restore();
}

export function drawBiomeParallaxBackdrop(
  ctx: CanvasRenderingContext2D,
  biome: BiomeId,
  c: BackdropCtx,
): void {
  switch (biome) {
    case "meadow":
      drawMeadowForestBackdrop(ctx, c);
      break;
    case "forest":
      drawForestBiomeBackdrop(ctx, c);
      break;
    case "desert":
      drawDesertBackdrop(ctx, c);
      break;
    case "oasis":
      drawOasisBackdrop(ctx, c);
      break;
    case "antarctica":
      drawAntarcticaBackdrop(ctx, c);
      break;
    case "jungle":
      drawJungleCanopyBackdrop(ctx, c);
      break;
    case "mountains":
      drawMountainsBackdrop(ctx, c);
      break;
  }
}

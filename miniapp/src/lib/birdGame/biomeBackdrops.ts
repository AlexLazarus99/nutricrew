import { biomePalette, type BiomeId } from "./progression";
import {
  drawDistantBirds,
  drawForestSpire,
  drawHorizonHaze,
  drawMossyLog,
  drawMossPatch,
  drawPurpleFlowers,
  phash,
  softBlob,
} from "./painterly";

export type BackdropCtx = {
  width: number;
  height: number;
  elapsed: number;
  worldScroll: number;
  groundY: number;
  night: number;
};

function nightDim(c: BackdropCtx, strength = 0.4): number {
  return 1 - c.night * strength;
}

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

function drawPainterlyTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  seed: number,
): void {
  const h = 52 * scale;
  const w = 28 * scale;
  const trunkG = ctx.createLinearGradient(x - w * 0.15, baseY - h * 0.3, x + w * 0.1, baseY);
  trunkG.addColorStop(0, "#4E342E");
  trunkG.addColorStop(1, "#3E2723");
  ctx.fillStyle = trunkG;
  ctx.fillRect(x - w * 0.12, baseY - h * 0.28, w * 0.22, h * 0.3);

  softBlob(ctx, x, baseY - h * 0.55, w * 0.55, h * 0.38, "rgba(56,142,60,0.9)", "rgba(139,195,74,0.95)");
  softBlob(ctx, x - w * 0.22, baseY - h * 0.68, w * 0.38, h * 0.28, "rgba(46,125,50,0.85)", "rgba(129,199,132,0.9)");
  softBlob(ctx, x + w * 0.2, baseY - h * 0.62, w * 0.35, h * 0.26, "rgba(67,160,71,0.88)", "rgba(165,214,167,0.9)");

  if (phash(seed) > 0.55) {
    drawMossPatch(ctx, x + w * 0.05, baseY - h * 0.25, w * 0.2, h * 0.08);
  }
  if (phash(seed + 1) > 0.65) {
    drawPurpleFlowers(ctx, x + w * 0.3, baseY - 4, scale * 0.6, 2);
  }
}

/** Meadow — lush forest edge like reference. */
export function drawMeadowForestBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const pal = biomePalette("meadow");
  const scroll = c.worldScroll;
  const baseY = c.groundY + 4;

  ctx.save();
  drawHorizonHaze(ctx, c.width, baseY, "rgba(100,180,170,0.35)", c.night);

  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.08,
    alpha: 0.32,
    color: "rgba(60,120,110,0.5)",
    yOff: 0.38,
    count: 10,
    span: 110,
    peakAmp: 12,
  });
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.16,
    alpha: 0.45,
    color: "rgba(50,105,95,0.58)",
    yOff: 0.28,
    count: 12,
    span: 92,
    peakAmp: 16,
  });
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.28,
    alpha: 0.58,
    color: pal.farMountains,
    yOff: 0.18,
    count: 14,
    span: 78,
    peakAmp: 14,
  });

  for (let i = 0; i < 6; i++) {
    const sx = ((i * 140 - scroll * 0.06) % (c.width + 80)) + 30;
    drawForestSpire(ctx, sx, baseY - 8, 90 + (i % 3) * 35, 0.35 * nightDim(c));
  }

  const treeScroll = scroll * 0.15;
  ctx.globalAlpha = 0.58 * nightDim(c, 0.35);
  for (let i = 0; i < 16; i++) {
    const tx = ((i * 68 - treeScroll) % (c.width + 70)) - 20;
    drawPainterlyTree(ctx, tx, baseY - (i % 3) * 5, 0.95 + phash(i) * 0.4, i);
  }

  drawDistantBirds(ctx, c.width, baseY, scroll, c.night);

  ctx.globalAlpha = 0.55 * nightDim(c);
  drawMossyLog(ctx, ((scroll * 0.12) % (c.width + 80)) + 40, baseY - 2, 70, 10);
  ctx.restore();
}

/** Deep forest — dense painterly woods with mist. */
export function drawForestBiomeBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const scroll = c.worldScroll * 0.1;
  const baseY = c.groundY;
  const t = c.elapsed * 0.001;

  ctx.save();
  drawHorizonHaze(ctx, c.width, baseY, "rgba(40,90,75,0.4)", c.night);

  const mist = ctx.createLinearGradient(0, baseY - c.height * 0.5, 0, baseY);
  mist.addColorStop(0, "rgba(20,70,45,0.15)");
  mist.addColorStop(0.6, "rgba(27,94,32,0.32)");
  mist.addColorStop(1, "rgba(27,94,32,0.42)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, c.width, baseY);

  for (let layer = 0; layer < 3; layer++) {
    ctx.globalAlpha = (0.42 + layer * 0.16) * nightDim(c, 0.45);
    const treeScroll = scroll * (0.75 + layer * 0.28);
    for (let i = 0; i < 12 + layer * 4; i++) {
      const tx = ((i * 56 - treeScroll) % (c.width + 55)) - 12;
      drawPainterlyTree(ctx, tx, baseY - layer * 14, 1.1 + layer * 0.18 + phash(i + layer) * 0.3, i + layer);
    }
  }

  for (let i = 0; i < 8; i++) {
    const sx = ((i * 110 - scroll * 0.25) % (c.width + 60)) + 20;
    drawForestSpire(ctx, sx, baseY, 110 + (i % 4) * 30, 0.4 * nightDim(c));
  }

  ctx.globalAlpha = 0.18 * (0.7 + Math.sin(t * 0.8) * 0.3);
  ctx.fillStyle = "rgba(180,230,200,0.4)";
  for (let i = 0; i < 5; i++) {
    const mx = ((i * 160 - scroll * 0.3) % (c.width + 80)) - 20;
    ctx.beginPath();
    ctx.ellipse(mx, baseY - 60 - i * 15, 75, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDistantBirds(ctx, c.width, baseY, scroll, c.night);
  ctx.restore();
}

/** Desert — warm mesas with painterly dunes. */
export function drawDesertBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const scroll = c.worldScroll * 0.09;
  const baseY = c.groundY;
  const t = c.elapsed * 0.001;

  ctx.save();
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.1,
    alpha: 0.35,
    color: "rgba(255,200,120,0.38)",
    yOff: 0.22,
    count: 8,
    span: 150,
    peakAmp: 10,
  });
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.22,
    alpha: 0.52,
    color: "rgba(220,140,70,0.35)",
    yOff: 0.14,
    count: 10,
    span: 125,
    peakAmp: 18,
  });

  ctx.globalAlpha = 0.6 * nightDim(c);
  for (let i = -1; i < 9; i++) {
    const dx = i * 145 - scroll * 1.1;
    const h = 55 + (i % 3) * 28;
    const g = ctx.createLinearGradient(dx + 75, baseY - h, dx + 75, baseY);
    g.addColorStop(0, "rgba(210,130,70,0.55)");
    g.addColorStop(1, "rgba(180,100,50,0.45)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(dx, baseY + 4);
    ctx.bezierCurveTo(dx + 40, baseY - h, dx + 95, baseY - h * 0.7, dx + 150, baseY + 4);
    ctx.fill();
  }

  ctx.globalAlpha = 0.4 * nightDim(c);
  for (let i = 0; i < 7; i++) {
    const dx = ((i * 100 - scroll * 0.6) % (c.width + 80)) - 15;
    softBlob(ctx, dx + 40, baseY + 2 + Math.sin(dx * 0.02 + t) * 2, 55, 10, "rgba(255,213,128,0.3)", "rgba(255,235,180,0.35)");
  }
  ctx.restore();
}

/** Oasis — palms and green oasis glow. */
export function drawOasisBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const scroll = c.worldScroll * 0.1;
  const baseY = c.groundY;
  const t = c.elapsed * 0.001;

  ctx.save();
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.12,
    alpha: 0.38,
    color: "rgba(255,193,7,0.3)",
    yOff: 0.2,
    count: 8,
    span: 140,
    peakAmp: 12,
  });

  ctx.globalAlpha = 0.48 * nightDim(c);
  softBlob(ctx, c.width * 0.55, baseY - 8, c.width * 0.35, 28, "rgba(102,187,106,0.4)", "rgba(165,214,167,0.45)");

  ctx.globalAlpha = 0.7 * nightDim(c);
  for (let i = 0; i < 9; i++) {
    const px = ((i * 72 - scroll * 1.2) % (c.width + 60)) - 15;
    const sway = Math.sin(t * 1.5 + i) * 0.08;
    const scale = 0.85 + phash(i) * 0.35;
    ctx.fillStyle = "#4E342E";
    ctx.fillRect(px - 2 * scale, baseY - 48 * scale, 4 * scale, 48 * scale);
    ctx.strokeStyle = "#388E3C";
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = "round";
    for (let f = 0; f < 5; f++) {
      const angle = -0.9 + f * 0.45 + sway;
      ctx.beginPath();
      ctx.moveTo(px, baseY - 46 * scale);
      ctx.quadraticCurveTo(
        px + Math.cos(angle) * 28 * scale,
        baseY - 58 * scale,
        px + Math.cos(angle) * 42 * scale,
        baseY - 50 * scale,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Antarctica — ice shelves. */
export function drawAntarcticaBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const scroll = c.worldScroll * 0.07;
  const baseY = c.groundY;

  ctx.save();
  ctx.globalAlpha = 0.28 * nightDim(c, 0.2);
  const skyGlow = ctx.createLinearGradient(0, 0, 0, baseY * 0.5);
  skyGlow.addColorStop(0, "rgba(180,220,255,0.25)");
  skyGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = skyGlow;
  ctx.fillRect(0, 0, c.width, baseY);

  ctx.globalAlpha = 0.65 * nightDim(c, 0.3);
  for (let i = -1; i < 8; i++) {
    const ix = i * 155 - scroll;
    const w = 120 + (i % 3) * 30;
    const h = 50 + (i % 4) * 18;
    const g = ctx.createLinearGradient(ix, baseY - h, ix, baseY);
    g.addColorStop(0, "rgba(240,248,255,0.95)");
    g.addColorStop(0.5, "rgba(200,230,245,0.85)");
    g.addColorStop(1, "rgba(176,216,232,0.7)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ix, baseY);
    ctx.lineTo(ix + w * 0.35, baseY - h * 0.55);
    ctx.lineTo(ix + w * 0.55, baseY - h);
    ctx.lineTo(ix + w * 0.78, baseY - h * 0.48);
    ctx.lineTo(ix + w, baseY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Jungle — layered tropical canopy. */
export function drawJungleCanopyBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const scroll = c.worldScroll * 0.13;
  const baseY = c.groundY;
  const t = c.elapsed * 0.001;

  ctx.save();
  drawHorizonHaze(ctx, c.width, baseY, "rgba(30,80,50,0.38)", c.night);

  for (let layer = 0; layer < 4; layer++) {
    ctx.globalAlpha = (0.35 + layer * 0.14) * nightDim(c, 0.4);
    const layerScroll = scroll * (0.7 + layer * 0.22);
    for (let i = 0; i < 11 + layer * 2; i++) {
      const jx = ((i * 62 - layerScroll) % (c.width + 55)) - 12;
      const jy = baseY - 35 - layer * 22 - (i % 4) * 14;
      const rx = 34 + layer * 6 + phash(i) * 12;
      const ry = 24 + layer * 4;
      softBlob(
        ctx,
        jx + rx * 0.4,
        jy,
        rx,
        ry,
        `rgba(46,125,50,${0.75 - layer * 0.1})`,
        `rgba(129,199,132,${0.8 - layer * 0.08})`,
      );
    }
  }

  ctx.globalAlpha = 0.22 * (0.8 + Math.sin(t * 0.6) * 0.2);
  softBlob(ctx, c.width * 0.4, baseY - 50, 90, 28, "rgba(129,199,132,0.35)", "rgba(165,214,167,0.4)");
  ctx.restore();
}

/** Mountains — alpine ridges with snow. */
export function drawMountainsBackdrop(ctx: CanvasRenderingContext2D, c: BackdropCtx): void {
  const pal = biomePalette("mountains");
  const scroll = c.worldScroll * 0.11;
  const baseY = c.groundY;

  ctx.save();
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.14,
    alpha: 0.42,
    color: "rgba(96,125,139,0.48)",
    yOff: 0.26,
    count: 9,
    span: 130,
    peakAmp: 20,
  });
  drawHillBand(ctx, c, {
    scroll,
    parallax: 0.26,
    alpha: 0.58,
    color: pal.farMountains,
    yOff: 0.15,
    count: 11,
    span: 105,
    peakAmp: 28,
  });

  ctx.globalAlpha = 0.7 * nightDim(c, 0.35);
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
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.moveTo(mx + 38, baseY - peak * 0.62);
    ctx.lineTo(mx + 55, baseY - peak);
    ctx.lineTo(mx + 72, baseY - peak * 0.58);
    ctx.closePath();
    ctx.fill();
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

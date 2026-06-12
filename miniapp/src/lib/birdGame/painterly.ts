/** Painterly Rayman-like canvas helpers — soft blobs, moss, glow, no hard outlines. */

function fadeColor(color: string, alpha = 0): string {
  const rgba = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgba) {
    return `rgba(${rgba[1]},${rgba[2]},${rgba[3]},${alpha})`;
  }
  if (color.startsWith("#")) {
    const h = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return `rgba(${r},${g},${b},${alpha})`;
    }
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

/** Soft radial blob with optional highlight. */
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

/** Layered soft cloud puff. */
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

/** God rays filtering through canopy. */
export function drawGodRays(
  ctx: CanvasRenderingContext2D,
  w: number,
  _h: number,
  elapsed: number,
  night: number,
  groundY: number,
): void {
  if (night > 0.55) return;
  ctx.save();
  const fade = 1 - night * 0.7;
  for (let i = 0; i < 5; i++) {
    const bx = w * (0.15 + i * 0.18) + Math.sin(elapsed * 0.0004 + i) * 20;
    const g = ctx.createLinearGradient(bx, 0, bx + 60, groundY);
    g.addColorStop(0, `rgba(255,249,196,${0.12 * fade})`);
    g.addColorStop(0.4, `rgba(200,230,180,${0.06 * fade})`);
    g.addColorStop(1, "rgba(200,230,180,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx + 35 + i * 8, groundY);
    ctx.lineTo(bx - 15 + i * 5, groundY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Atmospheric teal haze at horizon. */
export function drawHorizonHaze(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  color: string,
  night: number,
): void {
  ctx.save();
  ctx.globalAlpha = 0.35 * (1 - night * 0.5);
  const g = ctx.createLinearGradient(0, groundY - 120, 0, groundY + 20);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.45, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, groundY - 130, w, 150);
  ctx.restore();
}

/** Distant bird silhouettes in sky. */
export function drawDistantBirds(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  scroll: number,
  night: number,
): void {
  if (night > 0.6) return;
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${0.35 * (1 - night)})`;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const bx = ((i * 95 - scroll * 0.04) % (w + 40)) - 10;
    const by = groundY * 0.18 + (i % 4) * 22 + Math.sin(scroll * 0.002 + i) * 6;
    const wing = 5 + (i % 3) * 2;
    ctx.beginPath();
    ctx.moveTo(bx - wing, by);
    ctx.quadraticCurveTo(bx, by - 3, bx + wing, by);
    ctx.stroke();
  }
  ctx.restore();
}

/** Purple flower cluster (reference accent color). */
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

/** Moss patch on bark or rock. */
export function drawMossPatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h));
  g.addColorStop(0, "rgba(129,199,132,0.75)");
  g.addColorStop(0.5, "rgba(76,175,80,0.55)");
  g.addColorStop(1, "rgba(56,142,60,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgba(104,159,56,${0.4 + phash(i) * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(
      x + (phash(i + 1) - 0.5) * w,
      y + (phash(i + 2) - 0.5) * h * 0.6,
      3 + phash(i + 3) * 4,
      2 + phash(i + 4) * 3,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/** Large framing tree trunk (reference sides). */
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
  drawMossPatch(ctx, x - w * 0.15, baseY - h * 0.6, w * 0.25, h * 0.1);

  const canopyX = x + w * 0.2;
  const canopyY = baseY - h * 0.92;
  softBlob(ctx, canopyX, canopyY, w * 0.7, h * 0.22, "rgba(46,125,50,0.85)", "rgba(129,199,132,0.9)");
  softBlob(ctx, canopyX - w * 0.25, canopyY + h * 0.05, w * 0.45, h * 0.16, "rgba(56,142,60,0.8)", "rgba(104,159,56,0.85)");
}

/** Mossy fallen log. */
export function drawMossyLog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  thick: number,
): void {
  const g = ctx.createLinearGradient(x, y - thick, x, y + thick);
  g.addColorStop(0, "#6D4C41");
  g.addColorStop(0.5, "#5D4037");
  g.addColorStop(1, "#4E342E");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x + len * 0.5, y, len * 0.5, thick, 0.05, 0, Math.PI * 2);
  ctx.fill();
  drawMossPatch(ctx, x + len * 0.35, y - thick * 0.5, len * 0.25, thick * 0.7);
  drawPurpleFlowers(ctx, x + len * 0.6, y - thick * 0.3, 0.7, 3);
}

/** Distant forest spire / tall thin tree tower. */
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
  g.addColorStop(0, "rgba(38,80,70,0.7)");
  g.addColorStop(0.5, "rgba(30,70,65,0.55)");
  g.addColorStop(1, "rgba(25,60,55,0.35)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.bezierCurveTo(x - 8, baseY - h * 0.4, x - 4, baseY - h * 0.75, x, baseY - h);
  ctx.bezierCurveTo(x + 4, baseY - h * 0.75, x + 8, baseY - h * 0.4, x, baseY);
  ctx.fill();
  ctx.restore();
}

/** Painterly canopy lumps — no outlines. */
export function drawPainterlyCanopy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  ch: number,
  w: number,
  seed: number,
): void {
  const lumps = [
    { ox: 0, oy: 0.5, rx: 0.5, ry: 0.4, hi: "#7CB342", mid: "#558B2F", lo: "#33691E" },
    { ox: -0.2, oy: 0.42, rx: 0.38, ry: 0.32, hi: "#8BC34A", mid: "#689F38", lo: "#388E3C" },
    { ox: 0.18, oy: 0.38, rx: 0.36, ry: 0.3, hi: "#9CCC65", mid: "#7CB342", lo: "#558B2F" },
    { ox: 0, oy: 0.28, rx: 0.34, ry: 0.26, hi: "#AED581", mid: "#8BC34A", lo: "#689F38" },
  ];
  for (let i = 0; i < lumps.length; i++) {
    const l = lumps[i]!;
    const jx = (phash(seed + i * 1.7) - 0.5) * w * 0.06;
    const jy = (phash(seed + i * 2.3) - 0.5) * ch * 0.04;
    const lx = cx + w * l.ox + jx;
    const ly = top + ch * l.oy + jy;
    const rx = w * l.rx;
    const ry = ch * l.ry;
    const g = ctx.createRadialGradient(lx - rx * 0.2, ly - ry * 0.3, 0, lx, ly, rx);
    g.addColorStop(0, l.hi);
    g.addColorStop(0.5, l.mid);
    g.addColorStop(1, l.lo);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(lx, ly, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Organic grass platform top with rocky underside. */
export function drawPainterlyGround(
  ctx: CanvasRenderingContext2D,
  w: number,
  landTop: number,
  h: number,
  pal: { landTop: string; landMid: string; landBot: string; landSoil: string; grass: string },
  scroll: number,
): void {
  const landG = ctx.createLinearGradient(0, landTop, 0, h);
  landG.addColorStop(0, pal.landTop);
  landG.addColorStop(0.2, pal.landMid);
  landG.addColorStop(0.5, pal.landBot);
  landG.addColorStop(0.75, "#6D5C4A");
  landG.addColorStop(1, pal.landSoil);
  ctx.fillStyle = landG;
  ctx.fillRect(0, landTop, w, h - landTop);

  ctx.fillStyle = pal.grass;
  for (let i = 0; i < 18; i++) {
    const gx = ((i * 47 + scroll * 0.3) % (w + 30)) - 5;
    const bump = Math.sin(gx * 0.04) * 3;
    softBlob(ctx, gx + 8, landTop + 1 + bump, 9, 5, pal.grass, "#AED581");
  }

  ctx.fillStyle = "rgba(62,39,35,0.45)";
  for (let i = 0; i < 6; i++) {
    const rx = ((i * 120 - scroll * 0.15) % (w + 60)) + 20;
    ctx.beginPath();
    ctx.moveTo(rx, landTop + 6);
    ctx.quadraticCurveTo(rx + 25, landTop + 22, rx + 50, landTop + 8);
    ctx.quadraticCurveTo(rx + 30, landTop + 14, rx, landTop + 6);
    ctx.fill();
  }

  for (let i = 0; i < 5; i++) {
    const fx = ((i * 130 + scroll * 0.2) % w) + 40;
    if (phash(i + 2) > 0.45) {
      drawPurpleFlowers(ctx, fx, landTop - 2, 0.85, 2 + (i % 3));
    }
  }
}

/** Floating pollen / firefly particles. */
export function drawAmbientParticles(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  elapsed: number,
  night: number,
): void {
  if (w < 8 || groundY < 24) return;
  const pySpan = Math.max(24, groundY - 20);
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const px = (i * 67 + elapsed * (0.02 + (i % 3) * 0.008)) % w;
    const py = (groundY * 0.25 + i * 19 + Math.sin(elapsed * 0.001 + i) * 30) % pySpan;
    const glow = night > 0.5 ? 0.6 + Math.sin(elapsed * 0.004 + i) * 0.4 : 0.25;
    const color =
      night > 0.5
        ? `rgba(255,235,120,${glow * 0.5})`
        : `rgba(200,230,180,${glow * 0.35})`;
    const g = ctx.createRadialGradient(px, py, 0, px, py, 4 + (i % 3));
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, 3 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Post-process bloom on bright areas near top. */
export function drawAtmosphericBloom(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  night: number,
): void {
  if (night > 0.45) return;
  ctx.save();
  safeComposite(ctx, "screen");
  const g = ctx.createRadialGradient(w * 0.5, h * 0.15, 0, w * 0.5, h * 0.3, w * 0.7);
  g.addColorStop(0, `rgba(255,249,196,${0.08 * (1 - night)})`);
  g.addColorStop(0.5, `rgba(200,230,180,${0.04 * (1 - night)})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Painterly ocean ambience: bubbles, fish, whale, sky-over-water layers. */

export type OceanDrawCtx = {
  width: number;
  height: number;
  elapsed: number;
  worldScroll: number;
  waterTop: number;
  floorY: number;
  seaBlend: number;
  birdX: number;
  birdY: number;
  night: number;
};

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  try {
    const [ar, ag, ab] = parse(a);
    const [br, bg, bb] = parse(b);
    const k = Math.max(0, Math.min(1, t));
    const r = Math.round(lerp(ar, br, k));
    const g = Math.round(lerp(ag, bg, k));
    const bl = Math.round(lerp(ab, bb, k));
    return `rgb(${r},${g},${bl})`;
  } catch {
    return a;
  }
}

/** Soft misty hills behind the shore — reference art style. */
export function drawPainterlyBackdrop(
  ctx: CanvasRenderingContext2D,
  c: OceanDrawCtx,
  shoreY: number,
): void {
  if (c.seaBlend < 0.08) return;
  const scroll = c.worldScroll * 0.08;
  const layers = [
    { color: "rgba(90,143,120,0.22)", parallax: 0.15, height: 0.28 },
    { color: "rgba(74,124,100,0.28)", parallax: 0.28, height: 0.22 },
    { color: "rgba(58,110,95,0.32)", parallax: 0.42, height: 0.18 },
  ];

  ctx.save();
  ctx.globalAlpha = c.seaBlend * (1 - c.night * 0.45);
  for (const layer of layers) {
    ctx.fillStyle = layer.color;
    for (let i = -1; i < 8; i++) {
      const baseX = i * 160 - (scroll * layer.parallax) % 160;
      const peak = shoreY - c.height * layer.height - 20 - (i % 3) * 12;
      ctx.beginPath();
      ctx.moveTo(baseX - 40, shoreY + 8);
      ctx.bezierCurveTo(baseX + 30, peak, baseX + 90, peak + 10, baseX + 150, shoreY + 6);
      ctx.bezierCurveTo(baseX + 110, shoreY + 14, baseX + 50, shoreY + 10, baseX - 40, shoreY + 8);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBubbles(ctx: CanvasRenderingContext2D, c: OceanDrawCtx): void {
  const count = 18;
  const t = c.elapsed * 0.001;
  ctx.save();
  ctx.globalAlpha = c.seaBlend * 0.55;

  for (let i = 0; i < count; i++) {
    const seed = i * 17.3;
    const bx =
      (hash(seed) * c.width + c.worldScroll * (0.3 + (i % 3) * 0.1) + t * (12 + (i % 4) * 6)) %
      (c.width + 40);
    const rise = (t * (28 + (i % 5) * 8) + hash(seed + 1) * 200) % (c.floorY - c.waterTop - 20);
    const by = c.floorY - 8 - rise;
    if (by < c.waterTop + 12) continue;
    const r = 2 + (i % 4) + hash(seed + 2) * 3;
    const g = ctx.createRadialGradient(bx - r * 0.3, by - r * 0.3, 0, bx, by, r);
    g.addColorStop(0, "rgba(255,255,255,0.75)");
    g.addColorStop(0.55, "rgba(200,240,255,0.35)");
    g.addColorStop(1, "rgba(120,200,220,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx - 20, by, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFishSchool(ctx: CanvasRenderingContext2D, c: OceanDrawCtx): void {
  const schools = 4;
  const t = c.elapsed * 0.001;
  ctx.save();
  ctx.globalAlpha = c.seaBlend * 0.7;

  for (let s = 0; s < schools; s++) {
    const seed = s * 31.7;
    const baseX =
      (hash(seed) * c.width * 1.4 - c.worldScroll * (0.55 + s * 0.08) + t * (18 + s * 4)) %
      (c.width + 120);
    const baseY = c.waterTop + 28 + hash(seed + 3) * (c.floorY - c.waterTop - 50);
    const fishCount = 3 + (s % 3);
    const dir = hash(seed + 4) > 0.5 ? 1 : -1;

    for (let f = 0; f < fishCount; f++) {
      const fx = baseX + f * 14 * dir;
      const fy = baseY + Math.sin(t * 3 + f + s) * 4;
      const scale = 0.7 + hash(seed + f) * 0.5;
      drawSoftFish(ctx, fx, fy, scale * dir, s % 3);
    }
  }
  ctx.restore();
}

function drawSoftFish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  variant: number,
): void {
  const colors = ["#FF8A80", "#FFD54F", "#81D4FA"];
  const body = colors[variant % colors.length];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir < 0 ? -1 : 1, 1);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lerpColor(body, "#ffffff", 0.35);
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(-12, -4);
  ctx.lineTo(-12, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#263238";
  ctx.beginPath();
  ctx.arc(4, -1, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWhale(ctx: CanvasRenderingContext2D, c: OceanDrawCtx): void {
  const cycle = 42000;
  const phase = (c.elapsed % cycle) / cycle;
  if (phase < 0.12 || phase > 0.88) return;

  const travel = (phase - 0.12) / 0.76;
  const x = lerp(c.width + 180, -220, travel);
  const y = c.waterTop + (c.floorY - c.waterTop) * 0.55 + Math.sin(travel * Math.PI * 2) * 8;
  const alpha = Math.sin(travel * Math.PI) * c.seaBlend * 0.85;
  if (alpha < 0.05) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(x - 60, y, x + 60, y);
  grad.addColorStop(0, "#5C6BC0");
  grad.addColorStop(0.5, "#7986CB");
  grad.addColorStop(1, "#9FA8DA");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, 58, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 50, y);
  ctx.quadraticCurveTo(x - 75, y - 18, x - 88, y - 4);
  ctx.quadraticCurveTo(x - 72, y + 6, x - 50, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.ellipse(x + 12, y - 6, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a237e";
  ctx.beginPath();
  ctx.arc(x + 28, y - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBirdOceanReflection(ctx: CanvasRenderingContext2D, c: OceanDrawCtx): void {
  if (c.seaBlend < 0.45 || c.birdY < c.waterTop - 30) return;
  ctx.save();
  ctx.globalAlpha = c.seaBlend * 0.2;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.ellipse(c.birdX, c.waterTop + 8, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Extra soft surface waves on top of water fill. */
export function drawSoftOceanSurface(ctx: CanvasRenderingContext2D, c: OceanDrawCtx): void {
  if (c.seaBlend < 0.05) return;
  const t = c.elapsed * 0.001;
  ctx.save();
  ctx.globalAlpha = c.seaBlend;

  const surfaceGrad = ctx.createLinearGradient(0, c.waterTop - 20, 0, c.waterTop + 30);
  surfaceGrad.addColorStop(0, "rgba(200,235,245,0)");
  surfaceGrad.addColorStop(0.5, "rgba(160,220,235,0.25)");
  surfaceGrad.addColorStop(1, "rgba(80,180,200,0.15)");
  ctx.fillStyle = surfaceGrad;
  ctx.fillRect(0, c.waterTop - 20, c.width, 50);

  for (let layer = 0; layer < 3; layer++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.35 - layer * 0.08})`;
    ctx.lineWidth = 2.5 - layer * 0.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let x = 0; x <= c.width; x += 6) {
      const y =
        c.waterTop +
        Math.sin(x * 0.035 + t * (2 + layer * 0.4) + layer) * (5 - layer) +
        layer * 5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Distant gulls gliding over the open ocean. */
function drawOceanSkyBirds(ctx: CanvasRenderingContext2D, c: OceanDrawCtx): void {
  if (c.seaBlend < 0.35) return;
  const t = c.elapsed * 0.001;
  const birds = 3;
  ctx.save();
  ctx.globalAlpha = c.seaBlend * 0.55;

  for (let i = 0; i < birds; i++) {
    const seed = i * 23.1;
    const bx =
      (hash(seed) * c.width * 1.3 - c.worldScroll * (0.12 + i * 0.04) + t * (22 + i * 6)) %
      (c.width + 80);
    const by = c.waterTop - 48 - hash(seed + 2) * 36 - Math.sin(t * 1.8 + i) * 6;
    const wing = Math.sin(t * 5 + i * 1.7) * 5;
    const scale = 0.85 + hash(seed + 5) * 0.35;

    ctx.save();
    ctx.translate(bx - 30, by);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, wing * 0.3);
    ctx.quadraticCurveTo(0, -4 - Math.abs(wing), 10, wing * 0.3);
    ctx.stroke();
    ctx.fillStyle = "rgba(240,248,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(0, 1, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawOceanAmbience(ctx: CanvasRenderingContext2D, c: OceanDrawCtx): void {
  if (c.seaBlend < 0.12) return;
  drawOceanSkyBirds(ctx, c);
  drawBubbles(ctx, c);
  drawFishSchool(ctx, c);
  drawWhale(ctx, c);
  drawBirdOceanReflection(ctx, c);
}

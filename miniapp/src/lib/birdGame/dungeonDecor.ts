import type { ElevationDrawCtx } from "./elevationZones";

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function dungeonStrength(c: ElevationDrawCtx): number {
  const maxDrop = Math.max(1, c.height * 0.2);
  return Math.min(1, c.ceilingY / maxDrop);
}

/** Dark painterly cave atmosphere over the sky. */
function drawDungeonAtmosphere(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  ctx.save();
  ctx.globalAlpha = s * 0.72;
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, "rgba(18,14,22,0.55)");
  g.addColorStop(0.45, "rgba(32,26,38,0.42)");
  g.addColorStop(1, "rgba(48,38,52,0.28)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.restore();
}

/** Soft rounded side walls framing the corridor. */
function drawDungeonWalls(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const scroll = c.worldScroll * 0.14;
  const floor = c.floorY;
  const ceil = c.ceilingY;
  const wallW = 52;

  ctx.save();
  ctx.globalAlpha = s * 0.88;

  for (let side = 0; side < 2; side++) {
    const x0 = side === 0 ? 0 : c.width - wallW;
    const wallG = ctx.createLinearGradient(x0, ceil, side === 0 ? wallW : c.width, floor);
    wallG.addColorStop(0, "#3D3428");
    wallG.addColorStop(0.4, "#4A4036");
    wallG.addColorStop(1, "#5C5044");
    ctx.fillStyle = wallG;
    ctx.beginPath();
    ctx.moveTo(x0, ceil - 8);
    for (let y = ceil; y <= floor + 12; y += 14) {
      const bulge = Math.sin((y + scroll) * 0.04 + side) * 6;
      ctx.lineTo(x0 + (side === 0 ? wallW + bulge : -bulge), y);
    }
    ctx.lineTo(x0 + (side === 0 ? wallW : 0), floor + 14);
    ctx.lineTo(x0, floor + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 5; i++) {
      const ly = ceil + 30 + i * ((floor - ceil) / 5);
      const lx = side === 0 ? wallW * 0.55 : c.width - wallW * 0.45;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Rocky cave floor with moss tufts and pebbles. */
function drawDungeonFloor(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const floor = c.floorY;
  const scroll = c.worldScroll * 0.2;
  const top = floor - 6;

  ctx.save();
  ctx.globalAlpha = s;

  const floorG = ctx.createLinearGradient(0, top - 28, 0, c.height);
  floorG.addColorStop(0, "#5C5044");
  floorG.addColorStop(0.35, "#4A4036");
  floorG.addColorStop(0.7, "#3D3428");
  floorG.addColorStop(1, "#2A241C");
  ctx.fillStyle = floorG;
  ctx.beginPath();
  ctx.moveTo(0, top);
  for (let x = 0; x <= c.width; x += 8) {
    const wave = Math.sin((x + scroll) * 0.03) * 4;
    ctx.lineTo(x, top + wave);
  }
  ctx.lineTo(c.width, c.height);
  ctx.lineTo(0, c.height);
  ctx.closePath();
  ctx.fill();

  for (let i = 0; i < 8; i++) {
    const px = ((i * 89 - scroll) % (c.width + 50)) - 10;
    const py = top + 6 + (i % 3) * 3;
    const rx = 10 + (i % 4) * 5;
    const g = ctx.createRadialGradient(px - 3, py - 2, 0, px, py, rx);
    g.addColorStop(0, "#6B5D50");
    g.addColorStop(1, "#4A4036");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, rx, rx * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#4D8F50";
  for (let i = 0; i < 6; i++) {
    const mx = ((i * 72 - scroll * 0.6) % (c.width + 40)) + 8;
    ctx.beginPath();
    ctx.ellipse(mx, top + 2, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Stalactites with soft painterly gradients. */
function drawStalactites(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const ceil = c.ceilingY;
  const scroll = c.worldScroll * 0.18;
  const count = 14;

  ctx.save();
  ctx.globalAlpha = s * 0.95;

  for (let i = 0; i < count; i++) {
    const seed = i * 19.7;
    const sx = ((hash(seed) * c.width + scroll * (0.8 + (i % 3) * 0.15)) % (c.width + 30)) - 8;
    const len = 12 + (i % 5) * 9 + hash(seed + 1) * 14;
    const halfW = 4 + (i % 3) * 2;

    const g = ctx.createLinearGradient(sx, ceil, sx, ceil + len);
    g.addColorStop(0, "#6B5D50");
    g.addColorStop(0.5, "#4A4036");
    g.addColorStop(1, "#3D3428");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx - halfW, ceil);
    ctx.quadraticCurveTo(sx + 2, ceil + len * 0.55, sx, ceil + len);
    ctx.quadraticCurveTo(sx - 3, ceil + len * 0.5, sx + halfW, ceil);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(sx - 1, ceil + 2, halfW * 0.45, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Floor stalagmites — parallax props. */
function drawStalagmites(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const floor = c.floorY;
  const scroll = c.worldScroll * 0.24;
  const count = 10;

  ctx.save();
  ctx.globalAlpha = s * 0.9;

  for (let i = 0; i < count; i++) {
    const seed = i * 23.3;
    const sx = ((hash(seed) * c.width * 1.1 - scroll) % (c.width + 40)) - 10;
    const h = 14 + (i % 4) * 10 + hash(seed + 2) * 12;
    const halfW = 5 + (i % 3) * 3;

    const g = ctx.createLinearGradient(sx, floor - h, sx, floor + 4);
    g.addColorStop(0, "#7A6B5C");
    g.addColorStop(0.55, "#5C5044");
    g.addColorStop(1, "#3D3428");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx - halfW, floor + 2);
    ctx.quadraticCurveTo(sx - 1, floor - h * 0.55, sx, floor - h);
    ctx.quadraticCurveTo(sx + 2, floor - h * 0.5, sx + halfW, floor + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Glowing crystals — magenta / teal accents. */
function drawCrystals(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const scroll = c.worldScroll * 0.16;
  const t = c.elapsed * 0.001;
  const colors = ["#CE93D8", "#AB47BC", "#4DD0E1", "#E040FB"];
  const count = 7;

  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 31.1;
    const cx = ((hash(seed) * c.width - scroll * (0.5 + i * 0.05)) % (c.width + 60)) - 15;
    const cy = c.ceilingY + 40 + hash(seed + 3) * (c.floorY - c.ceilingY - 80);
    const pulse = 0.7 + Math.sin(t * 2.5 + i) * 0.3;
    const col = colors[i % colors.length]!;

    ctx.globalAlpha = s * 0.55 * pulse;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    glow.addColorStop(0, col + "88");
    glow.addColorStop(1, col + "00");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = s * 0.85;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12);
    ctx.quadraticCurveTo(cx + 8, cy, cx, cy + 10);
    ctx.quadraticCurveTo(cx - 8, cy, cx, cy - 12);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy - 4, 3, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Wall torches with warm flicker. */
function drawTorches(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const scroll = c.worldScroll * 0.12;
  const t = c.elapsed * 0.001;
  const count = 5;

  ctx.save();
  for (let i = 0; i < count; i++) {
    const tx = ((i * 145 - scroll * 0.35) % (c.width + 80)) + 20;
    const ty = c.ceilingY + 36 + (i % 3) * 28;
    const flicker = 0.85 + Math.sin(t * 8 + i * 2.1) * 0.15;

    ctx.globalAlpha = s * 0.35 * flicker;
    const glow = ctx.createRadialGradient(tx, ty - 8, 0, tx, ty - 8, 48);
    glow.addColorStop(0, "rgba(255,183,77,0.55)");
    glow.addColorStop(0.5, "rgba(255,143,0,0.18)");
    glow.addColorStop(1, "rgba(255,143,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(tx, ty - 8, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = s;
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(tx - 2, ty, 4, 14);

    ctx.fillStyle = `rgba(255,${Math.round(160 + flicker * 40)},60,0.95)`;
    ctx.beginPath();
    ctx.moveTo(tx, ty - 4);
    ctx.quadraticCurveTo(tx + 6 * flicker, ty - 14, tx + 2, ty - 20);
    ctx.quadraticCurveTo(tx - 5 * flicker, ty - 12, tx, ty - 4);
    ctx.fill();
  }
  ctx.restore();
}

/** Shallow underground puddles on the floor. */
function drawPuddles(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const scroll = c.worldScroll * 0.22;
  const floor = c.floorY;
  const t = c.elapsed * 0.001;

  ctx.save();
  ctx.globalAlpha = s * 0.5;
  for (let i = 0; i < 4; i++) {
    const px = ((i * 120 - scroll) % (c.width + 50)) + 10;
    const py = floor + 4 + Math.sin(t + i) * 1.5;
    const rx = 22 + (i % 3) * 8;
    const g = ctx.createRadialGradient(px - 4, py - 2, 0, px, py, rx);
    g.addColorStop(0, "rgba(120,200,220,0.45)");
    g.addColorStop(0.6, "rgba(60,140,160,0.25)");
    g.addColorStop(1, "rgba(40,100,120,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, rx, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Rounded cave mushrooms. */
function drawMushrooms(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const scroll = c.worldScroll * 0.26;
  const floor = c.floorY;
  const count = 6;

  ctx.save();
  ctx.globalAlpha = s * 0.9;
  for (let i = 0; i < count; i++) {
    const mx = ((i * 98 - scroll) % (c.width + 30)) + 5;
    const my = floor - 1;
    const scale = 0.8 + (i % 3) * 0.25;
    const capColor = i % 2 === 0 ? "#E57373" : "#FFB74D";

    ctx.fillStyle = "#8D6E63";
    ctx.beginPath();
    ctx.ellipse(mx, my - 4 * scale, 3 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.ellipse(mx, my - 10 * scale, 9 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(mx - 2 * scale, my - 11 * scale, 2 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Small bats silhouettes. */
function drawBats(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const t = c.elapsed * 0.001;
  const scroll = c.worldScroll * 0.08;
  const count = 4;

  ctx.save();
  ctx.globalAlpha = s * 0.45;
  ctx.fillStyle = "#2A241C";
  for (let i = 0; i < count; i++) {
    const bx = ((hash(i * 17) * c.width - scroll * (0.3 + i * 0.1)) % (c.width + 40)) - 10;
    const by = c.ceilingY + 50 + hash(i * 11) * (c.floorY - c.ceilingY - 100);
    const wing = Math.sin(t * 6 + i * 1.5) * 5;
    ctx.beginPath();
    ctx.moveTo(bx - 8, by + wing * 0.2);
    ctx.quadraticCurveTo(bx, by - 4 - Math.abs(wing), bx + 8, by + wing * 0.2);
    ctx.quadraticCurveTo(bx, by + 2, bx - 8, by + wing * 0.2);
    ctx.fill();
  }
  ctx.restore();
}

/** Floating dust motes in torchlight. */
function drawDustMotes(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const t = c.elapsed * 0.001;
  ctx.save();
  ctx.globalAlpha = s * 0.35;
  ctx.fillStyle = "rgba(255,220,180,0.8)";
  for (let i = 0; i < 16; i++) {
    const seed = i * 13.7;
    const px = (hash(seed) * c.width + t * (8 + (i % 4) * 4)) % c.width;
    const py = c.ceilingY + 20 + ((t * (12 + i * 3) + hash(seed + 1) * 200) % (c.floorY - c.ceilingY - 30));
    const r = 1 + (i % 3);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Faint cobwebs in upper corners. */
function drawCobwebs(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  ctx.save();
  ctx.globalAlpha = s * 0.22;
  ctx.strokeStyle = "rgba(220,220,230,0.7)";
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  for (let side = 0; side < 2; side++) {
    const ox = side === 0 ? 28 : c.width - 28;
    const oy = c.ceilingY + 12;
    for (let strand = 0; strand < 4; strand++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(
        ox + (side === 0 ? 40 : -40),
        oy + 20 + strand * 8,
        ox + (side === 0 ? 70 : -70),
        oy + 35 + strand * 6,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Cave ceiling rock mass (top layer). */
function drawCeilingRock(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx, s: number): void {
  const ceil = c.ceilingY;
  ctx.save();
  ctx.globalAlpha = s * 0.95;
  const caveG = ctx.createLinearGradient(0, 0, 0, ceil + 36);
  caveG.addColorStop(0, "#1A1612");
  caveG.addColorStop(0.5, "#322A22");
  caveG.addColorStop(1, "rgba(50,42,34,0)");
  ctx.fillStyle = caveG;
  ctx.fillRect(0, 0, c.width, ceil + 32);
  ctx.restore();
}

/** Full dungeon backdrop — call from nature layer. */
export function drawDungeonBackdrop(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx): void {
  const s = dungeonStrength(c);
  if (s < 0.06 || c.ceilingY < 8) return;

  drawDungeonAtmosphere(ctx, c, s);
  drawCeilingRock(ctx, c, s);
  drawDungeonWalls(ctx, c, s);
  drawStalactites(ctx, c, s);
  drawCobwebs(ctx, c, s);
  drawCrystals(ctx, c, s);
  drawTorches(ctx, c, s);
  drawBats(ctx, c, s);
  drawDustMotes(ctx, c, s);
  drawDungeonFloor(ctx, c, s);
  drawPuddles(ctx, c, s);
  drawMushrooms(ctx, c, s);
}

/** Scrolling floor props — call in gameplay layer (behind junk). */
export function drawDungeonGameplayProps(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx): void {
  const s = dungeonStrength(c);
  if (s < 0.06) return;
  drawStalagmites(ctx, c, s * 0.85);
}
